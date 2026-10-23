import uuid

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.api.dependencies import get_report_repo, get_session_repo
from app.core.exceptions import ResourceNotFoundException
from app.repositories.reports import ReportRepository
from app.repositories.sessions import SessionRepository
from app.schemas.reports import FinalReportResponse

router = APIRouter(prefix="/debug/sessions", tags=["Reports"])


@router.get("/{session_id}/report", response_model=FinalReportResponse)
def get_session_report(
    session_id: uuid.UUID,
    report_repo: ReportRepository = Depends(get_report_repo),
    session_repo: SessionRepository = Depends(get_session_repo),
):
    """
    Returns the evidence-based final report for the debugging session.
    If the workflow is incomplete, returns an appropriate status instead of fabricating a report.
    """
    session = session_repo.get_by_id(session_id)
    if not session:
        raise ResourceNotFoundException("DebugSession", str(session_id))

    report = report_repo.get_by_session(session_id)
    if not report:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "error": True,
                "message": f"Final report is not yet available for session '{session_id}'. Current workflow status is '{session.status}'.",
                "details": {
                    "session_id": str(session_id),
                    "current_status": session.status,
                    "completed": session.completed_at is not None,
                },
            },
        )

    return FinalReportResponse.model_validate(report)
