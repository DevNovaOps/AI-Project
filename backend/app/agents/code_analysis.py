from datetime import datetime, timezone
from typing import Any, Dict

from app.core.logging import logger
from app.graph.state import WorkflowState
from app.services.static_analysis_service import static_analysis_service


def code_analysis_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Agent 2: Code Analysis Agent
    Runs deterministic AST inspection and Ruff linting on submitted source code.
    Produces structured findings with severity, line number, and evidence.
    """
    session_id = state.get("session_id", "unknown")
    files = state.get("files", [])
    language = state.get("language", "python")

    logger.info(f"[{session_id}] Code Analysis Agent analyzing {len(files)} file(s)")

    # Run deterministic analysis
    findings = static_analysis_service.analyze_session_files(files, language=language)

    critical_count = sum(1 for f in findings if f.get("severity") == "Critical")
    high_count = sum(1 for f in findings if f.get("severity") == "High")
    total_count = len(findings)

    msg = f"Analysis complete. Identified {total_count} issue(s) ({critical_count} critical, {high_count} high)."

    log_entry = {
        "agent": "Code Analysis",
        "message": msg,
        "status": "warning" if total_count > 0 else "info",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    current_logs = list(state.get("logs", []))
    current_logs.append(log_entry)

    return {
        "stage": "code_analysis",
        "findings": findings,
        "logs": current_logs,
    }
