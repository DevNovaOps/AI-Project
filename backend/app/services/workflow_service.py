import uuid
from datetime import datetime, timezone

from app.core.logging import logger
from app.db.session import SessionLocal
from app.events.manager import event_manager
from app.graph.workflow import autonomous_workflow
from app.repositories.events import EventRepository
from app.repositories.findings import FindingRepository
from app.repositories.repairs import RepairRepository
from app.repositories.reports import ReportRepository
from app.repositories.sessions import SessionRepository
from app.repositories.tests import TestRepository


async def run_workflow_for_session(session_id: uuid.UUID) -> None:
    """
    Executes the autonomous 5-Agent workflow for a debugging session.
    Streams progress, saves findings, repair attempts, test runs, and final reports
    to the database, and broadcasts real-time events to connected WebSockets.
    """
    session_str = str(session_id)
    db = SessionLocal()

    session_repo = SessionRepository(db)
    finding_repo = FindingRepository(db)
    repair_repo = RepairRepository(db)
    test_repo = TestRepository(db)
    report_repo = ReportRepository(db)
    event_repo = EventRepository(db)

    try:
        session = session_repo.get_by_id(session_id)
        if not session:
            logger.error(f"Cannot run workflow: Session {session_id} not found.")
            return

        session_repo.update_status(session_id, "running")

        # Broadcast workflow started
        await event_manager.broadcast_event(
            session_id=session_str,
            event_type="workflow.started",
            stage_or_agent="Orchestrator",
            message=f"Autonomous debugging pipeline started for {len(session.files)} file(s).",
        )
        event_repo.record(
            session_id=session_id,
            event_type="workflow.started",
            stage_or_agent="Orchestrator",
            message="Autonomous debugging pipeline started.",
        )

        initial_state = {
            "session_id": session_str,
            "title": session.title,
            "language": session.language,
            "task_description": session.task_description,
            "files": [
                {
                    "filename": f.filename,
                    "content": f.original_content,
                    "language": f.language,
                }
                for f in session.files
            ],
            "max_repair_attempts": session.configuration.get("max_repair_attempts", 3),
            "current_attempt": 1,
            "logs": [],
        }

        # Stream through the LangGraph workflow
        final_state = dict(initial_state)

        for step_output in autonomous_workflow.stream(initial_state):
            for node_name, state_patch in step_output.items():
                final_state.update(state_patch)

                # Broadcast and persist node-specific events
                if node_name == "planner":
                    await event_manager.broadcast_event(
                        session_id=session_str,
                        event_type="agent.started",
                        stage_or_agent="Planner",
                        message="Strategy defined. Dispatched Code Analysis Agent.",
                        payload=state_patch.get("plan"),
                    )

                elif node_name == "code_analysis":
                    findings = state_patch.get("findings", [])
                    file_map = {sf.filename: sf.id for sf in session.files}
                    # Purge any previous findings for this session to prevent accumulation
                    finding_repo.delete_by_session(session_id)
                    # Persist findings to database
                    for finding_data in findings:
                        f_copy = dict(finding_data)
                        f_copy["session_id"] = session_id
                        target_file = (
                            finding_data.get("file")
                            or finding_data.get("file_path")
                            or finding_data.get("source_file_path")
                        )
                        if target_file and target_file in file_map:
                            f_copy["source_file_id"] = file_map[target_file]
                        if "metadata_info" not in f_copy or not isinstance(f_copy.get("metadata_info"), dict):
                            f_copy["metadata_info"] = {}
                        if target_file:
                            f_copy["metadata_info"]["file"] = target_file
                            f_copy["metadata_info"]["file_path"] = target_file
                            f_copy["metadata_info"]["source_file_path"] = target_file
                        f_copy.pop("file", None)
                        f_copy.pop("file_path", None)
                        f_copy.pop("source_file_path", None)
                        finding_repo.create(f_copy)

                    await event_manager.broadcast_event(
                        session_id=session_str,
                        event_type="finding.created",
                        stage_or_agent="Code Analysis",
                        message=f"Code analysis produced {len(findings)} structured finding(s).",
                        payload={"findings_count": len(findings)},
                    )

                elif node_name == "diagnosis":
                    diag = state_patch.get("diagnosis", {})
                    await event_manager.broadcast_event(
                        session_id=session_str,
                        event_type="agent.progress",
                        stage_or_agent="Diagnosis",
                        message=f"Root cause: {diag.get('root_cause_summary')}",
                        payload=diag,
                    )

                elif node_name == "fix_and_test":
                    repair_data = state_patch.get("repair_attempt", {})
                    test_data = state_patch.get("test_run", {})
                    proposed_files = state_patch.get("proposed_files", [])

                    # Persist repair attempt
                    r_copy = {
                        "session_id": session_id,
                        "attempt_number": repair_data.get("attempt_number", 1),
                        "diagnosis": repair_data.get("diagnosis", {}),
                        "proposed_changes": repair_data.get("proposed_changes", []),
                        "test_result_summary": repair_data.get("test_result_summary", {}),
                        "validation_status": "pending",
                        "explanation": f"Generated patch modifying {len(repair_data.get('proposed_changes', []))} file(s).",
                    }
                    repair_repo.create(r_copy)

                    # Update proposed content on source files in DB
                    for pf in proposed_files:
                        session_repo.update_file_proposed_content(
                            session_id=session_id,
                            filename=pf["filename"],
                            proposed_content=pf["proposed_content"],
                        )

                    # Persist test run
                    t_copy = {
                        "session_id": session_id,
                        "status": test_data.get("status", "skipped"),
                        "actual_execution": test_data.get("actual_execution", False),
                        "command_or_config": test_data.get("command_or_config", "pytest"),
                        "exit_code": test_data.get("exit_code"),
                        "stdout_summary": test_data.get("stdout_summary"),
                        "stderr_summary": test_data.get("stderr_summary"),
                        "duration_ms": test_data.get("duration_ms", 0),
                        "details": test_data.get("details", {}),
                        "completed_at": datetime.now(timezone.utc),
                    }
                    test_repo.create(t_copy)

                    await event_manager.broadcast_event(
                        session_id=session_str,
                        event_type="repair.proposed",
                        stage_or_agent="Fix & Test",
                        message=f"Proposed patch created with {len(repair_data.get('proposed_changes', []))} file modification(s).",
                        payload={"changes": repair_data.get("proposed_changes")},
                    )

                    await event_manager.broadcast_event(
                        session_id=session_str,
                        event_type="test.completed",
                        stage_or_agent="Fix & Test",
                        message=f"Test run completed: {test_data.get('status')} (actual_execution={test_data.get('actual_execution')}).",
                        payload=test_data,
                    )

                elif node_name == "validation":
                    val_status = state_patch.get("validation_status")
                    await event_manager.broadcast_event(
                        session_id=session_str,
                        event_type="validation.completed",
                        stage_or_agent="Validation",
                        message=f"Validation evaluation result: {val_status}.",
                        payload={"validation_status": val_status},
                    )

                elif node_name == "final_report":
                    report_data = state_patch.get("final_report", {})
                    # Persist final report
                    report_repo.create_or_update(session_id, report_data)

                    final_status = state_patch.get("status", "completed")
                    session_repo.update_status(session_id, final_status, completed=True)

                    await event_manager.broadcast_event(
                        session_id=session_str,
                        event_type="workflow.completed",
                        stage_or_agent="Reporting",
                        message=f"Autonomous workflow {final_status}. Final report ready.",
                        payload=report_data,
                    )
                    event_repo.record(
                        session_id=session_id,
                        event_type="workflow.completed",
                        stage_or_agent="Reporting",
                        message=f"Autonomous workflow {final_status}.",
                        payload={"validation_status": report_data.get("validation_status")},
                    )

    except Exception as exc:
        logger.error(f"Error in workflow execution for session {session_id}: {exc}", exc_info=True)
        session_repo.update_status(session_id, "failed", completed=True)
        await event_manager.broadcast_event(
            session_id=session_str,
            event_type="workflow.failed",
            stage_or_agent="System",
            message=f"Workflow failed due to internal error: {str(exc)}",
        )
        event_repo.record(
            session_id=session_id,
            event_type="workflow.failed",
            stage_or_agent="System",
            message=f"Workflow failed: {str(exc)}",
        )
    finally:
        db.close()
