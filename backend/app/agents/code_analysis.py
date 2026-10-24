import json
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.core.logging import logger
from app.graph.state import WorkflowState
from app.services.llm_service import llm_service
from app.services.static_analysis_service import static_analysis_service


def _run_llm_deep_analysis(files: List[Dict[str, Any]], language: str, task_desc: str = None) -> List[Dict[str, Any]]:
    """
    Uses the LLM to perform deep, multi-language code analysis.
    The LLM acts as a senior code reviewer finding compile-time errors,
    runtime exceptions, syntax violations, typos, undefined references,
    and logic bugs that static heuristics miss.
    """
    if not llm_service.is_configured():
        return []

    files_block = "\n\n".join(
        f"=== FILE: {f.get('filename', 'unknown')} (language: {f.get('language', language)}) ===\n{f.get('content') or f.get('original_content', '')}"
        for f in files
    )

    prompt = f"""You are an expert autonomous code analysis agent performing a thorough multi-pass review.
Your goal is to find ALL compile-time errors, runtime exceptions, syntax violations, and bugs in the provided source code files.

TASK CONTEXT: {task_desc or 'Find and report every bug, error, and issue in the code.'}

ANALYSIS CATEGORIES TO CHECK:
1. **Compile-Time / Syntax Errors**: Keyword typos (e.g., 'cosnt' instead of 'const', 'retunr' instead of 'return'), missing parentheses/brackets/braces, unclosed delimiters, invalid syntax
2. **Runtime Exceptions**: TypeError (calling undefined methods like 'toLowercase' instead of 'toLowerCase', 'querySelecter' instead of 'querySelector'), ReferenceError (using undeclared variables like 'logger' without import), accessing properties on undefined/null
3. **CSS Property Typos**: Misspelled CSS properties (e.g., 'backgroud-color' instead of 'background-color')
4. **HTML Structure Errors**: Unclosed tags, missing closing tags, malformed attributes
5. **Logic Bugs**: Incorrect comparisons, off-by-one errors, unreachable code
6. **Undefined References**: Variables, functions, or modules referenced but never declared or imported
7. **Method/API Typos**: Misspelled method names on built-in objects (e.g., 'toLowercase' vs 'toLowerCase')

IMPORTANT INSTRUCTIONS:
- Analyze EVERY file provided, not just one
- For each bug found, identify the EXACT line number and the specific error
- Be precise: state what is wrong and what the correct code should be
- Do NOT report style issues or minor warnings - focus on REAL bugs that would cause crashes, errors, or incorrect behavior
- If a file has comments indicating intentional bugs, still report them as bugs

SOURCE FILES:
{files_block}

Respond with a JSON array of findings. Each finding must have this exact structure:
[
  {{
    "category": "Syntax" | "Runtime Error" | "CSS Error" | "HTML Error" | "Logic" | "Security",
    "severity": "Critical" | "High" | "Medium" | "Low",
    "title": "Brief title of the bug",
    "description": "Detailed explanation of what is wrong and why it causes an error",
    "file": "exact filename",
    "line_number": 123,
    "evidence": "the problematic code snippet",
    "suggested_fix": "what the corrected code should be"
  }}
]

Return ONLY the JSON array, no other text, no markdown formatting, no code blocks."""

    try:
        client = llm_service.get_client()
        response = client.invoke(prompt)
        raw_text = response.content if hasattr(response, 'content') else str(response)

        # Extract JSON from response
        raw_text = raw_text.strip()

        # Handle <think>...</think> blocks from reasoning models
        if "<think>" in raw_text:
            think_end = raw_text.rfind("</think>")
            if think_end != -1:
                raw_text = raw_text[think_end + len("</think>"):].strip()
            else:
                # No closing tag, try to find JSON after thinking
                pass

        # Try to find JSON array in the response
        start_idx = raw_text.find("[")
        end_idx = raw_text.rfind("]")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            json_str = raw_text[start_idx:end_idx + 1]
            findings = json.loads(json_str)
            if isinstance(findings, list):
                # Normalize and validate each finding
                valid_findings = []
                for f in findings:
                    if isinstance(f, dict) and f.get("title"):
                        normalized = {
                            "category": f.get("category", "Code Quality"),
                            "severity": f.get("severity", "High"),
                            "title": f.get("title", ""),
                            "description": f.get("description", ""),
                            "file": f.get("file", ""),
                            "line_number": f.get("line_number"),
                            "column_number": f.get("column_number"),
                            "evidence": f.get("evidence", ""),
                            "origin": "LLM Deep Analysis",
                            "status": "Open",
                            "suggested_fix": f.get("suggested_fix", ""),
                        }
                        valid_findings.append(normalized)
                return valid_findings
        return []
    except Exception as exc:
        logger.warning(f"LLM deep analysis failed: {exc}")
        return []


def code_analysis_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Agent 2: Code Analysis Agent (Overhauled)
    
    Two-phase analysis:
    1. STATIC ANALYSIS: Deterministic AST/lexical checks per language (fast, reliable)
    2. LLM DEEP ANALYSIS: AI-powered multi-pass review finding subtle bugs,
       typos, undefined references, runtime exceptions, and cross-file issues
    
    Merges and deduplicates findings from both phases.
    """
    session_id = state.get("session_id", "unknown")
    files = state.get("files", [])
    language = state.get("language", "python")
    task_desc = state.get("task_description")

    logger.info(f"[{session_id}] Code Analysis Agent analyzing {len(files)} file(s) with dual-phase engine")

    # PHASE 1: Deterministic static analysis (per-file)
    static_findings = static_analysis_service.analyze_session_files(files, language=language)

    # Filter out "skipped" / info-only placeholder findings from static analysis
    real_static_findings = [
        f for f in static_findings
        if f.get("status") != "Skipped" and f.get("severity") != "Info"
    ]

    logger.info(f"[{session_id}] Phase 1 (Static): {len(real_static_findings)} finding(s)")

    # PHASE 2: LLM deep analysis (all files together for cross-file context)
    llm_findings = _run_llm_deep_analysis(files, language, task_desc)
    logger.info(f"[{session_id}] Phase 2 (LLM): {len(llm_findings)} finding(s)")

    # MERGE & DEDUPLICATE: Combine both sets, preferring more detailed LLM findings
    all_findings = list(real_static_findings)
    seen_keys = set()
    for f in real_static_findings:
        key = (f.get("file", ""), f.get("line_number"), (f.get("title", "")[:30]).lower())
        seen_keys.add(key)

    for f in llm_findings:
        key = (f.get("file", ""), f.get("line_number"), (f.get("title", "")[:30]).lower())
        if key not in seen_keys:
            all_findings.append(f)
            seen_keys.add(key)

    # Sort: Critical first, then High, then by file and line
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Info": 4}
    all_findings.sort(key=lambda f: (
        severity_order.get(f.get("severity", "Medium"), 2),
        f.get("file", ""),
        f.get("line_number") or 0,
    ))

    critical_count = sum(1 for f in all_findings if f.get("severity") == "Critical")
    high_count = sum(1 for f in all_findings if f.get("severity") == "High")
    total_count = len(all_findings)

    msg = f"Deep analysis complete. Identified {total_count} issue(s) ({critical_count} critical, {high_count} high)."

    log_entry = {
        "agent": "Code Analysis",
        "message": msg,
        "status": "warning" if total_count > 0 else "info",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    current_logs = list(state.get("logs", []))
    current_logs.append(log_entry)

    return {
        "stage": "code_analysis",
        "findings": all_findings,
        "logs": current_logs,
    }
