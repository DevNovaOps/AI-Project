from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project
from app.models.repository import Repository
from app.models.repository_import_job import RepositoryImportJob
from app.schemas.github import (
    GitHubImportJobResponse,
    GitHubImportRequest,
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
