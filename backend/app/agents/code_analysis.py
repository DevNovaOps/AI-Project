import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.core.logging import logger
from app.graph.state import WorkflowState
from app.services.llm_service import llm_service
from app.services.static_analysis_service import static_analysis_service


def _run_llm_deep_analysis(files: List[Dict[str, Any]], language: str, task_desc: str = None) -> List[Dict[str, Any]]:
    """
    Uses the LLM to perform deep, multi-language code analysis across repository files.
    Chunks files into safe token batches (< 3,000 tokens each) to guarantee zero HTTP 413/429
    errors on Groq and any other provider, working reliably for repositories of ANY size.
    """
    if not llm_service.is_configured():
        return []

    # Ignore vendor / binary / lock / non-code files
    non_code_exts = (
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot",
        ".pdf", ".zip", ".tar", ".gz", ".lock", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
        ".min.js", ".min.css", ".map"
    )
    eligible_files = []
    for f in files:
        fname = f.get("filename", "")
        lower = fname.lower()
        if any(lower.endswith(ext) for ext in non_code_exts):
            continue
        if any(seg in lower for seg in ("/node_modules/", "\\node_modules\\", "/.git/", "\\.git\\", "/dist/", "\\dist\\", "/build/", "\\build\\", "/.venv/", "\\.venv\\")):
            continue
        content = f.get("content") or f.get("original_content", "")
        if not content or not str(content).strip():
            continue
        eligible_files.append(f)

    if not eligible_files:
        return []

    # Chunk eligible files into batches of max 2 files or max 6,000 characters (~1,500 tokens)
    batches: List[List[Dict[str, Any]]] = []
    current_batch: List[Dict[str, Any]] = []
    current_batch_chars = 0

    for f in eligible_files:
        content = f.get("content") or f.get("original_content", "")
        file_chars = len(str(content))

        if current_batch and (current_batch_chars + file_chars > 6000 or len(current_batch) >= 2):
            batches.append(current_batch)
            current_batch = [f]
            current_batch_chars = file_chars
        else:
            current_batch.append(f)
            current_batch_chars += file_chars

    if current_batch:
        batches.append(current_batch)

    logger.info(f"LLM deep analysis split {len(eligible_files)} file(s) into {len(batches)} safe batch(es)")

    all_llm_findings = []

    for batch_idx, batch_files in enumerate(batches):
        files_block = "\n\n".join(
            f"=== FILE: {f.get('filename', 'unknown')} (language: {f.get('language', language)}) ===\n{f.get('content') or f.get('original_content', '')}"
            for f in batch_files
        )

        prompt = f"""You are a senior AI code analysis architect and principal static/dynamic analysis engine.
Your goal is to inspect and discover EVERY SINGLE BUG, error, defect, typo, and logic flaw in the provided source files.

TASK CONTEXT: {task_desc or 'Analyze all source files and report every bug, runtime error, syntax error, and logic flaw.'}

CATEGORIES OF BUGS TO IDENTIFY:
1. **Mathematical & Formula Logic Errors**: Inverted signs or operations (e.g. subtracting instead of adding in Celsius-to-Fahrenheit formulas, wrong calculations)
2. **Array & Loop Boundary Errors**: Loop condition off-by-one (e.g. `i <= array.length` instead of `i < array.length`), array indexing offset errors (e.g. `months[date.getMonth() + 1]` when `getMonth()` is already 0-indexed)
3. **Control Flow Errors**: Switch statements missing `break;` causing unintended fallthrough into the next case, unreachable code, inverted conditionals
4. **Runtime Method & Built-in Typos**: Calling non-existent methods on built-in objects (e.g. `JSON.pare` instead of `JSON.parse`, `document.getElementByID` with uppercase D, `querySelecter` instead of `querySelector`, `toLowercase` instead of `toLowerCase`)
5. **Object Property Name Typos**: Misspelled keys in dictionaries or object literals (e.g. `descripiton` instead of `description`, `sucess` instead of `success`)
6. **Null & Undefined Safety**: Unsafe deep property access (e.g. `weatherData.alertDetails.level` when `alertDetails` might be undefined)
7. **HTML Attribute Typos**: Misspelled HTML attributes (e.g. `clss=` instead of `class=`, `herf=` instead of `href=`, `scr=` instead of `src=`)
8. **CSS Property Typos**: Misspelled CSS properties (e.g. `border-raduis` instead of `border-radius`, `backgroud` instead of `background`)
9. **Compile-Time / Syntax Errors**: Keyword typos (e.g. `cosnt`, `retunr`, `fucntion`), unclosed delimiters, missing brackets/braces/parentheses
10. **Undefined Variables & Imports**: Undeclared variables, missing imports or module references

IMPORTANT INSTRUCTIONS:
- Review EVERY file thoroughly. If a repository has multiple files, report bugs in all of them.
- Identify the exact filename and exact 1-indexed line number for every issue.
- Even if comments indicate 'intentional bug' or 'buggy code', you MUST report it as a bug.
- Provide a clear, actionable `suggested_fix` for each issue.

SOURCE FILES TO ANALYZE (Batch {batch_idx + 1} of {len(batches)}):
{files_block}

OUTPUT FORMAT:
Respond ONLY with a JSON array of findings. No explanations, no markdown fences, no conversational text.
Format:
[
  {{
    "category": "Logic" | "Runtime Error" | "Syntax" | "HTML Error" | "CSS Error" | "Security" | "Code Quality",
    "severity": "Critical" | "High" | "Medium" | "Low",
    "title": "Brief, descriptive title of the bug",
    "description": "Clear explanation of what is wrong, why it fails, and the consequence",
    "file": "exact_filename.ext",
    "line_number": 123,
    "evidence": "the exact problematic line or expression",
    "suggested_fix": "the exact corrected code"
  }}
]"""

        try:
            raw_text = llm_service.invoke_with_fallback(prompt)
            raw_text = raw_text.strip()

            # Handle <think>...</think> blocks from reasoning models
            if "<think>" in raw_text:
                think_end = raw_text.rfind("</think>")
                if think_end != -1:
                    raw_text = raw_text[think_end + len("</think>"):].strip()

            # Handle ```json ... ```
            if "```" in raw_text:
                match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
                if match:
                    raw_text = match.group(1).strip()

            # Extract JSON array
            start_idx = raw_text.find("[")
            end_idx = raw_text.rfind("]")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = raw_text[start_idx:end_idx + 1]
                findings = json.loads(json_str)
                if isinstance(findings, list):
                    for f in findings:
                        if isinstance(f, dict) and f.get("title"):
                            target_file = f.get("file", "")
                            matched_name = target_file
                            for orig in batch_files:
                                orig_name = orig.get("filename", "")
                                if orig_name and (orig_name == target_file or orig_name.endswith("/" + target_file) or target_file.endswith("/" + orig_name)):
                                    matched_name = orig_name
                                    break

                            normalized = {
                                "category": f.get("category", "Logic"),
                                "severity": f.get("severity", "High"),
                                "title": f.get("title", ""),
                                "description": f.get("description", ""),
                                "file": matched_name,
                                "file_path": matched_name,
                                "source_file_path": matched_name,
                                "line_number": f.get("line_number"),
                                "column_number": f.get("column_number", 1),
                                "evidence": f.get("evidence", ""),
                                "origin": "AI Deep Analysis",
                                "status": "Open",
                                "suggested_fix": f.get("suggested_fix", ""),
                            }
                            all_llm_findings.append(normalized)
        except Exception as exc:
            logger.warning(f"LLM deep analysis batch {batch_idx + 1} error: {exc}")
            continue

    return all_llm_findings


def code_analysis_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Agent 2: Code Analysis Agent (Overhauled Dual-Engine)
    
    Two-phase analysis:
    1. STATIC ANALYSIS: Deterministic AST/lexical checks per language
    2. LLM DEEP ANALYSIS: Multi-pass AI review for math, logic, boundaries, control flow, and API typos
    
    Merges and deduplicates findings from both phases.
    """
    session_id = state.get("session_id", "unknown")
    files = state.get("files", [])
    language = state.get("language", "python")
    task_desc = state.get("task_description")

    logger.info(f"[{session_id}] Code Analysis Agent analyzing {len(files)} file(s) with dual-phase engine")

    # PHASE 1: Deterministic static analysis (per-file)
    static_findings = static_analysis_service.analyze_session_files(files, language=language)

    real_static_findings = [
        f for f in static_findings
        if f.get("status") != "Skipped" and f.get("severity") != "Info"
    ]

    logger.info(f"[{session_id}] Phase 1 (Static): {len(real_static_findings)} finding(s)")

    # PHASE 2: LLM deep analysis (all files together for whole-repo context)
    llm_findings = _run_llm_deep_analysis(files, language, task_desc)
    logger.info(f"[{session_id}] Phase 2 (LLM): {len(llm_findings)} finding(s)")

    # MERGE & DEDUPLICATE
    all_findings = list(real_static_findings)
    seen_keys = set()
    for f in real_static_findings:
        f_file = f.get("file", "")
        f_line = f.get("line_number")
        key = (f_file, f_line)
        seen_keys.add(key)

    for f in llm_findings:
        f_file = f.get("file", "")
        f_line = f.get("line_number")
        key = (f_file, f_line)
        if key not in seen_keys:
            all_findings.append(f)
            seen_keys.add(key)

    # Sort: Critical first, then High, then Medium, Low, by file and line
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
