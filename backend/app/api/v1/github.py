from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project
from app.models.repository import Repository
from app.models.repository_import_job import RepositoryImportJob
from app.models.workspace_file import WorkspaceFile
from app.schemas.github import (
    GitHubImportJobResponse,
    GitHubImportRequest,
    GitHubPushRequest,
    GitHubPushResponse,
    RepositoryMetadataResponse,
)
from app.services.github_service import GitHubService

router = APIRouter(tags=["GitHub"])


@router.post("/github/import", response_model=GitHubImportJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def import_github_repository(
    payload: GitHubImportRequest,
    db: Session = Depends(get_db),
):
    """
    Imports a public GitHub repository by URL into a managed AutonomusAI project.
    Validates host, enforces limits, downloads files, and indexes into workspace.
    """
    service = GitHubService(db)
    try:
        project, repository, job = await service.import_repository(
            github_url=payload.url,
            branch=payload.branch,
        )
        return GitHubImportJobResponse(
            job_id=job.id,
            repository_id=repository.id,
            project_id=project.id,
            status=job.status,
            progress=job.progress,
            files_processed=job.files_processed,
            total_files=job.total_files,
            error_summary=job.error_summary,
            started_at=job.started_at,
            completed_at=job.completed_at,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(exc)}")


@router.get("/github/imports/{job_id}", response_model=GitHubImportJobResponse)
def get_import_job_status(job_id: UUID, db: Session = Depends(get_db)):
    """Retrieves import job progress and status."""
    job = db.query(RepositoryImportJob).filter(RepositoryImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")

    return GitHubImportJobResponse(
        job_id=job.id,
        repository_id=job.repository_id,
        project_id=job.project_id,
        status=job.status,
        progress=job.progress,
        files_processed=job.files_processed,
        total_files=job.total_files,
        error_summary=job.error_summary,
        started_at=job.started_at,
        completed_at=job.completed_at,
    )


@router.get("/projects/{project_id}/repository", response_model=RepositoryMetadataResponse)
def get_project_repository(project_id: UUID, db: Session = Depends(get_db)):
    """Retrieves the GitHub repository connected to a project."""
    repo = db.query(Repository).filter(Repository.project_id == project_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="No repository connected to this project")

    return RepositoryMetadataResponse(
        id=repo.id,
        project_id=repo.project_id,
        provider=repo.provider,
        owner=repo.owner,
        repository_name=repo.repository_name,
        html_url=repo.html_url,
        default_branch=repo.default_branch,
        selected_branch=repo.selected_branch,
        import_status=repo.import_status,
        last_imported_at=repo.last_imported_at,
    )


@router.post("/projects/{project_id}/repository/refresh", response_model=GitHubImportJobResponse)
async def refresh_project_repository(project_id: UUID, db: Session = Depends(get_db)):
    """Re-syncs an imported GitHub repository with the latest remote commit."""
    repo = db.query(Repository).filter(Repository.project_id == project_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="No repository connected to this project")

    service = GitHubService(db)
    try:
        project, repository, job = await service.import_repository(
            github_url=repo.html_url,
            branch=repo.selected_branch,
        )
        return GitHubImportJobResponse(
            job_id=job.id,
            repository_id=repository.id,
            project_id=project.id,
            status=job.status,
            progress=job.progress,
            files_processed=job.files_processed,
            total_files=job.total_files,
            error_summary=job.error_summary,
            started_at=job.started_at,
            completed_at=job.completed_at,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/projects/{project_id}/repository", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_repository(project_id: UUID, db: Session = Depends(get_db)):
    """Disconnects the GitHub repository record from the project."""
    repo = db.query(Repository).filter(Repository.project_id == project_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="No repository connected to this project")

    db.delete(repo)
    db.commit()
    return None


@router.post("/projects/{project_id}/repository/push", response_model=GitHubPushResponse)
async def push_project_changes_to_github(
    project_id: UUID,
    payload: GitHubPushRequest,
    db: Session = Depends(get_db),
):
    """
    Pushes modified or selected workspace files directly to the connected GitHub repository.
    Works for creators and collaborators with write access, or allows creating a new branch / PR.
    """
    repo = db.query(Repository).filter(Repository.project_id == project_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="No GitHub repository connected to this project")

    # If payload provided specific files, use them; otherwise, pull all non-directory workspace files
    files_to_commit = []
    if payload.files:
        files_to_commit = [{"path": f.path, "content": f.content} for f in payload.files]
    else:
        wf_files = (
            db.query(WorkspaceFile)
            .filter(
                WorkspaceFile.project_id == project_id,
                WorkspaceFile.is_directory == False,
            )
            .all()
        )
        files_to_commit = [{"path": wf.relative_path, "content": wf.content or ""} for wf in wf_files]

    if not files_to_commit:
        raise HTTPException(status_code=400, detail="No files found in workspace to push.")

    service = GitHubService(db)
    try:
        result = await service.push_to_repository(
            repository=repo,
            commit_message=payload.commit_message,
            files_to_commit=files_to_commit,
            target_branch=payload.branch,
            token=payload.github_token,
            create_pr=payload.create_pr,
            pr_title=payload.pr_title,
        )
        return GitHubPushResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to push to GitHub: {str(exc)}")

