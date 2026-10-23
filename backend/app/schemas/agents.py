import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class AgentStatusResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    agent_name: str
    status: str  # started, running, completed, failed, skipped
    attempt_number: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    error_summary: Optional[str] = None
    structured_output: Dict[str, Any] = Field(default_factory=dict)

    model_config = {"from_attributes": True}
