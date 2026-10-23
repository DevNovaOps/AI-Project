from datetime import datetime, timezone
from typing import Any, Dict

from app.core.logging import logger
from app.graph.state import WorkflowState
from app.services.static_analysis_service import static_analysis_service
from app.services.validation_service import validation_service


def validation_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Agent 5: Validation Agent
    Re-runs static analysis on proposed code, reviews test results,
    and establishes evidence-based validation status.
    """
    session_id = state.get("session_id", "unknown")
    proposed_files = state.get("proposed_files", [])
    original_findings = state.get("findings", [])
    repair_attempt = state.get("repair_attempt", {})
    test_run = state.get("test_run", {})
    language = state.get("language", "python")

    logger.info(f"[{session_id}] Validation Agent evaluating evidence")

    # Re-run static analysis on patched files
    findings_after = []
    for f in proposed_files:
        fname = f["filename"]
        content = f.get("proposed_content", "")
        f_findings = static_analysis_service.analyze_file(fname, content, language)
        findings_after.extend(f_findings)

    patch_valid = repair_attempt.get("patch_valid", True)
    patch_error = repair_attempt.get("patch_error")

    val_status, unresolved_issues, explanation = validation_service.evaluate(
        static_findings_before=original_findings,
        static_findings_after=findings_after,
        test_run=test_run,
        patch_valid=patch_valid,
        patch_error=patch_error,
    )

    log_entry = {
        "agent": "Validation",
        "message": f"Validation status: {val_status}. {explanation}",
        "status": "success" if val_status == "passed" else ("warning" if val_status in ("partial", "could_not_run") else "error"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    current_logs = list(state.get("logs", []))
    current_logs.append(log_entry)

    return {
        "stage": "validation",
        "validation_status": val_status,
        "unresolved_issues": unresolved_issues,
        "logs": current_logs,
    }


def final_report_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Agent 5 (Reporting Phase): Final Report Generation
    Compiles findings, repair attempts, test executions, and unresolved risks into FinalReport.
    """
    session_id = state.get("session_id", "unknown")
    val_status = state.get("validation_status", "could_not_run")
    findings = state.get("findings", [])
    repair_attempt = state.get("repair_attempt", {})
    test_run = state.get("test_run", {})
    unresolved = state.get("unresolved_issues", [])

    logger.info(f"[{session_id}] Generating Final Report with validation_status='{val_status}'")

    summary = (
        f"Debugging session completed with validation status: {val_status}. "
        f"Identified {len(findings)} initial finding(s). "
        f"Generated {len(repair_attempt.get('proposed_changes', []))} file modification(s). "
        f"Test execution boundary: {test_run.get('status')} (actual_execution={test_run.get('actual_execution')})."
    )

    final_report = {
        "summary": summary,
        "validation_status": val_status,
        "findings_summary": {
            "initial_count": len(findings),
            "critical_count": sum(1 for f in findings if f.get("severity") == "Critical"),
            "high_count": sum(1 for f in findings if f.get("severity") == "High"),
            "medium_count": sum(1 for f in findings if f.get("severity") == "Medium"),
        },
        "repairs_summary": repair_attempt.get("proposed_changes", []),
        "tests_summary": {
            "status": test_run.get("status"),
            "actual_execution": test_run.get("actual_execution"),
            "exit_code": test_run.get("exit_code"),
            "command": test_run.get("command_or_config"),
        },
        "unresolved_issues": unresolved,
        "created_at": datetime.now(timezone.utc),
    }

    final_status = "completed" if val_status == "passed" else ("partially_validated" if val_status == "partial" else "completed")

    log_entry = {
        "agent": "Validation & Reporting",
        "message": f"Final report generated. Workflow {final_status}.",
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    current_logs = list(state.get("logs", []))
    current_logs.append(log_entry)

    return {
        "stage": "reporting",
        "final_report": final_report,
        "status": final_status,
        "logs": current_logs,
    }
