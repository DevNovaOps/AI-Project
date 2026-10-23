from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project
from app.schemas.file import (
    FileContentResponse,
    FileCreateRequest,
    FileRenameRequest,
    FileSaveRequest,
    FolderCreateRequest,
)
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/projects/{project_id}", tags=["Files"])


def get_project_or_404(project_id: UUID, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/files")
def get_project_file_tree(project_id: UUID, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns the hierarchical file tree for Monaco and Project Explorer."""
    get_project_or_404(project_id, db)
    service = WorkspaceService(db)
    return service.get_project_files_tree(project_id)


@router.get("/files/content", response_model=FileContentResponse)
def get_file_content(
    project_id: UUID,
    path: str = Query(..., description="Workspace relative path of the file"),
    db: Session = Depends(get_db),
):
    """Retrieves file text, metadata, and version hash."""
    get_project_or_404(project_id, db)
    service = WorkspaceService(db)
    try:
        return service.get_file_content(project_id, path)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/files", status_code=status.HTTP_201_CREATED)
def create_file(
    project_id: UUID,
    payload: FileCreateRequest,
    db: Session = Depends(get_db),
):
    """Creates a new source file in the project workspace."""
    get_project_or_404(project_id, db)
    service = WorkspaceService(db)
    try:
        created = service.create_file(project_id, payload.path, payload.content or "")
        return {
            "path": created.relative_path,
            "filename": created.filename,
            "size_bytes": created.size_bytes,
            "version": created.version,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.put("/files/content")
def save_file_content(
    project_id: UUID,
    payload: FileSaveRequest,
    db: Session = Depends(get_db),
):
    """Saves modified file content with version conflict detection."""
    get_project_or_404(project_id, db)
    service = WorkspaceService(db)
    try:
        saved = service.save_file_content(
            project_id=project_id,
            relative_path=payload.path,
            content=payload.content,
            expected_version=payload.version,
        )
        return {
            "path": saved.relative_path,
            "version": saved.version,
            "size_bytes": saved.size_bytes,
            "content_hash": saved.content_hash,
            "updated_at": saved.updated_at.isoformat() if saved.updated_at else None,
        }
    except ValueError as exc:
        # Conflict detection returns 409 Conflict
        status_code = 409 if "Conflict" in str(exc) else 400
        raise HTTPException(status_code=status_code, detail=str(exc))


@router.post("/folders", status_code=status.HTTP_201_CREATED)
def create_folder(
    project_id: UUID,
    payload: FolderCreateRequest,
    db: Session = Depends(get_db),
):
    """Creates a placeholder folder in the workspace."""
    get_project_or_404(project_id, db)
    service = WorkspaceService(db)
    try:
        # Create a hidden .gitkeep or placeholder inside folder
        folder_path = payload.path.strip("/").rstrip("/")
        keep_path = f"{folder_path}/.gitkeep"
        service.create_file(project_id, keep_path, "")
        return {"path": folder_path, "status": "created"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.patch("/files/rename")
def rename_file(
    project_id: UUID,
    payload: FileRenameRequest,
    db: Session = Depends(get_db),
):
    """Renames or moves a file or directory."""
    get_project_or_404(project_id, db)
    service = WorkspaceService(db)
    try:
        updated = service.rename_file(project_id, payload.old_path, payload.new_path)
        return {
            "old_path": payload.old_path,
            "new_path": updated.relative_path,
            "version": updated.version,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/files")
def delete_file(
    project_id: UUID,
    path: str = Query(..., description="Workspace relative path of the file or folder to delete"),
    db: Session = Depends(get_db),
):
    """Deletes a file or directory safely from the workspace."""
    get_project_or_404(project_id, db)
    service = WorkspaceService(db)
    try:
        deleted_count = service.delete_file(project_id, path)
        return {"path": path, "deleted_count": deleted_count}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/uploads", status_code=status.HTTP_201_CREATED)
async def upload_files_or_zip(
    project_id: UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """
    Uploads single or multiple files, or extracts a ZIP archive into the workspace.
    Validates file sizes, prevents path traversal, and indexes files into MySQL.
    """
    get_project_or_404(project_id, db)
    service = WorkspaceService(db)
    imported_count = 0

    for upload in files:
        filename = upload.filename or "uploaded_file"
        content_bytes = await upload.read()

        if filename.endswith(".zip"):
            try:
                count = service.import_zip_archive(project_id, content_bytes)
                imported_count += count
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc))
        else:
            try:
                text_content = content_bytes.decode("utf-8", errors="replace")
                service.save_file_content(project_id, filename, text_content)
                imported_count += 1
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"Failed to save {filename}: {exc}")

    return {"uploaded_count": imported_count, "status": "success"}
