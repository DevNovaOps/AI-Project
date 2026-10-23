import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, field_validator

from app.security.filename_validation import sanitize_and_validate_filename


class SourceFileInput(BaseModel):
    filename: str = Field(..., description="Relative file path e.g. main.py or utils/calc.py")
    content: str = Field(..., description="Source code content")
    language: Optional[str] = Field(default=None, description="Optional per-file language tag")

    @field_validator("filename")
    @classmethod
    def validate_filename(cls, v: str) -> str:
        return sanitize_and_validate_filename(v)


class SourceFileResponse(BaseModel):
    id: uuid.UUID
    filename: str
    language: str
    original_content: str
    proposed_content: Optional[str] = None
    file_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
