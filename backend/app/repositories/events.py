import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.workflow_event import WorkflowEvent


class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def record(
        self,
        session_id: uuid.UUID,
        event_type: str,
        stage_or_agent: str,
        message: str,
        payload: Optional[dict] = None,
    ) -> WorkflowEvent:
        event = WorkflowEvent(
            session_id=session_id,
            event_type=event_type,
            stage_or_agent=stage_or_agent,
            message=message,
            payload=payload or {},
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_by_session(self, session_id: uuid.UUID) -> List[WorkflowEvent]:
        stmt = (
            select(WorkflowEvent)
            .where(WorkflowEvent.session_id == session_id)
            .order_by(WorkflowEvent.created_at)
        )
        return list(self.db.scalars(stmt).all())
