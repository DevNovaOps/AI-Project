import uuid
from typing import List

from fastapi import APIRouter, Depends

from app.api.dependencies import get_event_repo, get_session_repo
from app.core.exceptions import ResourceNotFoundException
from app.repositories.events import EventRepository
from app.repositories.sessions import SessionRepository
from app.schemas.events import WorkflowEventResponse

router = APIRouter(prefix="/debug/sessions", tags=["Workflow Events"])


@router.get("/{session_id}/events", response_model=List[WorkflowEventResponse])
def get_session_events(
    session_id: uuid.UUID,
    event_repo: EventRepository = Depends(get_event_repo),
    session_repo: SessionRepository = Depends(get_session_repo),
) -> List[WorkflowEventResponse]:
    """
    Returns chronologically ordered workflow events for a session.
    Provides a REST-based polling fallback so frontend can track progress
    and recover full logs after reconnecting.
    """
    session = session_repo.get_by_id(session_id)
    if not session:
        raise ResourceNotFoundException("DebugSession", str(session_id))

    events = event_repo.get_by_session(session_id)
    return [
        WorkflowEventResponse(
            event_id=e.id,
            session_id=e.session_id,
            event_type=e.event_type,
            timestamp=e.created_at,
            stage_or_agent=e.stage_or_agent,
            message=e.message,
            payload=e.payload,
        )
        for e in events
    ]
