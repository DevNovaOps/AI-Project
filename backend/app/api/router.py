from fastapi import APIRouter

from app.api.v1 import (
    debug_sessions,
    events,
    files,
    findings,
    github,
    health,
    projects,
    repairs,
    reports,
    tests,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(projects.router)
api_router.include_router(github.router)
api_router.include_router(files.router)
api_router.include_router(debug_sessions.router)
api_router.include_router(findings.router)
api_router.include_router(repairs.router)
api_router.include_router(tests.router)
api_router.include_router(reports.router)
api_router.include_router(events.router)
