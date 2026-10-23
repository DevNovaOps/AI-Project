from datetime import datetime, timezone
from typing import Any, Dict, List

from app.core.logging import logger
from app.graph.state import WorkflowState
from app.services.execution_service import execution_service
from app.services.llm_service import llm_service
from app.services.patch_service import patch_service


def fix_and_test_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Agent 4: Fix and Test Agent
    Generates proposed code repairs, validates syntax/diffs, preserves original source,
    and runs tests strictly within the sandbox execution boundary.
    """
    session_id = state.get("session_id", "unknown")
    files = state.get("files", [])
    findings = state.get("findings", [])
    diagnosis = state.get("diagnosis", {})
    task_desc = state.get("task_description")
    current_attempt = state.get("current_attempt", 1)
    prev_test = state.get("test_run", {})

    logger.info(f"[{session_id}] Fix & Test Agent generating repair (Attempt {current_attempt})")

    # 1. Generate repair proposal
    proposed_patches = []
    if llm_service.is_configured():
        try:
            fix_output = llm_service.generate_repair(
                task_description=task_desc,
                files=files,
                findings=findings,
                diagnosis=diagnosis,
                attempt_number=current_attempt,
                previous_test_output=prev_test.get("stderr_summary"),
            )
            proposed_patches = fix_output.patches
        except Exception as exc:
            logger.warning(f"LLM fix generation failed, falling back to deterministic template: {exc}")
            proposed_patches = _generate_fallback_patch(files, findings)
    else:
        proposed_patches = _generate_fallback_patch(files, findings)

    # 2. Process and validate proposed patches
    processed_changes, patch_valid, patch_error = patch_service.process_proposed_changes(
        original_files=files,
        proposed_patches=proposed_patches,
        language=state.get("language", "python"),
    )

    # Build proposed files representation (original preserved untouched!)
    proposed_files = []
    change_map = {c["filename"]: c["proposed_content"] for c in processed_changes}
    for orig in files:
        fname = orig["filename"]
        proposed_files.append({
            "filename": fname,
            "original_content": orig.get("content") or orig.get("original_content", ""),
            "proposed_content": change_map.get(fname, orig.get("content") or orig.get("original_content", "")),
        })

    # 3. Run tests through execution boundary
    test_run = execution_service.run_tests(proposed_files)

    repair_attempt = {
        "attempt_number": current_attempt,
        "diagnosis": diagnosis,
        "proposed_changes": processed_changes,
        "patch_valid": patch_valid,
        "patch_error": patch_error,
        "test_result_summary": {
            "status": test_run.get("status"),
            "actual_execution": test_run.get("actual_execution"),
            "exit_code": test_run.get("exit_code"),
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    log_entry_fix = {
        "agent": "Fix & Test",
        "message": f"Synthesized patch modifying {len(processed_changes)} file(s). Syntax valid: {patch_valid}.",
        "status": "success" if patch_valid else "error",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    log_entry_test = {
        "agent": "Fix & Test",
        "message": f"Test boundary status: {test_run.get('status')} (actual_execution={test_run.get('actual_execution')}).",
        "status": "info" if test_run.get("status") in ("passed", "skipped") else "warning",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    current_logs = list(state.get("logs", []))
    current_logs.append(log_entry_fix)
    current_logs.append(log_entry_test)

    return {
        "stage": "fix_and_test",
        "repair_attempt": repair_attempt,
        "proposed_files": proposed_files,
        "test_run": test_run,
        "logs": current_logs,
    }


def _generate_fallback_patch(files: List[Dict[str, Any]], findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Deterministic fallback patch for common patterns (e.g. adding empty list check for division)."""
    patches = []
    for f in files:
        fname = f["filename"]
        content = f.get("content") or f.get("original_content", "")

        # If division by len(...) pattern without zero check is present, add guard
        if "sum(numbers) / len(numbers)" in content and "len(numbers) == 0" not in content:
            new_content = content.replace(
                "return sum(numbers) / len(numbers)",
                "if not numbers or len(numbers) == 0:\n        return 0\n    return sum(numbers) / len(numbers)",
            )
            patches.append({
                "filename": fname,
                "proposed_content": new_content,
                "explanation": "Added zero guard to prevent ZeroDivisionError on empty collections.",
            })
        else:
            # Identity proposal if no specific template matches
            patches.append({
                "filename": fname,
                "proposed_content": content,
                "explanation": "No automated patch rule matched without active Groq LLM service.",
            })

    return patches
