import uuid
from typing import List

from fastapi import APIRouter, Depends

from app.api.dependencies import get_repair_repo, get_session_repo
from app.core.exceptions import ResourceNotFoundException
from app.repositories.repairs import RepairRepository
from app.repositories.sessions import SessionRepository
from app.schemas.repairs import RepairAttemptResponse

router = APIRouter(prefix="/debug/sessions", tags=["Repairs"])


@router.get("/{session_id}/repairs", response_model=List[RepairAttemptResponse])
def get_session_repairs(
    session_id: uuid.UUID,
    repair_repo: RepairRepository = Depends(get_repair_repo),
    session_repo: SessionRepository = Depends(get_session_repo),
) -> List[RepairAttemptResponse]:
    """Returns proposed changes and repair-attempt history for a session."""
    session = session_repo.get_by_id(session_id)
    if not session:
        raise ResourceNotFoundException("DebugSession", str(session_id))

    repairs = repair_repo.get_by_session(session_id)
    return [RepairAttemptResponse.model_validate(r) for r in repairs]
