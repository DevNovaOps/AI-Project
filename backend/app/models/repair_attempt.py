import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.debug_session import DebugSession


class RepairAttempt(Base):
    __tablename__ = "repair_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("debug_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    diagnosis: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    proposed_changes: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    test_result_summary: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    validation_status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
    )  # passed, failed, partial, skipped, error
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session: Mapped["DebugSession"] = relationship("DebugSession", back_populates="repair_attempts")

    __table_args__ = (
        Index("ix_repair_attempts_session_id", "session_id"),
        Index("ix_repair_attempts_attempt_num", "session_id", "attempt_number"),
    )
