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

# Ignored directories and file patterns
IGNORED_DIRS = {
    ".git", ".github", "node_modules", "venv", ".venv", "env",
    "__pycache__", ".pytest_cache", ".ruff_cache", "dist", "build",
    ".idea", ".vscode", "target", "vendor", "bin", "obj"
}

IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".exe", ".dll", ".so", ".dylib", ".bin",
    ".pdf", ".doc", ".docx", ".mp3", ".mp4", ".mov", ".avi",
    ".pyc", ".pyo", ".pyd", ".class", ".jar"
}


def parse_and_validate_github_url(url: str) -> Tuple[str, str]:
    """
    Validates a GitHub repository URL and extracts (owner, repo).
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

    # Path format: /owner/repo or /owner/repo.git
    path = parsed.path.strip("/").rstrip(".git")
    parts = [p for p in path.split("/") if p]

    if len(parts) < 2:
        raise ValueError("Invalid GitHub repository URL. Expected format: https://github.com/owner/repository")

    owner = parts[0]
    repo = parts[1]

    # Validate characters (GitHub username and repo rules)
    if not re.match(r"^[a-zA-Z0-9_\-\.]+$", owner):
        raise ValueError(f"Invalid repository owner '{owner}'.")
    if not re.match(r"^[a-zA-Z0-9_\-\.]+$", repo):
        raise ValueError(f"Invalid repository name '{repo}'.")

    return owner, repo


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
        Executes a controlled import of a public GitHub repository.
        Creates Project, Repository, RepositoryImportJob, and WorkspaceFiles.
        """
        owner, repo_name = parse_and_validate_github_url(github_url)

        # 1. Fetch repo metadata
        meta = await self.fetch_repo_metadata(owner, repo_name)
        default_branch = meta.get("default_branch", "main")
        target_branch = (branch or "").strip() or default_branch
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
            progress=10,
            files_processed=0,
            total_files=0,
        )
        self.db.add(job)
        self.db.commit()

        # 3. Fetch git tree recursively
        tree_url = f"https://api.github.com/repos/{owner}/{repo_name}/git/trees/{target_branch}?recursive=1"
        headers = self._get_headers()

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                tree_resp = await client.get(tree_url, headers=headers)
                if tree_resp.status_code != 200:
                    raise ValueError(f"Failed to fetch branch '{target_branch}' tree: {tree_resp.text}")

                tree_data = tree_resp.json()
                items = tree_data.get("tree", [])

                # Filter eligible files
                file_items = [
                    item for item in items
                    if item.get("type") == "blob" and is_eligible_file(item.get("path", ""))
                ]

                # Cap file count
                if len(file_items) > settings.MAX_REPO_FILES:
                    logger.info(
                        f"Repo {owner}/{repo_name} has {len(file_items)} files, "
                        f"capping import to {settings.MAX_REPO_FILES} files."
                    )
                    file_items = file_items[:settings.MAX_REPO_FILES]

                job.total_files = len(file_items)
                job.progress = 25
                self.db.commit()

                # 4. Fetch content for each file
                imported_files = []
                total_bytes = 0

                for idx, item in enumerate(file_items):
                    file_path = item.get("path", "").replace("\\", "/")
                    filename = file_path.split("/")[-1]
                    ext = filename.split(".")[-1] if "." in filename else ""

                    # Download raw content
                    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo_name}/{target_branch}/{file_path}"
                    try:
                        raw_resp = await client.get(raw_url)
                        if raw_resp.status_code == 200:
                            content = raw_resp.text
                            size = len(content.encode("utf-8"))

                            # Check single file size limit
                            if size > settings.MAX_SOURCE_FILE_SIZE_BYTES:
                                content = content[:settings.MAX_SOURCE_FILE_SIZE_BYTES] + "\n# [Content truncated: exceeded file size limit]"
                                size = len(content.encode("utf-8"))

                            total_bytes += size
                            if total_bytes > settings.MAX_REPO_SIZE_BYTES:
                                logger.warning(f"Repo {owner}/{repo_name} exceeded max size limit of {settings.MAX_REPO_SIZE_BYTES} bytes.")
                                break

                            content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

                            ws_file = WorkspaceFile(
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
                            imported_files.append(ws_file)
                    except Exception as err:
                        logger.warning(f"Failed to fetch content for {file_path}: {err}")

                    job.files_processed = len(imported_files)
                    job.progress = int(25 + (70 * ((idx + 1) / max(1, len(file_items)))))
                    if idx % 10 == 0:
                        self.db.commit()

                # Add files to database
                for wf in imported_files:
                    self.db.add(wf)

                # Finalize job and repo
                job.status = "completed"
                job.progress = 100
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
