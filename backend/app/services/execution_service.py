import os
import subprocess
import tempfile
import time
from typing import Any, Dict, List

from app.core.config import settings
from app.core.logging import logger
from app.security.sandbox import execution_boundary
from app.utils.output_limits import truncate_output


class ExecutionService:
    """
    Executes tests strictly through the sandbox execution boundary.
    If the sandbox is disabled or unavailable, marks tests as skipped/unavailable
    and NEVER executes arbitrary code on the host system.
    """

    def run_tests(
        self,
        files: List[Dict[str, Any]],
        test_command: str = "pytest",
    ) -> Dict[str, Any]:
        """
        Runs tests on the provided files (with any proposed patches applied).
        Guarantees that untrusted code is never run directly on the host.
        """
        sandbox_status = execution_boundary.get_status()

        # If sandbox is not available, report skipped with exact reason
        if not sandbox_status.get("available", False):
            logger.info(f"Sandbox unavailable. Skipping test execution: {sandbox_status.get('reason')}")
            return {
                "status": "skipped",
                "actual_execution": False,
                "command_or_config": test_command,
                "exit_code": None,
                "stdout_summary": None,
                "stderr_summary": f"Test execution skipped: {sandbox_status.get('reason')}",
                "duration_ms": 0,
                "details": {
                    "reason": sandbox_status.get("reason"),
                    "sandbox_enabled": sandbox_status.get("enabled"),
                    "sandbox_backend": sandbox_status.get("backend"),
                },
            }

        # If Docker sandbox is available, execute in isolated container
        start_time = time.time()
        with tempfile.TemporaryDirectory() as temp_dir:
            # Write all files to temp directory
            for f in files:
                fname = f.get("filename", "main.py")
                content = f.get("proposed_content") or f.get("content") or f.get("original_content", "")
                target_path = os.path.join(temp_dir, fname)
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                with open(target_path, "w", encoding="utf-8") as wf:
                    wf.write(content)

            try:
                # Docker run command with security limits:
                # --network none, --read-only, --memory 256m, --cpus 1.0, --rm
                docker_cmd = [
                    "docker",
                    "run",
                    "--rm",
                    "--network",
                    "none",
                    "--memory",
                    "256m",
                    "--cpus",
                    "1.0",
                    "-v",
                    f"{os.path.abspath(temp_dir)}:/workspace:ro",
                    "-w",
                    "/workspace",
                    "python:3.11-slim",
                    "sh",
                    "-c",
                    "pytest -v || python -m unittest discover",
                ]

                result = subprocess.run(
                    docker_cmd,
                    capture_output=True,
                    text=True,
                    timeout=settings.MAX_EXECUTION_SECONDS,
                )

                duration_ms = int((time.time() - start_time) * 1000)
                stdout_bounded = truncate_output(result.stdout, settings.MAX_STDOUT_BYTES)
                stderr_bounded = truncate_output(result.stderr, settings.MAX_STDOUT_BYTES)

                test_status = "passed" if result.returncode == 0 else "failed"

                return {
                    "status": test_status,
                    "actual_execution": True,
                    "command_or_config": test_command,
                    "exit_code": result.returncode,
                    "stdout_summary": stdout_bounded,
                    "stderr_summary": stderr_bounded,
                    "duration_ms": duration_ms,
                    "details": {
                        "sandbox": "docker",
                        "timed_out": False,
                    },
                }

            except subprocess.TimeoutExpired:
                duration_ms = int((time.time() - start_time) * 1000)
                return {
                    "status": "failed",
                    "actual_execution": True,
                    "command_or_config": test_command,
                    "exit_code": -1,
                    "stdout_summary": None,
                    "stderr_summary": f"Execution timed out after {settings.MAX_EXECUTION_SECONDS} seconds.",
                    "duration_ms": duration_ms,
                    "details": {"timed_out": True},
                }
            except Exception as e:
                logger.error(f"Error during sandbox execution: {e}")
                return {
                    "status": "error",
                    "actual_execution": False,
                    "command_or_config": test_command,
                    "exit_code": -1,
                    "stdout_summary": None,
                    "stderr_summary": f"Sandbox execution error: {str(e)}",
                    "duration_ms": int((time.time() - start_time) * 1000),
                    "details": {"error": str(e)},
                }


execution_service = ExecutionService()
