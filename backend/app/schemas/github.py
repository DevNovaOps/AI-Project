from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class GitHubImportRequest(BaseModel):
    url: str = Field(..., description="Public GitHub repository URL (e.g. https://github.com/owner/repo)")
    branch: Optional[str] = Field(None, description="Optional branch to import (defaults to default branch)")


class GitHubImportJobResponse(BaseModel):
    job_id: UUID
    repository_id: UUID
    project_id: Optional[UUID] = None
    status: str
    progress: int
    files_processed: int
    total_files: int
    error_summary: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RepositoryMetadataResponse(BaseModel):
    id: UUID
    project_id: UUID
    provider: str
    owner: str
    repository_name: str
    html_url: str
    default_branch: str
    selected_branch: str
    import_status: str
    last_imported_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
