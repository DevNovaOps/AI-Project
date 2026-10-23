from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import logger


class AutonomusAIException(Exception):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.details = details or {}
        self.status_code = status_code


class ResourceNotFoundException(AutonomusAIException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} '{identifier}' was not found.",
            details={"resource": resource, "identifier": identifier},
            status_code=status.HTTP_404_NOT_FOUND,
        )


class SecurityViolationException(AutonomusAIException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            details=details,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class LLMServiceException(AutonomusAIException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            details=details,
            status_code=status.HTTP_502_BAD_GATEWAY,
        )


class ExecutionSandboxException(AutonomusAIException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            details=details,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class WorkflowConflictException(AutonomusAIException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            details=details,
            status_code=status.HTTP_409_CONFLICT,
        )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AutonomusAIException)
    async def custom_exception_handler(request: Request, exc: AutonomusAIException):
        logger.warning(f"Handled error [{exc.status_code}] on {request.url.path}: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "message": exc.message,
                "details": exc.details,
                "path": request.url.path,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
        clean_errors = []
        for err in exc.errors():
            clean_errors.append({
                "loc": [str(loc_item) for loc_item in err.get("loc", [])],
                "msg": err.get("msg"),
                "type": err.get("type"),
            })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": True,
                "message": "Validation failed for request parameters or body.",
                "details": {"validation_errors": clean_errors},
                "path": request.url.path,
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled server error on {request.url.path}: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "message": "An unexpected internal server error occurred.",
                "details": {},
                "path": request.url.path,
            },
        )
