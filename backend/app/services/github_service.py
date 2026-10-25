import asyncio
import base64
import hashlib
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.models.project import Project
from app.models.repository import Repository
from app.models.repository_import_job import RepositoryImportJob
from app.models.workspace_file import WorkspaceFile
from app.services.workspace_service import WorkspaceService

# Ignored directories and file patterns
IGNORED_DIRS = {
    ".git", ".github", "node_modules", "venv", ".venv", "env",
    "__pycache__", ".pytest_cache", ".ruff_cache", "dist", "build",
    ".idea", ".vscode", "target", "vendor", "bin", "obj",
    ".next", ".nuxt", "coverage", ".cache"
}

IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".exe", ".dll", ".so", ".dylib", ".bin",
    ".pdf", ".doc", ".docx", ".mp3", ".mp4", ".mov", ".avi",
    ".pyc", ".pyo", ".pyd", ".class", ".jar",
    ".faiss", ".pkl", ".pickle", ".parquet", ".npy", ".npz",
    ".h5", ".onnx", ".pt", ".pth", ".db", ".sqlite", ".sqlite3"
}

PRIMARY_CODE_EXTENSIONS = {
    ".html", ".htm", ".css", ".scss", ".sass", ".less",
    ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue", ".svelte",
    ".py", ".pyw", ".java", ".go", ".rs", ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp",
    ".cs", ".php", ".rb", ".kt", ".kts", ".swift", ".dart",
    ".sql", ".graphql", ".gql"
}

CONFIG_DOC_EXTENSIONS = {
    ".json", ".yaml", ".yml", ".xml", ".toml", ".ini",
    ".md", ".markdown", ".sh", ".bash", ".zsh", ".ps1"
}

SPECIAL_CODE_NAMES = {
    "dockerfile", "procfile", ".env.example", ".gitignore", "makefile"
}


def get_file_priority(path: str) -> int:
    clean = path.replace("\\", "/").lower()
    filename = clean.split("/")[-1]
    dot_idx = filename.rfind(".")
    ext = filename[dot_idx:] if dot_idx != -1 else ""

    if filename in SPECIAL_CODE_NAMES or ext in PRIMARY_CODE_EXTENSIONS:
        return 0  # Priority 0: Source code & Web markup (HTML, CSS, JS, Python, etc.)
    if ext in CONFIG_DOC_EXTENSIONS:
        return 1  # Priority 1: Configurations, scripts, documentation
    return 2      # Priority 2: Datasets, raw text, logs


def parse_and_validate_github_url(url: str) -> Tuple[str, str, Optional[str]]:
    """
    Validates a GitHub repository URL and extracts (owner, repo, branch).
    Supports:
    - https://github.com/owner/repo
    - https://github.com/owner/repo.git
    - https://github.com/owner/repo/tree/branch-name
    - https://github.com/owner/repo/blob/branch-name
    Rejects SSRF, non-github hosts, and invalid URL formats.
    """
    if not url or not isinstance(url, str):
        raise ValueError("GitHub URL cannot be empty.")

    clean_url = url.strip()
    parsed = urlparse(clean_url)

    if parsed.scheme not in ("http", "https"):
        raise ValueError("Invalid URL scheme. Must use https://.")

    host = (parsed.hostname or "").lower()
    if host not in ("github.com", "www.github.com"):
        raise ValueError(f"Invalid host '{host}'. Only 'github.com' is allowed.")

    # Path format: /owner/repo, /owner/repo.git, or /owner/repo/tree/branch
    path = parsed.path.strip("/")
    parts = [p for p in path.split("/") if p]

    if len(parts) < 2:
        raise ValueError("Invalid GitHub repository URL. Expected format: https://github.com/owner/repository")

    owner = parts[0]
    repo = parts[1].removesuffix(".git")
    branch = None

    if len(parts) >= 4 and parts[2] in ("tree", "blob"):
        branch = parts[3]

    # Validate characters (GitHub username and repo rules)
    if not re.match(r"^[a-zA-Z0-9_\-\.]+$", owner):
        raise ValueError(f"Invalid repository owner '{owner}'.")
    if not re.match(r"^[a-zA-Z0-9_\-\.]+$", repo):
        raise ValueError(f"Invalid repository name '{repo}'.")

    return owner, repo, branch


def is_eligible_file(path: str) -> bool:
    """Checks whether a file should be imported into the workspace."""
    parts = path.replace("\\", "/").split("/")
    for part in parts[:-1]:
        if part in IGNORED_DIRS or part.startswith("."):
            return False

    filename = parts[-1]
    if filename.startswith(".") and filename not in (".env.example", ".gitignore"):
        return False

    # Check extension
    dot_idx = filename.rfind(".")
    if dot_idx != -1:
        ext = filename[dot_idx:].lower()
        if ext in IGNORED_EXTENSIONS:
            return False

    return True


class GitHubService:
    def __init__(self, db: Session):
        self.db = db

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AutonomusAI-Platform/1.0",
        }
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
        return headers

    async def fetch_repo_metadata(self, owner: str, repo: str) -> Dict[str, Any]:
        """Fetches public repository metadata from GitHub REST API."""
        url = f"https://api.github.com/repos/{owner}/{repo}"
        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(url, headers=headers)
            except httpx.RequestError as exc:
                raise ValueError(f"Failed to connect to GitHub: {exc}")

            if response.status_code == 404:
                raise ValueError(
                    f"Repository '{owner}/{repo}' not found on GitHub. "
                    "Make sure it is public and spelled correctly."
                )
            elif response.status_code == 403:
                rate_limit_reset = response.headers.get("x-ratelimit-reset")
                raise ValueError("GitHub API rate limit exceeded. Please configure GITHUB_TOKEN or try again later.")
            elif response.status_code != 200:
                raise ValueError(f"GitHub API returned error: {response.status_code} {response.text}")

            return response.json()

    async def import_repository(
        self,
        github_url: str,
        branch: Optional[str] = None,
    ) -> Tuple[Project, Repository, RepositoryImportJob]:
        """
        Executes a controlled, full import of a public GitHub repository.
        Creates Project, Repository, RepositoryImportJob, and WorkspaceFiles.
        Uses single-archive zipball download for speed & 100% integrity,
        with recursive tree & blobs API fallback.
        """
        owner, repo_name, url_branch = parse_and_validate_github_url(github_url)

        # 1. Fetch repo metadata
        meta = await self.fetch_repo_metadata(owner, repo_name)
        default_branch = meta.get("default_branch", "main")
        target_branch = (branch or "").strip() or url_branch or default_branch
        html_url = meta.get("html_url", f"https://github.com/{owner}/{repo_name}")
        description = meta.get("description")

        # 2. Create or find Project and Repository
        project = Project(
            name=f"{owner}/{repo_name}",
            description=description,
            source_type="github",
            default_branch=target_branch,
        )
        self.db.add(project)
        self.db.flush()

        repository = Repository(
            project_id=project.id,
            provider="github",
            owner=owner,
            repository_name=repo_name,
            external_repository_id=str(meta.get("id", "")),
            html_url=html_url,
            default_branch=default_branch,
            selected_branch=target_branch,
            import_status="in_progress",
        )
        self.db.add(repository)
        self.db.flush()

        job = RepositoryImportJob(
            repository_id=repository.id,
            project_id=project.id,
            status="processing",
            progress=15,
            files_processed=0,
            total_files=0,
        )
        self.db.add(job)
        self.db.commit()

        headers = self._get_headers()

        try:
            # 3. Primary Strategy: Download entire repository archive as a zipball
            # This is 100% reliable, fast, atomic, and preserves all code files perfectly.
            zip_imported = False
            zip_count = 0
            zip_urls = [
                f"https://api.github.com/repos/{owner}/{repo_name}/zipball/{target_branch}",
                f"https://codeload.github.com/{owner}/{repo_name}/zip/refs/heads/{target_branch}",
            ]

            async with httpx.AsyncClient(timeout=45.0, follow_redirects=True) as client:
                for z_url in zip_urls:
                    try:
                        logger.info(f"Attempting full zipball download from {z_url}")
                        zip_resp = await client.get(z_url, headers=headers)
                        if zip_resp.status_code == 200 and len(zip_resp.content) > 100:
                            ws = WorkspaceService(self.db)
                            zip_count = ws.import_zip_archive(project.id, zip_resp.content)
                            if zip_count > 0:
                                zip_imported = True
                                logger.info(f"Successfully imported {zip_count} files via GitHub zipball.")
                                break
                    except Exception as z_err:
                        logger.warning(f"Zipball download failed for {z_url}: {z_err}")

            # 4. Fallback Strategy: Recursive git tree if zipball didn't import files
            if not zip_imported:
                logger.info("Falling back to recursive Git Trees API for import.")
                tree_url = f"https://api.github.com/repos/{owner}/{repo_name}/git/trees/{target_branch}?recursive=1"

                async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                    tree_resp = await client.get(tree_url, headers=headers)
                    if tree_resp.status_code != 200:
                        raise ValueError(f"Failed to fetch branch '{target_branch}' tree: {tree_resp.text}")

                    tree_data = tree_resp.json()
                    items = tree_data.get("tree", [])

                    # Filter eligible files
                    eligible_items = [
                        item for item in items
                        if item.get("type") == "blob" and is_eligible_file(item.get("path", ""))
                    ]

                    code_items = [i for i in eligible_items if get_file_priority(i.get("path", "")) == 0]
                    config_items = [i for i in eligible_items if get_file_priority(i.get("path", "")) == 1]
                    dataset_items = [i for i in eligible_items if get_file_priority(i.get("path", "")) == 2]

                    file_items = code_items + config_items + dataset_items[:50]
                    if len(file_items) > settings.MAX_REPO_FILES:
                        file_items = file_items[:settings.MAX_REPO_FILES]

                    job.total_files = len(file_items)
                    job.progress = 30
                    self.db.commit()

                    semaphore = asyncio.Semaphore(10)

                    async def fetch_single_file(item: dict) -> Optional[WorkspaceFile]:
                        file_path = item.get("path", "").replace("\\", "/")
                        filename = file_path.split("/")[-1]
                        ext = filename.split(".")[-1] if "." in filename else ""
                        sha = item.get("sha")

                        content = None

                        async with semaphore:
                            # Try 1: GitHub Blobs API (with Token auth)
                            if sha:
                                try:
                                    blob_url = f"https://api.github.com/repos/{owner}/{repo_name}/git/blobs/{sha}"
                                    b_resp = await client.get(blob_url, headers=headers)
                                    if b_resp.status_code == 200:
                                        b_json = b_resp.json()
                                        if b_json.get("encoding") == "base64" and b_json.get("content"):
                                            content = base64.b64decode(b_json["content"]).decode("utf-8", errors="replace")
                                except Exception:
                                    pass

                            # Try 2: GitHub Contents API with raw accept header
                            if content is None:
                                try:
                                    raw_headers = dict(headers)
                                    raw_headers["Accept"] = "application/vnd.github.raw"
                                    c_url = f"https://api.github.com/repos/{owner}/{repo_name}/contents/{file_path}?ref={target_branch}"
                                    c_resp = await client.get(c_url, headers=raw_headers)
                                    if c_resp.status_code == 200:
                                        content = c_resp.text
                                except Exception:
                                    pass

                            # Try 3: raw.githubusercontent.com
                            if content is None:
                                try:
                                    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{target_branch}/{file_path}"
                                    r_resp = await client.get(raw_url)
                                    if r_resp.status_code == 200:
                                        content = r_resp.text
                                except Exception as err:
                                    logger.warning(f"Failed to fetch content for {file_path}: {err}")

                        if content is not None:
                            size = len(content.encode("utf-8"))
                            if size > settings.MAX_SOURCE_FILE_SIZE_BYTES:
                                content = content[:settings.MAX_SOURCE_FILE_SIZE_BYTES] + "\n# [Content truncated: exceeded file size limit]"
                                size = len(content.encode("utf-8"))

                            content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
                            return WorkspaceFile(
                                project_id=project.id,
                                relative_path=file_path,
                                filename=filename,
                                file_extension=ext,
                                content=content,
                                content_hash=content_hash,
                                size_bytes=size,
                                version=1,
                                is_directory=False,
                            )
                        return None

                    file_results = await asyncio.gather(*(fetch_single_file(item) for item in file_items))
                    imported_files = [wf for wf in file_results if wf is not None]

                    for wf in imported_files:
                        self.db.add(wf)

                    zip_count = len(imported_files)

            # Finalize job and repo
            job.total_files = zip_count
            job.files_processed = zip_count
            job.progress = 100
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)

            repository.import_status = "completed"
            repository.last_imported_at = datetime.now(timezone.utc)

            self.db.commit()
            self.db.refresh(project)
            self.db.refresh(repository)
            self.db.refresh(job)

            return project, repository, job

        except Exception as exc:
            logger.error(f"GitHub import failed for {github_url}: {exc}")
            job.status = "failed"
            job.error_summary = str(exc)
            job.completed_at = datetime.now(timezone.utc)
            repository.import_status = "failed"
            self.db.commit()
            raise exc

    async def push_to_repository(
        self,
        repository: Repository,
        commit_message: str,
        files_to_commit: List[Dict[str, str]],
        target_branch: Optional[str] = None,
        token: Optional[str] = None,
        create_pr: bool = False,
        pr_title: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Pushes modified workspace files directly to GitHub using the Git Database API.
        Creates blobs, a new tree, a commit, and updates the branch ref (or creates a PR).
        """
        auth_token = (token or "").strip() or settings.GITHUB_TOKEN
        if not auth_token:
            raise ValueError(
                "GitHub Personal Access Token is required to push changes. "
                "Please enter your GitHub token in the Push modal or configure GITHUB_TOKEN."
            )

        owner = repository.owner
        repo = repository.repository_name
        base_branch = repository.selected_branch or repository.default_branch or "main"
        push_branch = target_branch.strip() if target_branch and target_branch.strip() else base_branch

        if create_pr and push_branch == base_branch:
            push_branch = f"aetherion-patch-{int(datetime.now().timestamp())}"

        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AutonomusAI-Platform/1.0",
            "Authorization": f"Bearer {auth_token}",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            # 1. Fetch base branch ref
            ref_url = f"https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{base_branch}"
            res = await client.get(ref_url, headers=headers)
            if res.status_code == 401:
                raise ValueError("GitHub authentication failed. Please verify your Personal Access Token.")
            elif res.status_code == 403:
                raise ValueError("GitHub permission denied. Ensure your token has write / 'repo' scope access.")
            elif res.status_code == 404:
                raise ValueError(f"Base branch '{base_branch}' not found on GitHub repository {owner}/{repo}.")
            elif res.status_code != 200:
                raise ValueError(f"GitHub API error fetching branch ref: {res.status_code} - {res.text}")

            commit_sha = res.json().get("object", {}).get("sha")
            if not commit_sha:
                raise ValueError("Could not determine base commit SHA from GitHub branch ref.")

            # 2. Fetch base commit to get tree SHA
            commit_res = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/git/commits/{commit_sha}",
                headers=headers,
            )
            if commit_res.status_code != 200:
                raise ValueError(f"GitHub API error fetching commit details: {commit_res.status_code}")
            base_tree_sha = commit_res.json().get("tree", {}).get("sha")

            # 3. Create blobs for each modified file
            tree_entries = []
            for f in files_to_commit:
                raw_path = f.get("path") or f.get("relative_path") or f.get("filename")
                clean_path = raw_path.replace("\\", "/").lstrip("/")
                content_str = f.get("content", "")

                blob_res = await client.post(
                    f"https://api.github.com/repos/{owner}/{repo}/git/blobs",
                    headers=headers,
                    json={"content": content_str, "encoding": "utf-8"},
                )
                if blob_res.status_code not in (200, 201):
                    raise ValueError(f"Failed to create GitHub blob for {clean_path}: {blob_res.text}")

                blob_sha = blob_res.json().get("sha")
                tree_entries.append({
                    "path": clean_path,
                    "mode": "100644",
                    "type": "blob",
                    "sha": blob_sha,
                })

            if not tree_entries:
                raise ValueError("No valid file changes found to commit.")

            # 4. Create new tree
            tree_res = await client.post(
                f"https://api.github.com/repos/{owner}/{repo}/git/trees",
                headers=headers,
                json={"base_tree": base_tree_sha, "tree": tree_entries},
            )
            if tree_res.status_code not in (200, 201):
                raise ValueError(f"Failed to create GitHub tree: {tree_res.text}")
            new_tree_sha = tree_res.json().get("sha")

            # 5. Create new commit
            final_msg = commit_message.strip() or "fix: apply verified AI repairs and workspace changes"
            new_commit_res = await client.post(
                f"https://api.github.com/repos/{owner}/{repo}/git/commits",
                headers=headers,
                json={
                    "message": final_msg,
                    "tree": new_tree_sha,
                    "parents": [commit_sha],
                },
            )
            if new_commit_res.status_code not in (200, 201):
                raise ValueError(f"Failed to create GitHub commit: {new_commit_res.text}")

            new_commit_data = new_commit_res.json()
            new_commit_sha = new_commit_data.get("sha")
            commit_url = new_commit_data.get("html_url") or f"https://github.com/{owner}/{repo}/commit/{new_commit_sha}"

            # 6. Update existing branch ref or create new branch ref
            check_ref_res = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{push_branch}",
                headers=headers,
            )

            if check_ref_res.status_code == 200:
                # Update existing branch
                update_ref_res = await client.patch(
                    f"https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{push_branch}",
                    headers=headers,
                    json={"sha": new_commit_sha, "force": False},
                )
                if update_ref_res.status_code not in (200, 201):
                    raise ValueError(f"Failed to update branch '{push_branch}': {update_ref_res.text}")
            else:
                # Create new branch ref
                create_ref_res = await client.post(
                    f"https://api.github.com/repos/{owner}/{repo}/git/refs",
                    headers=headers,
                    json={"ref": f"refs/heads/{push_branch}", "sha": new_commit_sha},
                )
                if create_ref_res.status_code not in (200, 201):
                    raise ValueError(f"Failed to create branch '{push_branch}': {create_ref_res.text}")

            pr_url = None
            pr_number = None

            # 7. Optionally create Pull Request
            if create_pr:
                pr_body = (
                    f"### AETHERION Autonomous Code Patch\n\n"
                    f"- **Committed Files**: {len(tree_entries)}\n"
                    f"- **Target Branch**: `{base_branch}`\n"
                    f"- **Source Branch**: `{push_branch}`\n"
                    f"- **Commit**: [{new_commit_sha[:7]}]({commit_url})\n\n"
                    f"Verified by AETHERION Autonomous AI Debugging & Testing Pipeline."
                )
                pr_res = await client.post(
                    f"https://api.github.com/repos/{owner}/{repo}/pulls",
                    headers=headers,
                    json={
                        "title": pr_title or final_msg,
                        "head": push_branch,
                        "base": base_branch,
                        "body": pr_body,
                    },
                )
                if pr_res.status_code in (200, 201):
                    pr_data = pr_res.json()
                    pr_url = pr_data.get("html_url")
                    pr_number = pr_data.get("number")
                else:
                    logger.warning(f"PR creation returned {pr_res.status_code}: {pr_res.text}")

            # Update repository record
            repository.last_imported_at = datetime.now(timezone.utc)
            self.db.commit()

            return {
                "success": True,
                "commit_sha": new_commit_sha,
                "commit_url": commit_url,
                "branch": push_branch,
                "files_committed": len(tree_entries),
                "pr_url": pr_url,
                "pr_number": pr_number,
                "message": (
                    f"Successfully pushed {len(tree_entries)} file(s) to branch '{push_branch}'"
                    + (f" and created PR #{pr_number}" if pr_number else "")
                ),
            }

