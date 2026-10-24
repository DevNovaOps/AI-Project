import json
import re
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
    Handles configuration checks, timeouts, rate limits, multi-model failover, and structured outputs.
    """

    # Candidate active models in order of priority
    FALLBACK_MODELS = [
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
    ]

    def __init__(self, client: Optional[Any] = None):
        self._client = client

    def is_configured(self) -> bool:
        return bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())

    def get_client(self, model_name: Optional[str] = None):
        if self._client is not None:
            return self._client

        if not self.is_configured():
            raise LLMServiceException(
                "Groq API key is not configured. Please set the GROQ_API_KEY environment variable."
            )

        if ChatGroq is None:
            raise LLMServiceException("langchain_groq package is not installed.")

        target_model = model_name or settings.GROQ_MODEL or "qwen/qwen3.8-27b"

        try:
            return ChatGroq(
                groq_api_key=settings.GROQ_API_KEY,
                model_name=target_model,
                request_timeout=settings.GROQ_TIMEOUT_SECONDS,
                temperature=0.1,  # Low temperature for deterministic debugging
            )
        except Exception as e:
            logger.error(f"Failed to initialize ChatGroq client for {target_model}: {e}")
            raise LLMServiceException(f"Failed to initialize Groq client: {str(e)}")

    def _get_models_to_try(self) -> List[str]:
        models = [settings.GROQ_MODEL] if settings.GROQ_MODEL else []
        for m in self.FALLBACK_MODELS:
            if m not in models:
                models.append(m)
        return models

    def invoke_with_fallback(self, prompt: str) -> str:
        """Invokes LLM with automatic failover across models."""
        last_error = None
        for model in self._get_models_to_try():
            try:
                client = self.get_client(model_name=model)
                res = client.invoke(prompt)
                text = res.content if hasattr(res, "content") else str(res)
                if text and text.strip():
                    return text
            except Exception as e:
                logger.warning(f"Groq model {model} failed, attempting next: {e}")
                last_error = e

        raise LLMServiceException(f"All Groq models failed: {last_error}")

    def diagnose(
        self,
        task_description: Optional[str],
        files: List[Dict[str, Any]],
        findings: List[Dict[str, Any]],
    ) -> DiagnosisOutput:
        """
        Diagnoses root causes based on deterministic findings and source code.
        Returns validated Pydantic DiagnosisOutput with fallback.
        """
        files_summary = "\n\n".join(
            f"--- File: {f.get('filename')} ---\n{f.get('content') or f.get('original_content')}"
            for f in files
        )
        findings_summary = "\n".join(
            f"- [{f.get('severity')}] {f.get('title')} ({f.get('file')}:{f.get('line_number')}) - {f.get('description')}"
            for f in findings
        ) or "No static analysis issues detected."

        prompt = (
            f"You are an expert autonomous code diagnosis agent specialized in multi-language bug analysis.\n"
            f"Task / Context: {task_description or 'Analyze and diagnose all bugs in the provided code.'}\n\n"
            f"Static Analysis Findings:\n{findings_summary}\n\n"
            f"Source Files:\n{files_summary}\n\n"
            f"INSTRUCTIONS:\n"
            f"1. Carefully review ALL source files and ALL findings\n"
            f"2. Identify the root cause of EACH finding - explain why it's wrong\n"
            f"3. Look for ADDITIONAL bugs the static analysis may have missed (math logic, off-by-one, typos, switch fallthrough, null safety)\n"
            f"4. Rank ALL suspected causes by confidence (100 = certain, 0 = speculative)\n"
            f"5. For EACH cause, provide the exact file name, line number, and a clear explanation\n"
            f"6. Recommend a precise repair strategy that addresses ALL identified issues\n"
        )

        for model in self._get_models_to_try():
            try:
                client = self.get_client(model_name=model)
                try:
                    structured_llm = client.with_structured_output(DiagnosisOutput)
                    result = structured_llm.invoke(prompt)
                    if not isinstance(result, DiagnosisOutput):
                        result = DiagnosisOutput.model_validate(result)
                    return result
                except Exception:
                    # Fallback to direct prompt invocation + JSON parse
                    raw_res = client.invoke(prompt + "\n\nOutput pure valid JSON matching DiagnosisOutput schema.")
                    raw_text = raw_res.content if hasattr(raw_res, "content") else str(raw_res)
                    raw_text = self._extract_json(raw_text)
                    return DiagnosisOutput.model_validate_json(raw_text)
            except Exception as exc:
                logger.warning(f"Diagnosis failed on model {model}: {exc}")

        # Deterministic fallback diagnosis
        causes = [
            SuspectedCause(
                title=f.get("title", "Issue"),
                file=f.get("file", "unknown"),
                line_number=f.get("line_number"),
                explanation=f.get("description", "Identified bug requiring patch."),
                confidence=90,
            )
            for f in findings[:15]
        ]
        return DiagnosisOutput(
            root_cause_summary="Automated diagnosis identified syntax, runtime, and logic issues across files.",
            suspected_causes=causes,
            recommended_repair_strategy="Apply targeted code fixes to resolve invalid methods, logic errors, and boundary issues.",
            confidence=85,
        )

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
        # Target files that have issues to repair to keep prompt strictly within token limits
        affected_filenames = {
            f.get("file") or f.get("source_file_path") or f.get("filename")
            for f in findings
            if f.get("file") or f.get("source_file_path") or f.get("filename")
        }
        files_to_include = [
            f for f in files
            if (f.get("filename") in affected_filenames or any(str(aff) in f.get("filename", "") for aff in affected_filenames))
        ]
        if not files_to_include:
            files_to_include = files[:3]

        files_summary = "\n\n".join(
            f"--- File: {f.get('filename')} ---\n{f.get('content') or f.get('original_content')}"
            for f in files_to_include
        )

        test_context = ""
        if previous_test_output:
            test_context = f"\nPrevious Test Failure Output:\n{previous_test_output}\n"

        findings_block = "\n".join(
            f"- [{f.get('severity')}] {f.get('file')}:{f.get('line_number')} - {f.get('title')}: {f.get('description')} (Fix: {f.get('suggested_fix', 'N/A')})"
            for f in findings[:25]
        ) or "No specific findings."

        prompt = (
            f"You are an expert autonomous software repair agent.\n"
            f"Task: {task_description or 'Repair all bugs while preserving intent and style.'}\n"
            f"Attempt Number: {attempt_number}\n\n"
            f"Diagnosis:\n{diagnosis.get('root_cause_summary', '')}\n"
            f"Recommended Strategy: {diagnosis.get('recommended_repair_strategy', '')}\n"
            f"{test_context}\n"
            f"Identified Issues to Fix:\n{findings_block}\n\n"
            f"Source Files:\n{files_summary}\n\n"
            f"INSTRUCTIONS:\n"
            f"1. Fix ALL identified issues across EVERY file provided\n"
            f"2. For each modified file, provide the COMPLETE corrected file content\n"
            f"3. Fix all formula bugs, off-by-one errors, method typos (e.g. JSON.parse), object property typos, and syntax errors\n"
            f"4. Do NOT break existing functionality or change unrelated code\n"
            f"5. Preserve code style, indentation, and structure\n"
        )

        for model in self._get_models_to_try():
            try:
                client = self.get_client(model_name=model)
                try:
                    structured_llm = client.with_structured_output(FixOutput)
                    result = structured_llm.invoke(prompt)
                    if not isinstance(result, FixOutput):
                        result = FixOutput.model_validate(result)
                    return result
                except Exception:
                    raw_res = client.invoke(prompt + "\n\nOutput pure valid JSON matching FixOutput schema.")
                    raw_text = raw_res.content if hasattr(raw_res, "content") else str(raw_res)
                    raw_text = self._extract_json(raw_text)
                    return FixOutput.model_validate_json(raw_text)
            except Exception as exc:
                logger.warning(f"Repair generation failed on model {model}: {exc}")

        raise LLMServiceException("Repair generation failed across all models.")

    def _extract_json(self, text: str) -> str:
        """Extracts JSON substring from raw model output."""
        clean = text.strip()
        if "<think>" in clean:
            end = clean.rfind("</think>")
            if end != -1:
                clean = clean[end + len("</think>"):].strip()

        # Handle ```json ... ```
        if "```" in clean:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", clean)
            if match:
                clean = match.group(1).strip()

        start = clean.find("{")
        end = clean.rfind("}")
        if start != -1 and end != -1 and end > start:
            return clean[start:end + 1]

        start = clean.find("[")
        end = clean.rfind("]")
        if start != -1 and end != -1 and end > start:
            return clean[start:end + 1]

        return clean


llm_service = LLMService()
