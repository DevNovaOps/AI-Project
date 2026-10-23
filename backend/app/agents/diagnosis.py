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
    """Generates structured diagnosis from deterministic static findings without pretending AI ran."""
    if not findings:
        return {
            "root_cause_summary": "No syntax or static analysis errors were identified in the source files.",
            "suspected_causes": [],
            "recommended_repair_strategy": "Verify runtime behavior or add defensive test coverage.",
            "confidence": 70,
            "provider_note": error_msg,
        }

    top_finding = findings[0]
    return {
        "root_cause_summary": f"Identified issue: {top_finding.get('title')}. {top_finding.get('description')}",
        "suspected_causes": [
            {
                "title": top_finding.get("title"),
                "file": top_finding.get("file", "main.py"),
                "line_number": top_finding.get("line_number"),
                "explanation": top_finding.get("description"),
                "confidence": 90 if top_finding.get("severity") in ("Critical", "High") else 75,
            }
        ],
        "recommended_repair_strategy": "Apply defensive validation guard or correct syntax at the indicated location.",
        "confidence": 85,
        "provider_note": error_msg,
    }
