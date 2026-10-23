from datetime import datetime, timezone
from typing import Any, Dict

from app.core.logging import logger
from app.graph.state import WorkflowState


def planner_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Agent 1: Planner and Orchestrator
    Validates request parameters, builds execution strategy, and initializes workflow tracking.
    """
    session_id = state.get("session_id", "unknown")
    language = state.get("language", "python")
    files = state.get("files", [])
    max_attempts = state.get("max_repair_attempts", 3)

    logger.info(f"[{session_id}] Planner starting for language='{language}', files={len(files)}")

    plan = {
        "language": language,
        "files_count": len(files),
        "target_files": [f["filename"] for f in files],
        "stages": ["code_analysis", "diagnosis", "fix_and_test", "validation"],
        "max_repair_attempts": max_attempts,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    log_entry = {
        "agent": "Planner",
        "message": f"Initialized debugging plan for {len(files)} file(s). Target: {', '.join(plan['target_files'])}.",
        "status": "info",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    current_logs = list(state.get("logs", []))
    current_logs.append(log_entry)

    return {
        "stage": "planning",
        "plan": plan,
        "current_attempt": 0,
        "logs": current_logs,
        "status": "running",
    }
