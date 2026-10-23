import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class TestRunResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    status: str  # passed, failed, skipped, error, unavailable
    actual_execution: bool
    command_or_config: str
    exit_code: Optional[int] = None
    stdout_summary: Optional[str] = None
    stderr_summary: Optional[str] = None
    duration_ms: Optional[int] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
