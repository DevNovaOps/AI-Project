import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, model_validator

from app.schemas.files import SourceFileInput, SourceFileResponse


class DebugSessionCreateRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    language: str = Field(default="python", description="Target programming language")
    files: List[SourceFileInput] = Field(default_factory=list, description="Array of source files with relative paths and contents")
    task_description: Optional[str] = Field(default=None, description="Optional user task description or problem statement")
    requested_checks: List[str] = Field(
        default_factory=lambda: ["syntax", "style", "runtime", "security"],
        description="List of requested static or dynamic checks",
    )
    max_repair_attempts: int = Field(default=3, ge=1, le=10, description="Max repair attempts within server limits")
    model: Optional[str] = Field(default=None, description="Optional target Groq LLM model")

    @model_validator(mode="before")
    @classmethod
    def normalize_request(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Accept source_files as an alias for files
            if "files" not in data and "source_files" in data:
                data["files"] = data["source_files"]
        return data


class DebugSessionResponse(BaseModel):
    id: uuid.UUID
    title: Optional[str] = None
    language: str
    status: str  # queued, running, completed, failed, cancelled, partially_validated
    task_description: Optional[str] = None
    configuration: Dict[str, Any] = Field(default_factory=dict)
    source_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    files: List[SourceFileResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class DebugSessionRunResponse(BaseModel):
    session_id: uuid.UUID
    status: str
    workflow_id: str
    message: str
