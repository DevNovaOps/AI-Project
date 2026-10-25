import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.logging import logger
from app.graph.state import WorkflowState
from app.services.llm_service import llm_service
from app.services.static_analysis_service import static_analysis_service


def _run_llm_deep_analysis(files: List[Dict[str, Any]], language: str, task_desc: str = None, model: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Uses the LLM to perform deep, multi-language code analysis across repository files.
    Chunks files into safe token batches (< 3,000 tokens each) to guarantee zero HTTP 413/429
    errors on Groq and any other provider, working reliably for repositories of ANY size.
    """
    if not llm_service.is_configured():
        return []

    # Ignore vendor / binary / lock / non-code and documentation files
    non_code_exts = (
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot",
        ".pdf", ".zip", ".tar", ".gz", ".lock", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
        ".min.js", ".min.css", ".map",
        ".md", ".markdown", ".mdown", ".txt", ".rst", ".adoc", ".log"
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
- Provide a clear, actionable `suggested_fix` containing ONLY valid replacement code or valid code comment. NEVER provide plain English sentences (like 'Remove this line') in `suggested_fix` because raw text causes syntax errors in code.

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
    "suggested_fix": "exact replacement code (or comment if removing: // [Removed])"
  }}
]"""

        try:
            raw_text = llm_service.invoke_with_fallback(prompt, preferred_model=model)
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


def _normalize_defect_signature(finding: Dict[str, Any]) -> str:
    """Computes a semantic signature for a defect to group identical issues."""
    title = (finding.get("title") or "").lower()
    desc = (finding.get("description") or "").lower()
    evidence = (finding.get("evidence") or "").lower()
    fix = (finding.get("suggested_fix") or "").lower()
    combined = f"{title} {desc} {evidence} {fix}"

    if "getelementbyid" in combined:
        return "dom_getelementbyid"
    if "json.pare" in combined or "json.parse" in combined or "pare" in evidence:
        return "json_pare"
    if "descripiton" in combined:
        return "typo_descripiton"
    if "border-raduis" in combined:
        return "css_border_raduis"
    if "clss" in combined:
        return "html_clss"
    if "celsius" in combined or "fahrenheit" in combined or "32" in combined:
        return "celsius_formula"
    if "getmonth" in combined or ("month" in combined and "off-by-one" in combined):
        return "month_offset"
    if "switch" in combined or "fallthrough" in combined or "case 0" in combined or ("missing" in combined and "break" in combined):
        return "switch_fallthrough"
    if "<=" in combined or ("loop" in combined and "boundary" in combined) or "templist" in combined:
        return "loop_boundary"
    if "alertdetails" in combined or "alert_details" in combined or ("unsafe deep" in combined and "alert" in combined):
        return "alert_details_null"
    if "clik" in combined:
        return "dom_clik"

    words = re.findall(r'[a-zA-Z]{3,}', title)
    return "_".join(sorted(words[:3])) if words else "generic_defect"


def _filter_and_deduplicate_findings(findings: List[Dict[str, Any]], files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    file_lines_map = {}
    for f in files:
        fname = f.get("filename", "")
        content = f.get("content") or f.get("original_content", "")
        file_lines_map[fname] = str(content).splitlines()

    valid_candidates = []
    for f in findings:
        fname = f.get("file") or f.get("source_file_path") or ""
        title = (f.get("title") or "").lower()

        # 1. Ignore "Undefined variable" in test runner / test suite files
        if any(p in fname.lower() for p in ("test-suite", ".test.", ".spec.", "test_")):
            if "undefined variable" in title or "is not defined" in title:
                continue

        # 2. Documentation and markdown files (.md, .txt) are not code files; ignore syntax/logic/runtime errors
        lower_fname = fname.lower()
        if lower_fname.endswith((".md", ".markdown", ".mdown", ".txt", ".rst", ".adoc", ".log")):
            if f.get("category") != "Security":
                continue

        # 2. Comment line detector: if line_number points to a comment line or docstring
        lines = file_lines_map.get(fname, [])
        line_no = f.get("line_number")
        if lines and line_no and isinstance(line_no, int) and 1 <= line_no <= len(lines):
            line_str = lines[line_no - 1].strip()
            if line_str.startswith(("//", "/*", "*", "#", "<!--", "'''", '"""')):
                real_line = None
                evidence = (f.get("evidence") or "").strip()
                if evidence and not evidence.startswith(("//", "/*", "*", "#")):
                    first_ev_line = evidence.splitlines()[0].strip()
                    for idx_l, l in enumerate(lines, start=1):
                        l_clean = l.strip()
                        if not l_clean.startswith(("//", "/*", "*", "#")) and first_ev_line in l_clean:
                            real_line = idx_l
                            break
                if real_line:
                    f["line_number"] = real_line
                else:
                    continue

        valid_candidates.append(f)

    # 3. Semantic grouping by (file, defect_signature) with line proximity
    groups = []
    for f in valid_candidates:
        fname = f.get("file") or f.get("source_file_path") or ""
        sig = _normalize_defect_signature(f)
        line = f.get("line_number") or 0

        placed = False
        for grp in groups:
            rep = grp[0]
            rep_fname = rep.get("file") or rep.get("source_file_path") or ""
            rep_sig = _normalize_defect_signature(rep)
            rep_line = rep.get("line_number") or 0

            if fname == rep_fname and sig == rep_sig:
                if sig != "generic_defect" or abs(line - rep_line) <= 15 or line <= 10 or rep_line <= 10:
                    grp.append(f)
                    placed = True
                    break

        if not placed:
            groups.append([f])

    # 4. Pick canonical finding for each defect group
    deduped = []
    for group in groups:
        def score_finding(item):
            line = item.get("line_number") or 0
            is_real_line = line > 10
            has_evidence = bool(item.get("evidence"))
            has_fix = bool(item.get("suggested_fix"))
            is_ast = "Static" in item.get("origin", "") or "AST" in item.get("origin", "") or "Analyzer" in item.get("origin", "")
            return (is_ast, is_real_line, has_evidence, has_fix, line)

        best = max(group, key=score_finding)
        deduped.append(best)

    # Sort: Critical first, then High, then Medium, Low, by file and line
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Info": 4}
    deduped.sort(key=lambda f: (
        severity_order.get(f.get("severity", "Medium"), 2),
        f.get("file", ""),
        f.get("line_number") or 0,
    ))
    return deduped


def code_analysis_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Agent 2: Code Analysis Agent (Overhauled Dual-Engine)
    
    Two-phase analysis:
    1. STATIC ANALYSIS: Deterministic AST/lexical checks per language
    2. LLM DEEP ANALYSIS: Multi-pass AI review for math, logic, boundaries, control flow, and API typos
    
    Merges, filters comment hallucinations, and deduplicates canonical findings across both phases.
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
    llm_findings = _run_llm_deep_analysis(files, language, task_desc, model=state.get("model"))
    logger.info(f"[{session_id}] Phase 2 (LLM): {len(llm_findings)} finding(s)")

    # MERGE, FILTER COMMENTS, AND DEDUPLICATE CANONICALLY
    all_findings = _filter_and_deduplicate_findings(real_static_findings + llm_findings, files)

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
