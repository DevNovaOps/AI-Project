import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List

from sqlalchemy import JSON, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.debug_session import DebugSession


class FinalReport(Base):
    __tablename__ = "final_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("debug_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    validation_status: Mapped[str] = mapped_column(
        String(50),
        default="could_not_run",
        nullable=False,
    )  # passed, failed, partial, could_not_run
    findings_summary: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    repairs_summary: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    tests_summary: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    unresolved_issues: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session: Mapped["DebugSession"] = relationship("DebugSession", back_populates="final_report")

    __table_args__ = (
        Index("ix_final_reports_session_id", "session_id"),
    )
