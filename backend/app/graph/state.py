from typing import Any, Dict, List, Optional

from typing_extensions import TypedDict


class WorkflowState(TypedDict, total=False):
    session_id: str
    title: Optional[str]
    language: str
    task_description: Optional[str]
    files: List[Dict[str, Any]]  # original files: [{filename, content, language}]
    max_repair_attempts: int
    current_attempt: int

    # Stage outputs
    plan: Dict[str, Any]
    findings: List[Dict[str, Any]]
    diagnosis: Dict[str, Any]
    repair_attempt: Dict[str, Any]
    proposed_files: List[Dict[str, Any]]
    test_run: Dict[str, Any]
    validation_status: str  # passed, failed, partial, could_not_run
    unresolved_issues: List[Dict[str, Any]]
    final_report: Dict[str, Any]

    # Overall workflow control
    stage: str
    status: str  # running, completed, failed, cancelled, partially_validated
    error: Optional[str]
    logs: List[Dict[str, Any]]
