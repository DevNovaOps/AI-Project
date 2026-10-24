import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class FindingResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    source_file_id: Optional[uuid.UUID] = None
    file: Optional[str] = None
    source_file_path: Optional[str] = None
    category: str
    severity: str
    title: str
    description: str
    line_number: Optional[int] = None
    column_number: Optional[int] = None
    evidence: Optional[str] = None
    origin: str  # AST, Ruff, Test Execution, LLM
    status: str  # Open, Fixed, Unresolved, Ignored
    suggested_fix: Optional[str] = None
    root_cause: Optional[str] = None
    confidence: Optional[int] = Field(default=90, description="Confidence score 0-100")
    metadata_info: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    # Frontend convenience aliases
    @property
    def line(self) -> Optional[int]:
        return self.line_number

    @property
    def col(self) -> Optional[int]:
        return self.column_number

    model_config = {"from_attributes": True}
