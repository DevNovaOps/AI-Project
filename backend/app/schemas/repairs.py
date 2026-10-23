import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ProposedChangeItem(BaseModel):
    filename: str
    original_snippet: Optional[str] = None
    proposed_snippet: Optional[str] = None
    diff: Optional[str] = None
    explanation: Optional[str] = None


class RepairAttemptResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    attempt_number: int
    diagnosis: Dict[str, Any] = Field(default_factory=dict)
    proposed_changes: List[Dict[str, Any]] = Field(default_factory=list)
    test_result_summary: Dict[str, Any] = Field(default_factory=dict)
    validation_status: str  # passed, failed, partial, skipped, error
    explanation: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
