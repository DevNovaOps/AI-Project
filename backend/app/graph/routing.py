from typing import Literal

from app.core.logging import logger
from app.graph.state import WorkflowState


def should_retry_or_finish(state: WorkflowState) -> Literal["diagnosis_agent", "reporting_agent"]:
    """
    Conditional routing function following Validation node:
    - If validation passed -> route to 'reporting_agent' -> END
    - If validation failed and current_attempt < max_repair_attempts -> increment attempt & route back to 'diagnosis_agent'
    - If max repair attempts reached -> route to 'reporting_agent' -> END
    """
    val_status = state.get("validation_status", "could_not_run")
    current_attempt = state.get("current_attempt", 1)
    max_attempts = state.get("max_repair_attempts", 3)
    session_id = state.get("session_id", "unknown")

    if val_status == "passed":
        logger.info(f"[{session_id}] Validation passed. Proceeding to final report.")
        return "reporting_agent"

    if current_attempt < max_attempts and val_status in ("failed", "partial"):
        logger.info(
            f"[{session_id}] Validation {val_status}. Retrying repair attempt {current_attempt + 1}/{max_attempts}."
        )
        return "diagnosis_agent"

    logger.info(
        f"[{session_id}] Reached terminal validation condition ({val_status}) or attempt limit ({current_attempt}/{max_attempts})."
    )
    return "reporting_agent"
