import shutil
import subprocess
from typing import Any, Dict

from app.core.config import settings


class ExecutionBoundary:
    """
    Manages safe isolation boundary for running user-submitted code or tests.
    Never executes arbitrary untrusted code directly on the host.
    """

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """Returns sandbox availability and configuration status."""
        if not settings.SANDBOX_ENABLED:
            return {
                "enabled": False,
                "backend": settings.SANDBOX_BACKEND,
                "available": False,
                "reason": "Sandbox execution is disabled in configuration (SANDBOX_ENABLED=false). Tests will be marked as skipped.",
            }

        # Check if Docker is installed
        docker_path = shutil.which("docker")
        if not docker_path:
            return {
                "enabled": True,
                "backend": settings.SANDBOX_BACKEND,
                "available": False,
                "reason": "Docker executable not found on host. Host fallback execution is strictly prohibited.",
            }

        # Try pinging docker daemon
        try:
            res = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                timeout=3,
                text=True,
            )
            if res.returncode == 0:
                return {
                    "enabled": True,
                    "backend": settings.SANDBOX_BACKEND,
                    "available": True,
                    "reason": "Docker sandbox daemon is active and responsive.",
                }
            else:
                return {
                    "enabled": True,
                    "backend": settings.SANDBOX_BACKEND,
                    "available": False,
                    "reason": "Docker daemon is not running or unreachable.",
                }
        except Exception as e:
            return {
                "enabled": True,
                "backend": settings.SANDBOX_BACKEND,
                "available": False,
                "reason": f"Failed to probe Docker daemon: {str(e)}",
            }


execution_boundary = ExecutionBoundary()
