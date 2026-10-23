import uuid
from typing import TYPE_CHECKING, Any, Dict, Optional

from sqlalchemy import JSON, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.debug_session import DebugSession


class SourceFile(Base, TimestampMixin):
    __tablename__ = "source_files"

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
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    language: Mapped[str] = mapped_column(String(50), default="python", nullable=False)
    original_content: Mapped[str] = mapped_column(Text, nullable=False)
    proposed_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    session: Mapped["DebugSession"] = relationship("DebugSession", back_populates="files")

    __table_args__ = (
        Index("ix_source_files_session_id", "session_id"),
        Index("ix_source_files_filename", "session_id", "filename"),
    )
