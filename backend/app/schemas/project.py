from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    source_type: str = Field("managed", max_length=50)
    default_branch: str = Field("main", max_length=100)


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    source_type: str
    default_branch: str
    created_at: datetime
    updated_at: datetime
    file_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
