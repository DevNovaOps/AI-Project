import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.security.filename_validation import sanitize_and_validate_filename


class SourceFileInput(BaseModel):
    filename: str = Field(..., description="Relative file path e.g. main.py or utils/calc.py")
    content: str = Field(..., description="Source code content")
    language: Optional[str] = Field(default=None, description="Optional per-file language tag")

    @model_validator(mode="before")
    @classmethod
    def normalize_input(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Accept filename, file_path, or path interchangeably
            if "filename" not in data:
                if "file_path" in data:
                    data["filename"] = data["file_path"]
                elif "path" in data:
                    data["filename"] = data["path"]
        return data

    @field_validator("filename")
    @classmethod
    def validate_filename(cls, v: str) -> str:
        clean = v.replace("\\", "/").strip()
        while clean.startswith("./"):
            clean = clean[2:]
        clean = clean.lstrip("/")
        return sanitize_and_validate_filename(clean)


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
