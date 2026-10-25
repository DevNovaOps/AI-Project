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


class GitHubFileCommitInput(BaseModel):
    path: str = Field(..., description="File relative path in repository")
    content: str = Field(..., description="Full updated content of the file")


class GitHubPushRequest(BaseModel):
    branch: Optional[str] = Field(None, description="Target branch to push to (defaults to selected branch or default branch)")
    commit_message: str = Field(default="fix: apply verified AI repairs and workspace changes", description="Git commit message")
    files: Optional[list[GitHubFileCommitInput]] = Field(None, description="Optional list of specific files to commit. If omitted, all workspace files are committed.")
    github_token: Optional[str] = Field(None, description="Personal Access Token with 'repo' scope")
    create_pr: bool = Field(default=False, description="Whether to create a Pull Request instead of direct push")
    pr_title: Optional[str] = Field(None, description="Optional Pull Request title")


class GitHubPushResponse(BaseModel):
    success: bool
    commit_sha: Optional[str] = None
    commit_url: Optional[str] = None
    branch: str
    files_committed: int
    pr_url: Optional[str] = None
    pr_number: Optional[int] = None
    message: str

