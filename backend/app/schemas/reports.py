import uuid
from datetime import datetime
from typing import Any, Dict, List

from pydantic import BaseModel, Field


class FinalReportResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    summary: str
    validation_status: str  # passed, failed, partial, could_not_run
    findings_summary: Dict[str, Any] = Field(default_factory=dict)
    repairs_summary: List[Dict[str, Any]] = Field(default_factory=list)
    tests_summary: Dict[str, Any] = Field(default_factory=dict)
    unresolved_issues: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}
