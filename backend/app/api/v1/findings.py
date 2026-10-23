import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_finding_repo, get_session_repo
from app.core.exceptions import ResourceNotFoundException
from app.repositories.findings import FindingRepository
from app.repositories.sessions import SessionRepository
from app.schemas.findings import FindingResponse

router = APIRouter(prefix="/debug/sessions", tags=["Findings"])


@router.get("/{session_id}/findings", response_model=List[FindingResponse])
def get_session_findings(
    session_id: uuid.UUID,
    severity: Optional[str] = Query(default=None, description="Filter by severity: Critical, High, Medium, Low, Info"),
    category: Optional[str] = Query(default=None, description="Filter by category: Syntax, Runtime Error, Logic, Code Quality, Security"),
    finding_repo: FindingRepository = Depends(get_finding_repo),
    session_repo: SessionRepository = Depends(get_session_repo),
) -> List[FindingResponse]:
    """Returns structured findings for a session with optional severity and category filters."""
    session = session_repo.get_by_id(session_id)
    if not session:
        raise ResourceNotFoundException("DebugSession", str(session_id))

    findings = finding_repo.get_by_session(session_id, severity=severity, category=category)
    return [FindingResponse.model_validate(f) for f in findings]
