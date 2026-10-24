import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from fastapi import APIRouter, Depends

from app.api.dependencies import get_repair_repo, get_session_repo
from app.core.exceptions import ResourceNotFoundException
from app.repositories.repairs import RepairRepository
from app.repositories.sessions import SessionRepository
from app.schemas.repairs import RepairAttemptResponse
from app.services.llm_service import llm_service
from app.services.patch_service import patch_service
from app.agents.fix_and_test import _generate_fallback_patch

router = APIRouter(tags=["Repairs"])


@router.get("/debug/sessions/{session_id}/repairs", response_model=List[RepairAttemptResponse])
def get_session_repairs(
    session_id: uuid.UUID,
    repair_repo: RepairRepository = Depends(get_repair_repo),
    session_repo: SessionRepository = Depends(get_session_repo),
) -> List[RepairAttemptResponse]:
    """Returns proposed changes and repair-attempt history for a session."""
    session = session_repo.get_by_id(session_id)
    if not session:
        raise ResourceNotFoundException("DebugSession", str(session_id))

    repairs = repair_repo.get_by_session(session_id)
    return [RepairAttemptResponse.model_validate(r) for r in repairs]


class GenerateRepairRequest(BaseModel):
    code: str
    filename: Optional[str] = "main.py"
    language: Optional[str] = "python"
    mode: Optional[str] = "suggestions"  # suggestions, autofix, refactor, optimize
    instructions: Optional[str] = None


@router.post("/repairs/generate")
def generate_repair_proposal(payload: GenerateRepairRequest) -> Dict[str, Any]:
    """
    On-demand AI fix / patch generator for any code snippet.
    Supports modes: suggestions, autofix, refactor, optimize.
    """
    code = payload.code
    fname = payload.filename or "main.py"
    lang = payload.language or "python"
    mode = payload.mode or "suggestions"

    # If LLM is configured, attempt LLM generation
    if llm_service.is_configured():
        try:
            task_desc = f"Generate code improvement for mode='{mode}'. Instructions: {payload.instructions or 'Fix errors and harden code'}"
            fix_output = llm_service.generate_repair(
                task_description=task_desc,
                files=[{"filename": fname, "content": code}],
                findings=[],
                diagnosis={"root_cause_summary": f"User requested {mode} optimization."},
                attempt_number=1,
            )
            if fix_output.patches:
                patch = fix_output.patches[0]
                diff_text = patch_service.compute_diff(code, patch.proposed_content, fname)
                return {
                    "title": f"AI {mode.capitalize()} Proposal",
                    "severity": "Medium",
                    "category": mode.capitalize(),
                    "detail": patch.explanation or fix_output.explanation,
                    "original_code": code,
                    "fixed_code": patch.proposed_content,
                    "diff": diff_text,
                    "explanation": patch.explanation or fix_output.explanation,
                    "root_cause": "AI-detected improvement or bug repair.",
                    "mode": mode,
                }
        except Exception:
            pass

    # Use deterministic fallback generator
    patches = _generate_fallback_patch(
        files=[{"filename": fname, "content": code}],
        findings=[],
    )
    patched_item = patches[0] if patches else {"proposed_content": code, "explanation": "Defensive patch generated."}
    fixed_code = patched_item.get("proposed_content", code)
    explanation = patched_item.get("explanation", "Applied defensive validation.")

    diff_text = patch_service.compute_diff(code, fixed_code, fname)

    return {
        "title": f"Automated {mode.capitalize()} Proposal",
        "severity": "High" if "ZeroDivisionError" in explanation else "Medium",
        "category": "Runtime Error" if "ZeroDivisionError" in explanation else mode.capitalize(),
        "detail": explanation,
        "original_code": code,
        "fixed_code": fixed_code,
        "diff": diff_text,
        "explanation": explanation,
        "root_cause": "Potential runtime defect or optimization opportunity.",
        "mode": mode,
    }
