import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.debug_session import DebugSession
    from app.models.repository import Repository
    from app.models.workspace_file import WorkspaceFile


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    source_type: Mapped[str] = mapped_column(
        String(50),
        default="managed",
        nullable=False,
    )  # 'managed', 'github', 'upload'
    default_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)

    # Relationships
    repositories: Mapped[List["Repository"]] = relationship(
        "Repository",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    files: Mapped[List["WorkspaceFile"]] = relationship(
        "WorkspaceFile",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="WorkspaceFile.relative_path",
    )
    debug_sessions: Mapped[List["DebugSession"]] = relationship(
        "DebugSession",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_projects_name", "name"),
        Index("ix_projects_source_type", "source_type"),
    )
