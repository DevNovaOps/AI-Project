import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.debug_session import DebugSession
from app.models.source_file import SourceFile


class SessionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        language: str,
        files: List[dict],
        title: Optional[str] = None,
        task_description: Optional[str] = None,
        requested_checks: Optional[List[str]] = None,
        max_repair_attempts: int = 3,
    ) -> DebugSession:
        session = DebugSession(
            title=title or f"Debug Session - {language}",
            language=language.lower(),
            status="queued",
            task_description=task_description,
            source_metadata={
                "file_count": len(files),
                "filenames": [f["filename"] for f in files],
            },
            configuration={
                "requested_checks": requested_checks or ["syntax", "style", "runtime", "security"],
                "max_repair_attempts": max_repair_attempts,
            },
        )
        self.db.add(session)
        self.db.flush()

        for f in files:
            source_file = SourceFile(
                session_id=session.id,
                filename=f["filename"],
                language=f.get("language") or language.lower(),
                original_content=f["content"],
                proposed_content=None,
                file_metadata={"size_bytes": len(f["content"].encode("utf-8"))},
            )
            self.db.add(source_file)

        self.db.commit()
        self.db.refresh(session)
        return session

    def get_by_id(self, session_id: uuid.UUID) -> Optional[DebugSession]:
        stmt = (
            select(DebugSession)
            .where(DebugSession.id == session_id)
            .options(selectinload(DebugSession.files))
        )
        return self.db.scalars(stmt).first()

    def update_status(self, session_id: uuid.UUID, status: str, completed: bool = False) -> Optional[DebugSession]:
        session = self.get_by_id(session_id)
        if session:
            session.status = status
            session.updated_at = datetime.now(timezone.utc)
            if completed:
                session.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(session)
        return session

    def update_file_proposed_content(self, session_id: uuid.UUID, filename: str, proposed_content: str) -> None:
        stmt = select(SourceFile).where(
            SourceFile.session_id == session_id,
            SourceFile.filename == filename,
        )
        source_file = self.db.scalars(stmt).first()
        if source_file:
            source_file.proposed_content = proposed_content
            self.db.commit()
