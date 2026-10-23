from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project
from app.models.workspace_file import WorkspaceFile
from app.schemas.project import ProjectCreate, ProjectListResponse, ProjectResponse

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=ProjectListResponse)
def list_projects(db: Session = Depends(get_db)):
    """Lists all user projects and workspaces."""
    projects = db.query(Project).order_by(Project.updated_at.desc()).all()
    results = []
    for p in projects:
        file_count = db.query(WorkspaceFile).filter(WorkspaceFile.project_id == p.id).count()
        results.append(
            ProjectResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                source_type=p.source_type,
                default_branch=p.default_branch,
                created_at=p.created_at,
                updated_at=p.updated_at,
                file_count=file_count,
            )
        )
    return ProjectListResponse(projects=results, total=len(results))


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    """Creates a new workspace project."""
    project = Project(
        name=payload.name,
        description=payload.description,
        source_type=payload.source_type,
        default_branch=payload.default_branch,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        source_type=project.source_type,
        default_branch=project.default_branch,
        created_at=project.created_at,
        updated_at=project.updated_at,
        file_count=0,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    """Retrieves project details."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    file_count = db.query(WorkspaceFile).filter(WorkspaceFile.project_id == project.id).count()
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        source_type=project.source_type,
        default_branch=project.default_branch,
        created_at=project.created_at,
        updated_at=project.updated_at,
        file_count=file_count,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)):
    """Deletes a project and all associated files, repositories, and sessions."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return None
