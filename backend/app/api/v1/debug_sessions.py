import asyncio
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, WebSocket, WebSocketDisconnect, status

from app.api.dependencies import get_event_repo, get_session_repo
from app.core.exceptions import ResourceNotFoundException, WorkflowConflictException
from app.core.logging import logger
from app.events.manager import event_manager
from app.repositories.events import EventRepository
from app.repositories.sessions import SessionRepository
from app.schemas.sessions import (
    DebugSessionCreateRequest,
    DebugSessionResponse,
    DebugSessionRunResponse,
)
from app.security.input_limits import validate_session_limits

router = APIRouter(prefix="/debug/sessions", tags=["Debug Sessions"])

# In-memory tracking of active workflow tasks to support cancellation and prevent duplicate runs
active_workflow_tasks: dict[str, asyncio.Task] = {}


@router.post("", response_model=DebugSessionResponse, status_code=status.HTTP_201_CREATED)
def create_debug_session(
    request: DebugSessionCreateRequest,
    session_repo: SessionRepository = Depends(get_session_repo),
    event_repo: EventRepository = Depends(get_event_repo),
) -> DebugSessionResponse:
    """Creates a new debugging session with submitted source files."""
    files_data = [{"filename": f.filename, "content": f.content, "language": f.language} for f in request.files]

    # Validate limits and security constraints
    validate_session_limits(
        files_data=files_data,
        language=request.language,
        max_repair_attempts=request.max_repair_attempts,
    )

    session = session_repo.create(
        language=request.language,
        files=files_data,
        title=request.title,
        task_description=request.task_description,
        requested_checks=request.requested_checks,
        max_repair_attempts=request.max_repair_attempts,
    )

    # Record initial event
    event_repo.record(
        session_id=session.id,
        event_type="session.created",
        stage_or_agent="System",
        message=f"Session created with {len(files_data)} file(s). Status: queued.",
        payload={"file_count": len(files_data), "language": session.language},
    )

    return DebugSessionResponse.model_validate(session)


@router.get("/{session_id}", response_model=DebugSessionResponse)
def get_debug_session(
    session_id: uuid.UUID,
    session_repo: SessionRepository = Depends(get_session_repo),
) -> DebugSessionResponse:
    """Retrieves debugging session metadata and source files."""
    session = session_repo.get_by_id(session_id)
    if not session:
        raise ResourceNotFoundException("DebugSession", str(session_id))
    return DebugSessionResponse.model_validate(session)


@router.post("/{session_id}/run", response_model=DebugSessionRunResponse)
async def run_debug_session(
    session_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    session_repo: SessionRepository = Depends(get_session_repo),
) -> DebugSessionRunResponse:
    """
    Starts the autonomous multi-agent workflow for the session.
    Executes asynchronously to prevent blocking the HTTP handler.
    """
    session = session_repo.get_by_id(session_id)
    if not session:
        raise ResourceNotFoundException("DebugSession", str(session_id))

    session_str = str(session_id)

    # Prevent accidental duplicate execution
    if session_str in active_workflow_tasks and not active_workflow_tasks[session_str].done():
        raise WorkflowConflictException(
            f"Workflow for session {session_id} is already running."
        )

    if session.status == "running":
        raise WorkflowConflictException(
            f"Session {session_id} is already in 'running' status."
        )

    session_repo.update_status(session_id, "running")

    # Import runner here to avoid circular imports
    from app.services.workflow_service import run_workflow_for_session

    task = asyncio.create_task(run_workflow_for_session(session_id))
    active_workflow_tasks[session_str] = task

    return DebugSessionRunResponse(
        session_id=session_id,
        status="running",
        workflow_id=f"wf-{session_id}",
        message="Autonomous debugging workflow started in background.",
    )


@router.post("/{session_id}/cancel")
async def cancel_debug_session(
    session_id: uuid.UUID,
    session_repo: SessionRepository = Depends(get_session_repo),
    event_repo: EventRepository = Depends(get_event_repo),
):
    """Cancels a currently executing debugging session."""
    session = session_repo.get_by_id(session_id)
    if not session:
        raise ResourceNotFoundException("DebugSession", str(session_id))

    session_str = str(session_id)
    task = active_workflow_tasks.get(session_str)
    if task and not task.done():
        task.cancel()
        session_repo.update_status(session_id, "cancelled", completed=True)
        event_repo.record(
            session_id=session_id,
            event_type="workflow.cancelled",
            stage_or_agent="System",
            message="Workflow execution cancelled by user request.",
        )
        await event_manager.broadcast_event(
            session_id=session_str,
            event_type="workflow.cancelled",
            stage_or_agent="System",
            message="Workflow cancelled.",
        )
        return {"status": "cancelled", "message": "Workflow task has been cancelled."}

    session_repo.update_status(session_id, "cancelled", completed=True)
    return {"status": "cancelled", "message": "Session marked as cancelled."}


@router.websocket("/{session_id}/ws")
async def websocket_session_progress(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time streaming of workflow progress and logs.
    Includes disconnect handling and recovery hooks.
    """
    await event_manager.connect(session_id, websocket)
    try:
        # Send initial confirmation event
        await websocket.send_json({
            "event_type": "ws.connected",
            "session_id": session_id,
            "message": "Connected to AutonomusAI real-time event stream.",
        })
        while True:
            # Keep connection open and accept client messages/heartbeats
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await event_manager.disconnect(session_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket error for session {session_id}: {e}")
        await event_manager.disconnect(session_id, websocket)
