import uuid
from typing import List

from fastapi import APIRouter, Depends

from app.api.dependencies import get_session_repo, get_test_repo
from app.core.exceptions import ResourceNotFoundException
from app.repositories.sessions import SessionRepository
from app.repositories.tests import TestRepository
from app.schemas.tests import TestRunResponse

router = APIRouter(prefix="/debug/sessions", tags=["Test Results"])


@router.get("/{session_id}/tests", response_model=List[TestRunResponse])
def get_session_tests(
    session_id: uuid.UUID,
    test_repo: TestRepository = Depends(get_test_repo),
    session_repo: SessionRepository = Depends(get_session_repo),
) -> List[TestRunResponse]:
    """Returns test execution records, exit codes, bounded output, and sandbox indicators."""
    session = session_repo.get_by_id(session_id)
    if not session:
        raise ResourceNotFoundException("DebugSession", str(session_id))

    tests = test_repo.get_by_session(session_id)
    return [TestRunResponse.model_validate(t) for t in tests]
