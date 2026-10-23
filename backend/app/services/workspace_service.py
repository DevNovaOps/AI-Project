import hashlib
import io
import os
import re
import zipfile
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.models.project import Project
from app.models.workspace_file import WorkspaceFile


def sanitize_relative_path(path: str) -> str:
    """
    Sanitizes and normalizes a workspace relative path.
    Prevents path traversal attacks ('..' or absolute paths).
    """
    if not path or not isinstance(path, str):
        raise ValueError("File path cannot be empty.")

    # Normalize backslashes to forward slashes
    clean = path.replace("\\", "/").strip()

    # Disallow absolute paths
    if clean.startswith("/") or re.match(r"^[a-zA-Z]:", clean):
        raise ValueError("Absolute paths are not permitted in workspace operations.")

    # Check for path traversal components
    parts = clean.split("/")
    sanitized_parts = []
    for part in parts:
        if part in ("", "."):
            continue
        if part == "..":
            raise ValueError("Path traversal ('..') is strictly forbidden.")
        # Reject control characters or null bytes
        if any(ord(c) < 32 for c in part) or "\0" in part:
            raise ValueError("Invalid characters detected in filename or path.")
        sanitized_parts.append(part)

    if not sanitized_parts:
        raise ValueError("Invalid empty path.")

    return "/".join(sanitized_parts)


class WorkspaceService:
    def __init__(self, db: Session):
        self.db = db

    def get_project_files_tree(self, project_id: UUID) -> List[Dict[str, Any]]:
        """
        Builds a nested directory tree from WorkspaceFile records
        matching the frontend ProjectExplorer expectations.
        """
        files = (
            self.db.query(WorkspaceFile)
            .filter(WorkspaceFile.project_id == project_id)
            .order_by(WorkspaceFile.relative_path)
            .all()
        )

        root_nodes: Dict[str, Any] = {}

        def get_or_create_folder(folder_path: str, parent_dict: Dict[str, Any]) -> Dict[str, Any]:
            if not folder_path:
                return parent_dict

            parts = folder_path.split("/")
            curr_path = ""
            curr_dict = parent_dict

            for part in parts:
                curr_path = f"{curr_path}/{part}" if curr_path else part
                if curr_path not in curr_dict:
                    curr_dict[curr_path] = {
                        "id": curr_path,
                        "name": part,
                        "type": "folder",
                        "children_dict": {},
                    }
                curr_dict = curr_dict[curr_path]["children_dict"]

            return curr_dict

        # Populate tree
        for f in files:
            parts = f.relative_path.split("/")
            if len(parts) > 1:
                folder_path = "/".join(parts[:-1])
                target_folder_children = get_or_create_folder(folder_path, root_nodes)
            else:
                target_folder_children = root_nodes

            ext = f.file_extension or (f.filename.split(".")[-1] if "." in f.filename else "")
            target_folder_children[f.relative_path] = {
                "id": f.relative_path,
                "name": f.filename,
                "type": "file",
                "ext": ext,
                "size": f.size_bytes,
                "version": f.version,
            }

        # Convert nested dictionaries into sorted arrays
        def dict_to_array(d: Dict[str, Any]) -> List[Dict[str, Any]]:
            res = []
            folders = []
            files_list = []

            for item in d.values():
                if item["type"] == "folder":
                    item["children"] = dict_to_array(item.pop("children_dict", {}))
                    folders.append(item)
                else:
                    files_list.append(item)

            folders.sort(key=lambda x: x["name"].lower())
            files_list.sort(key=lambda x: x["name"].lower())
            return folders + files_list

        return dict_to_array(root_nodes)

    def get_file_content(self, project_id: UUID, relative_path: str) -> Dict[str, Any]:
        """Retrieves file content, metadata, and version hash."""
        clean_path = sanitize_relative_path(relative_path)
        record = (
            self.db.query(WorkspaceFile)
            .filter(
                WorkspaceFile.project_id == project_id,
                WorkspaceFile.relative_path == clean_path,
            )
            .first()
        )
        if not record:
            raise ValueError(f"File '{clean_path}' not found in project.")

        return {
            "path": record.relative_path,
            "filename": record.filename,
            "extension": record.file_extension,
            "content": record.content or "",
            "size_bytes": record.size_bytes,
            "version": record.version,
            "content_hash": record.content_hash,
            "updated_at": record.updated_at.isoformat() if record.updated_at else None,
        }

    def create_file(
        self,
        project_id: UUID,
        relative_path: str,
        content: str = "",
    ) -> WorkspaceFile:
        """Creates a new file in the workspace."""
        clean_path = sanitize_relative_path(relative_path)
        existing = (
            self.db.query(WorkspaceFile)
            .filter(
                WorkspaceFile.project_id == project_id,
                WorkspaceFile.relative_path == clean_path,
            )
            .first()
        )
        if existing:
            raise ValueError(f"File '{clean_path}' already exists.")

        filename = clean_path.split("/")[-1]
        ext = filename.split(".")[-1] if "." in filename else ""
        content_bytes = content.encode("utf-8")
        size = len(content_bytes)

        if size > settings.MAX_SOURCE_FILE_SIZE_BYTES:
            raise ValueError(f"File size exceeds maximum allowed ({settings.MAX_SOURCE_FILE_SIZE_BYTES} bytes).")

        content_hash = hashlib.sha256(content_bytes).hexdigest()

        ws_file = WorkspaceFile(
            project_id=project_id,
            relative_path=clean_path,
            filename=filename,
            file_extension=ext,
            content=content,
            content_hash=content_hash,
            size_bytes=size,
            version=1,
            is_directory=False,
        )
        self.db.add(ws_file)
        self.db.commit()
        self.db.refresh(ws_file)
        return ws_file

    def save_file_content(
        self,
        project_id: UUID,
        relative_path: str,
        content: str,
        expected_version: Optional[int] = None,
    ) -> WorkspaceFile:
        """Saves updated file content with conflict detection."""
        clean_path = sanitize_relative_path(relative_path)
        record = (
            self.db.query(WorkspaceFile)
            .filter(
                WorkspaceFile.project_id == project_id,
                WorkspaceFile.relative_path == clean_path,
            )
            .first()
        )
        if not record:
            # Create if not exists
            return self.create_file(project_id, clean_path, content)

        # Conflict detection
        if expected_version is not None and record.version != expected_version:
            raise ValueError(
                f"Conflict detected for '{clean_path}': expected version {expected_version}, "
                f"but server version is {record.version}. Please reload or compare before saving."
            )

        content_bytes = content.encode("utf-8")
        size = len(content_bytes)
        if size > settings.MAX_SOURCE_FILE_SIZE_BYTES:
            raise ValueError(f"File size exceeds limit ({settings.MAX_SOURCE_FILE_SIZE_BYTES} bytes).")

        record.content = content
        record.content_hash = hashlib.sha256(content_bytes).hexdigest()
        record.size_bytes = size
        record.version += 1

        self.db.commit()
        self.db.refresh(record)
        return record

    def rename_file(
        self,
        project_id: UUID,
        old_path: str,
        new_path: str,
    ) -> WorkspaceFile:
        """Renames a file or moves it within the project workspace."""
        clean_old = sanitize_relative_path(old_path)
        clean_new = sanitize_relative_path(new_path)

        record = (
            self.db.query(WorkspaceFile)
            .filter(
                WorkspaceFile.project_id == project_id,
                WorkspaceFile.relative_path == clean_old,
            )
            .first()
        )
        if not record:
            # Check if this was a directory rename
            dir_files = (
                self.db.query(WorkspaceFile)
                .filter(
                    WorkspaceFile.project_id == project_id,
                    WorkspaceFile.relative_path.startswith(f"{clean_old}/"),
                )
                .all()
            )
            if dir_files:
                for df in dir_files:
                    suffix = df.relative_path[len(clean_old) :]
                    df.relative_path = f"{clean_new}{suffix}"
                self.db.commit()
                return dir_files[0]
            raise ValueError(f"Target '{clean_old}' not found in project.")

        # Check if target name already exists
        target_exists = (
            self.db.query(WorkspaceFile)
            .filter(
                WorkspaceFile.project_id == project_id,
                WorkspaceFile.relative_path == clean_new,
            )
            .first()
        )
        if target_exists:
            raise ValueError(f"A file named '{clean_new}' already exists.")

        new_filename = clean_new.split("/")[-1]
        new_ext = new_filename.split(".")[-1] if "." in new_filename else ""

        record.relative_path = clean_new
        record.filename = new_filename
        record.file_extension = new_ext
        record.version += 1

        self.db.commit()
        self.db.refresh(record)
        return record

    def delete_file(self, project_id: UUID, relative_path: str) -> int:
        """Deletes a file or directory tree from the workspace."""
        clean_path = sanitize_relative_path(relative_path)

        # 1. Exact file match
        record = (
            self.db.query(WorkspaceFile)
            .filter(
                WorkspaceFile.project_id == project_id,
                WorkspaceFile.relative_path == clean_path,
            )
            .first()
        )
        if record:
            self.db.delete(record)
            self.db.commit()
            return 1

        # 2. Directory prefix match
        dir_files = (
            self.db.query(WorkspaceFile)
            .filter(
                WorkspaceFile.project_id == project_id,
                WorkspaceFile.relative_path.startswith(f"{clean_path}/"),
            )
            .all()
        )
        if dir_files:
            count = len(dir_files)
            for df in dir_files:
                self.db.delete(df)
            self.db.commit()
            return count

        raise ValueError(f"Path '{clean_path}' not found in project.")

    def import_zip_archive(self, project_id: UUID, zip_bytes: bytes) -> int:
        """
        Safely extracts source files from a ZIP archive.
        Guards against zip bomb and zip slip path traversal attacks.
        """
        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                imported_count = 0
                total_bytes = 0

                for info in zf.infolist():
                    if info.is_dir():
                        continue

                    # Zip-slip defense
                    raw_filename = info.filename.replace("\\", "/")
                    try:
                        clean_path = sanitize_relative_path(raw_filename)
                    except ValueError:
                        continue  # Skip unsafe path components

                    # Filter eligible extensions
                    parts = clean_path.split("/")
                    if any(p.startswith(".") and p not in (".env.example", ".gitignore") for p in parts):
                        continue
                    if any(p in ("node_modules", "venv", ".venv", "__pycache__", "dist", "build") for p in parts):
                        continue

                    # Size check
                    if info.file_size > settings.MAX_SOURCE_FILE_SIZE_BYTES:
                        continue

                    total_bytes += info.file_size
                    if total_bytes > settings.MAX_REPO_SIZE_BYTES:
                        break

                    try:
                        file_data = zf.read(info).decode("utf-8", errors="replace")
                    except Exception:
                        continue

                    filename = clean_path.split("/")[-1]
                    ext = filename.split(".")[-1] if "." in filename else ""
                    content_hash = hashlib.sha256(file_data.encode("utf-8")).hexdigest()

                    # Save or update file
                    existing = (
                        self.db.query(WorkspaceFile)
                        .filter(
                            WorkspaceFile.project_id == project_id,
                            WorkspaceFile.relative_path == clean_path,
                        )
                        .first()
                    )
                    if existing:
                        existing.content = file_data
                        existing.content_hash = content_hash
                        existing.size_bytes = len(file_data.encode("utf-8"))
                        existing.version += 1
                    else:
                        ws_file = WorkspaceFile(
                            project_id=project_id,
                            relative_path=clean_path,
                            filename=filename,
                            file_extension=ext,
                            content=file_data,
                            content_hash=content_hash,
                            size_bytes=len(file_data.encode("utf-8")),
                            version=1,
                            is_directory=False,
                        )
                        self.db.add(ws_file)

                    imported_count += 1
                    if imported_count >= settings.MAX_REPO_FILES:
                        break

                self.db.commit()
                return imported_count
        except zipfile.BadZipFile:
            raise ValueError("Invalid or corrupted ZIP archive.")
