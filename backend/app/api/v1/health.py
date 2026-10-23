from fastapi import APIRouter

from app.core.config import settings
from app.db.session import check_db_health
from app.schemas.common import HealthStatusResponse
from app.security.sandbox import execution_boundary

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthStatusResponse)
def get_health() -> HealthStatusResponse:
    """
    Health check returning:
    - API operational status
    - Database connectivity
    - AI provider configuration status (without leaking secrets)
    - Safe execution sandbox status
    """
    db_connected, db_message = check_db_health()

    ai_configured = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())
    ai_status = {
        "provider": "Groq",
        "configured": ai_configured,
        "model": settings.GROQ_MODEL,
        "status": "ready" if ai_configured else "unconfigured: GROQ_API_KEY missing",
    }

    db_type = "mysql" if "mysql" in settings.DATABASE_URL else ("sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql")
    db_status = {
        "connected": db_connected,
        "detail": db_message,
        "url_type": db_type,
    }

    sandbox_status = execution_boundary.get_status()

    overall_status = "ok" if db_connected else "degraded"

    return HealthStatusResponse(
        status=overall_status,
        version="0.1.0",
        database=db_status,
        ai_provider=ai_status,
        execution_subsystem=sandbox_status,
    )
