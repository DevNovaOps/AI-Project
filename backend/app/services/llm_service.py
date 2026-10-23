from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.exceptions import LLMServiceException
from app.core.logging import logger

try:
    from langchain_groq import ChatGroq
except ImportError:
    ChatGroq = None


class SuspectedCause(BaseModel):
    title: str = Field(..., description="Title of the suspected cause")
    file: str = Field(..., description="Filename associated with this cause")
    line_number: Optional[int] = Field(None, description="Suspected line number")
    explanation: str = Field(..., description="Technical explanation of the cause")
    confidence: int = Field(default=85, ge=0, le=100, description="Confidence score 0-100")


class DiagnosisOutput(BaseModel):
    root_cause_summary: str = Field(..., description="Clear summary of the root problem")
    suspected_causes: List[SuspectedCause] = Field(default_factory=list)
    recommended_repair_strategy: str = Field(..., description="Recommended approach for fixing the issue")
    confidence: int = Field(default=90, ge=0, le=100)


class FilePatch(BaseModel):
    filename: str = Field(..., description="Target filename")
    proposed_content: str = Field(..., description="Complete proposed content for this file")
    explanation: str = Field(..., description="What was changed and why")


class FixOutput(BaseModel):
    explanation: str = Field(..., description="High-level summary of the fix")
    patches: List[FilePatch] = Field(..., description="List of proposed file modifications")
    changes_summary: List[str] = Field(default_factory=list, description="Bullet points of changes")


class LLMService:
    """
    Dedicated service layer for Groq AI interactions through LangChain.
    Handles configuration checks, timeouts, rate limits, and structured outputs.
    """

    def __init__(self, client: Optional[Any] = None):
        self._client = client

    def is_configured(self) -> bool:
        return bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())

    def get_client(self):
        if self._client is not None:
            return self._client

        if not self.is_configured():
            raise LLMServiceException(
                "Groq API key is not configured. Please set the GROQ_API_KEY environment variable."
            )

        if ChatGroq is None:
            raise LLMServiceException("langchain_groq package is not installed.")

        try:
            return ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=settings.GROQ_MODEL,
                request_timeout=settings.GROQ_TIMEOUT_SECONDS,
                temperature=0.1,  # Low temperature for deterministic debugging
            )
        except Exception as e:
            logger.error(f"Failed to initialize ChatGroq client: {e}")
            raise LLMServiceException(f"Failed to initialize Groq client: {str(e)}")

    def diagnose(
        self,
        task_description: Optional[str],
        files: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
    ) -> DiagnosisOutput:
        """
        Diagnoses root causes based on deterministic findings and source code.
        Returns validated Pydantic DiagnosisOutput.
        """
        client = self.get_client()

        # Build context
        files_summary = "\n\n".join(
            f"--- File: {f.get('filename')} ---\n{f.get('content') or f.get('original_content')}"
            for f in files
        )
        findings_summary = "\n".join(
            f"- [{f.get('severity')}] {f.get('title')} ({f.get('file')}:{f.get('line_number')}) - {f.get('description')}"
            for f in findings
        ) or "No static analysis issues detected."

        prompt = (
            f"You are an expert autonomous code diagnosis agent.\n"
            f"Task / Context: {task_description or 'Analyze and diagnose bugs in the provided code.'}\n\n"
            f"Deterministic Static Analysis Findings:\n{findings_summary}\n\n"
            f"Source Files:\n{files_summary}\n\n"
            f"Diagnose the root cause, rank suspected causes with line numbers and confidence, and recommend a minimal repair strategy."
        )

        try:
            structured_llm = client.with_structured_output(DiagnosisOutput)
            result = structured_llm.invoke(prompt)
            if not isinstance(result, DiagnosisOutput):
                # If parsed as dict, validate
                result = DiagnosisOutput.model_validate(result)
            return result
        except Exception as exc:
            logger.error(f"Diagnosis generation failed: {exc}")
            raise LLMServiceException(f"Diagnosis AI generation failed: {str(exc)}")

    def generate_repair(
        self,
        task_description: Optional[str],
        files: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
        diagnosis: Dict[str, Any],
        attempt_number: int = 1,
        previous_test_output: Optional[str] = None,
    ) -> FixOutput:
        """
        Generates minimal, targeted source repair proposals based on diagnosis.
        Returns validated FixOutput.
        """
        client = self.get_client()

        files_summary = "\n\n".join(
            f"--- File: {f.get('filename')} ---\n{f.get('content') or f.get('original_content')}"
            for f in files
        )

        test_context = ""
        if previous_test_output:
            test_context = f"\nPrevious Test Failure Output:\n{previous_test_output}\n"

        prompt = (
            f"You are an expert autonomous software repair agent.\n"
            f"Task: {task_description or 'Repair bugs while preserving intent and style.'}\n"
            f"Attempt Number: {attempt_number}\n\n"
            f"Diagnosis:\n{diagnosis.get('root_cause_summary', '')}\n"
            f"Recommended Strategy: {diagnosis.get('recommended_repair_strategy', '')}\n"
            f"{test_context}\n"
            f"Source Files:\n{files_summary}\n\n"
            f"Generate a minimal, targeted fix. For each modified file, provide the complete proposed content. Do NOT break existing tests or change unrelated code."
        )

        try:
            structured_llm = client.with_structured_output(FixOutput)
            result = structured_llm.invoke(prompt)
            if not isinstance(result, FixOutput):
                result = FixOutput.model_validate(result)
            return result
        except Exception as exc:
            logger.error(f"Repair proposal generation failed: {exc}")
            raise LLMServiceException(f"Repair AI generation failed: {str(exc)}")


llm_service = LLMService()
