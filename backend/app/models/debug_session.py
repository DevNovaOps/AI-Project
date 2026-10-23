import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_run import AgentRun
    from app.models.final_report import FinalReport
    from app.models.finding import Finding
    from app.models.project import Project
    from app.models.repair_attempt import RepairAttempt
    from app.models.source_file import SourceFile
    from app.models.test_run import TestRun
    from app.models.workflow_event import WorkflowEvent


class DebugSession(Base, TimestampMixin):
    __tablename__ = "debug_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    language: Mapped[str] = mapped_column(String(50), default="python", nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        default="queued",
        nullable=False,
    )  # queued, running, completed, failed, cancelled, partially_validated
    task_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    configuration: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="debug_sessions")
    files: Mapped[List["SourceFile"]] = relationship(
        "SourceFile",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="SourceFile.created_at",
    )
    agent_runs: Mapped[List["AgentRun"]] = relationship(
        "AgentRun",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="AgentRun.started_at",
    )
    findings: Mapped[List["Finding"]] = relationship(
        "Finding",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="Finding.created_at",
    )
    repair_attempts: Mapped[List["RepairAttempt"]] = relationship(
        "RepairAttempt",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="RepairAttempt.attempt_number",
    )
    test_runs: Mapped[List["TestRun"]] = relationship(
        "TestRun",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="TestRun.started_at",
    )
    final_report: Mapped[Optional["FinalReport"]] = relationship(
        "FinalReport",
        back_populates="session",
        cascade="all, delete-orphan",
        uselist=False,
    )
    events: Mapped[List["WorkflowEvent"]] = relationship(
        "WorkflowEvent",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="WorkflowEvent.created_at",
    )

    __table_args__ = (
        Index("ix_debug_sessions_status", "status"),
        Index("ix_debug_sessions_created_at", "created_at"),
    )
