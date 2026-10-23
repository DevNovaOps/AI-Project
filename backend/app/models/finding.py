import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.debug_session import DebugSession
    from app.models.source_file import SourceFile


class Finding(Base):
    __tablename__ = "findings"

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
    source_file_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("source_files.id", ondelete="SET NULL"),
        nullable=True,
    )
    category: Mapped[str] = mapped_column(
        String(50),
        default="Code Quality",
        nullable=False,
    )  # Syntax, Runtime Error, Logic, Code Quality, Security, Type Error
    severity: Mapped[str] = mapped_column(
        String(20),
        default="Medium",
        nullable=False,
    )  # Critical, High, Medium, Low, Info
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    line_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    column_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    origin: Mapped[str] = mapped_column(
        String(50),
        default="AST",
        nullable=False,
    )  # AST, Ruff, Test Execution, LLM
    status: Mapped[str] = mapped_column(
        String(50),
        default="Open",
        nullable=False,
    )  # Open, Fixed, Unresolved, Ignored
    metadata_info: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session: Mapped["DebugSession"] = relationship("DebugSession", back_populates="findings")
    source_file: Mapped[Optional["SourceFile"]] = relationship("SourceFile")

    __table_args__ = (
        Index("ix_findings_session_id", "session_id"),
        Index("ix_findings_severity", "severity"),
        Index("ix_findings_category", "category"),
        Index("ix_findings_origin", "origin"),
    )
