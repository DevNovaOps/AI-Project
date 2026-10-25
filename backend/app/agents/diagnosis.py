from datetime import datetime, timezone
from typing import Any, Dict

from app.core.logging import logger
from app.graph.state import WorkflowState
from app.services.llm_service import llm_service


def diagnosis_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Agent 3: Diagnosis Agent
    Connects errors to relevant source locations, identifies root causes,
    ranks suspected causes with confidence, and recommends repair strategy.
    """
    session_id = state.get("session_id", "unknown")
    files = state.get("files", [])
    findings = state.get("findings", [])
    task_desc = state.get("task_description")

    logger.info(f"[{session_id}] Diagnosis Agent diagnosing {len(findings)} findings")

    if llm_service.is_configured():
        try:
            diag_output = llm_service.diagnose(
                task_description=task_desc,
                files=files,
                findings=findings,
                model=state.get("model"),
            )
            diagnosis = diag_output.model_dump()
        except Exception as exc:
            logger.warning(f"LLM diagnosis failed, falling back to deterministic summary: {exc}")
            diagnosis = _generate_fallback_diagnosis(findings, error_msg=str(exc))
    else:
        diagnosis = _generate_fallback_diagnosis(
            findings,
            error_msg="Groq API key not configured. Using deterministic static analysis diagnosis.",
        )

    log_entry = {
        "agent": "Diagnosis",
        "message": f"Root cause diagnosed: {diagnosis.get('root_cause_summary')[:100]}... (Confidence: {diagnosis.get('confidence', 85)}%)",
        "status": "info",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    current_logs = list(state.get("logs", []))
    current_logs.append(log_entry)

    current_attempt = state.get("current_attempt", 0) + 1

    return {
        "stage": "diagnosis",
        "current_attempt": current_attempt,
        "diagnosis": diagnosis,
        "logs": current_logs,
    }


def _generate_fallback_diagnosis(findings: list, error_msg: str = "") -> Dict[str, Any]:
    """Generates structured diagnosis from ALL static findings without pretending AI ran."""
    if not findings:
        return {
            "root_cause_summary": "No syntax or static analysis errors were identified in the source files.",
            "suspected_causes": [],
            "recommended_repair_strategy": "Verify runtime behavior or add defensive test coverage.",
            "confidence": 70,
            "provider_note": error_msg,
        }

    # Include ALL findings, not just the first one
    suspected_causes = []
    for f in findings:
        if f.get("severity") in ("Critical", "High", "Medium"):
            suspected_causes.append({
                "title": f.get("title", "Unknown issue"),
                "file": f.get("file", "unknown"),
                "line_number": f.get("line_number"),
                "explanation": f.get("description", ""),
                "confidence": 95 if f.get("severity") == "Critical" else (85 if f.get("severity") == "High" else 70),
            })

    critical_count = sum(1 for f in findings if f.get("severity") == "Critical")
    high_count = sum(1 for f in findings if f.get("severity") == "High")

    root_summary = (
        f"Identified {len(findings)} issue(s) across project files "
        f"({critical_count} critical, {high_count} high severity). "
        f"Top issue: {findings[0].get('title')}. "
        f"{findings[0].get('description')}"
    )

    return {
        "root_cause_summary": root_summary,
        "suspected_causes": suspected_causes[:20],  # Cap at 20
        "recommended_repair_strategy": (
            f"Fix all {critical_count} critical and {high_count} high severity issues. "
            "Apply keyword/method corrections, fix syntax errors, and resolve undefined references."
        ),
        "confidence": 90,
        "provider_note": error_msg,
    }
