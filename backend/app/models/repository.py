import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.repository_import_job import RepositoryImportJob


class Repository(Base, TimestampMixin):
    __tablename__ = "repositories"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(50), default="github", nullable=False)
    owner: Mapped[str] = mapped_column(String(255), nullable=False)
    repository_name: Mapped[str] = mapped_column(String(255), nullable=False)
    external_repository_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    html_url: Mapped[str] = mapped_column(String(500), nullable=False)
    default_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    selected_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    import_status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
    )  # pending, in_progress, completed, failed
    last_imported_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="repositories")
    import_jobs: Mapped[List["RepositoryImportJob"]] = relationship(
        "RepositoryImportJob",
        back_populates="repository",
        cascade="all, delete-orphan",
        order_by="desc(RepositoryImportJob.started_at)",
    )

    __table_args__ = (
        Index("ix_repositories_project_id", "project_id"),
        Index("ix_repositories_owner_repo", "owner", "repository_name"),
    )
