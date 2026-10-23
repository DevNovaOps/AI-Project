from typing import Any, Dict, List, Tuple


class ValidationService:
    """
    Evaluates empirical evidence from static analysis and actual test runs.
    Ensures LLM opinion is NEVER represented as proof that code works.
    """

    def evaluate(
        self,
        static_findings_before: List[Dict[str, Any]],
        static_findings_after: List[Dict[str, Any]],
        test_run: Dict[str, Any],
        patch_valid: bool,
        patch_error: str = None,
    ) -> Tuple[str, List[Dict[str, Any]], str]:
        """
        Determines validation status based on verifiable evidence.
        Returns: (validation_status, unresolved_issues, explanation)
        """
        if not patch_valid:
            return (
                "failed",
                [{"issue": "Invalid Patch", "detail": patch_error or "Proposed changes introduced syntax error."}],
                f"Validation failed: Proposed patch is syntactically invalid ({patch_error}).",
            )

        critical_or_high_after = [
            f for f in static_findings_after
            if f.get("severity") in ("Critical", "High")
        ]

        actual_execution = test_run.get("actual_execution", False)
        test_status = test_run.get("status")
        exit_code = test_run.get("exit_code")

        # Case 1: Tests actually ran in sandbox and failed
        if actual_execution and test_status == "failed":
            unresolved = [{"issue": "Test Failure", "detail": test_run.get("stderr_summary") or "Tests exited with non-zero exit code."}]
            return (
                "failed",
                unresolved,
                f"Validation failed: Test suite executed with exit code {exit_code}.",
            )

        # Case 2: Tests actually ran in sandbox and passed
        if actual_execution and test_status == "passed":
            if not critical_or_high_after:
                return (
                    "passed",
                    [],
                    "Validation passed: Patched code successfully passed all sandbox tests with 0 exit code and zero critical static findings.",
                )
            else:
                return (
                    "partial",
                    critical_or_high_after,
                    "Validation partial: Unit tests passed, but static analysis detected remaining unresolved high-severity issues.",
                )

        # Case 3: Tests were skipped because sandbox was unavailable
        if not actual_execution:
            unresolved = []
            if critical_or_high_after:
                unresolved = critical_or_high_after
                return (
                    "failed",
                    unresolved,
                    "Validation failed: Unresolved static analysis issues remain, and runtime test execution was unavailable.",
                )
            elif len(static_findings_after) < len(static_findings_before):
                return (
                    "could_not_run",
                    [{"issue": "Tests Skipped", "detail": test_run.get("stderr_summary") or "Sandbox execution was unavailable."}],
                    "Validation could not run: Proposed code passed syntax validation and reduced static findings, but test execution was unavailable to prove functional correctness.",
                )
            else:
                return (
                    "could_not_run",
                    [{"issue": "Unverified Fix", "detail": "Test execution was skipped due to sandbox unavailability."}],
                    "Validation could not run: Code repairs could not be empirically verified via test execution.",
                )

        return (
            "could_not_run",
            [],
            "Validation status could not be established from available evidence.",
        )


validation_service = ValidationService()
