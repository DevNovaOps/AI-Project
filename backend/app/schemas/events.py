import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class WorkflowEventResponse(BaseModel):
    event_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    session_id: uuid.UUID
    event_type: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    stage_or_agent: str
    message: str
    payload: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}
