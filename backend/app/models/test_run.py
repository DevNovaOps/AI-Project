import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.debug_session import DebugSession


class TestRun(Base):
    __tablename__ = "test_runs"

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
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
    )  # passed, failed, skipped, error, unavailable
    actual_execution: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    command_or_config: Mapped[str] = mapped_column(String(255), default="pytest", nullable=False)
    exit_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stdout_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stderr_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    details: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    session: Mapped["DebugSession"] = relationship("DebugSession", back_populates="test_runs")

    __table_args__ = (
        Index("ix_test_runs_session_id", "session_id"),
        Index("ix_test_runs_status", "status"),
    )
