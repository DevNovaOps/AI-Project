from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class APIErrorResponse(BaseModel):
    error: bool = True
    message: str
    details: Optional[Dict[str, Any]] = None
    path: Optional[str] = None


class HealthStatusResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    database: Dict[str, Any]
    ai_provider: Dict[str, Any]
    execution_subsystem: Dict[str, Any]
