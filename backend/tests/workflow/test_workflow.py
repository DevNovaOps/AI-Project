from app.graph.routing import should_retry_or_finish
from app.graph.workflow import autonomous_workflow
from app.services.llm_service import (
    DiagnosisOutput,
    FilePatch,
    FixOutput,
    LLMService,
    SuspectedCause,
)


def test_full_workflow_execution():
    initial_state = {
        "session_id": "test-wf-001",
        "title": "ZeroDivision Bug",
        "language": "python",
        "task_description": "Fix division by zero when numbers list is empty",
        "files": [
            {
                "filename": "main.py",
                "content": "def calculate_average(numbers):\n    return sum(numbers) / len(numbers)\n",
                "language": "python",
            }
        ],
        "max_repair_attempts": 2,
        "current_attempt": 1,
        "logs": [],
    }

    # Execute workflow graph directly
    final_output = autonomous_workflow.invoke(initial_state)

    assert "plan" in final_output
    assert "findings" in final_output
    assert len(final_output["findings"]) >= 1

    assert "diagnosis" in final_output
    assert "repair_attempt" in final_output
    assert "proposed_files" in final_output

    # Check original source preservation
    orig_file = final_output["files"][0]
    prop_file = final_output["proposed_files"][0]
    assert "return sum(numbers) / len(numbers)" in orig_file["content"]
    assert orig_file["content"] != prop_file["proposed_content"]
    assert (
        "len(numbers) == 0" in prop_file["proposed_content"]
        or "not numbers" in prop_file["proposed_content"]
        or "len(numbers)" in prop_file["proposed_content"]
    )

    # Check validation status based on evidence (sandbox is unavailable, so actual_execution is False)
    assert final_output["test_run"]["actual_execution"] is False
    assert final_output["validation_status"] in ("could_not_run", "failed", "partial")

    # Check final report
    assert "final_report" in final_output
    assert final_output["final_report"]["validation_status"] == final_output["validation_status"]
    assert "findings_summary" in final_output["final_report"]


def test_routing_logic_retry_and_termination():
    # 1. When passed -> reporting_agent
    state_passed = {
        "validation_status": "passed",
        "current_attempt": 1,
        "max_repair_attempts": 3,
    }
    assert should_retry_or_finish(state_passed) == "reporting_agent"

    # 2. When failed and attempts remain -> routes to diagnosis_agent
    state_failed_retry = {
        "validation_status": "failed",
        "current_attempt": 1,
        "max_repair_attempts": 3,
    }
    route = should_retry_or_finish(state_failed_retry)
    assert route == "diagnosis_agent"

    # 3. When failed and retry limit reached -> reporting_agent
    state_limit_reached = {
        "validation_status": "failed",
        "current_attempt": 3,
        "max_repair_attempts": 3,
    }
    assert should_retry_or_finish(state_limit_reached) == "reporting_agent"


def test_mocked_llm_service():
    class MockClient:
        def with_structured_output(self, schema):
            class StructuredMock:
                def invoke(self, prompt):
                    if schema == DiagnosisOutput:
                        return DiagnosisOutput(
                            root_cause_summary="Unchecked division by empty list length.",
                            suspected_causes=[
                                SuspectedCause(
                                    title="ZeroDivisionError",
                                    file="main.py",
                                    line_number=2,
                                    explanation="len() evaluates to 0 when list is empty",
                                    confidence=95,
                                )
                            ],
                            recommended_repair_strategy="Add guard if not numbers: return 0",
                            confidence=95,
                        )
                    elif schema == FixOutput:
                        return FixOutput(
                            explanation="Added empty list guard",
                            patches=[
                                FilePatch(
                                    filename="main.py",
                                    proposed_content="def calculate_average(numbers):\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)\n",
                                    explanation="Added if not numbers guard",
                                )
                            ],
                            changes_summary=["Added guard for empty input list"],
                        )
            return StructuredMock()

    mock_service = LLMService(client=MockClient())
    diag = mock_service.diagnose("test task", [{"filename": "main.py", "content": "x = 1"}], [])
    assert diag.confidence == 95
    assert "Unchecked division" in diag.root_cause_summary

    fix = mock_service.generate_repair("test task", [{"filename": "main.py", "content": "x = 1"}], [], diag.model_dump())
    assert len(fix.patches) == 1
    assert "if not numbers" in fix.patches[0].proposed_content
