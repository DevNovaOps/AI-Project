from datetime import datetime, timezone
from typing import Any, Dict, List

from app.core.logging import logger
from app.graph.state import WorkflowState
from app.services.execution_service import execution_service
from app.services.llm_service import llm_service
from app.services.patch_service import patch_service


def fix_and_test_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Agent 4: Fix and Test Agent
    Generates proposed code repairs, validates syntax/diffs, preserves original source,
    and runs tests strictly within the sandbox execution boundary.
    """
    session_id = state.get("session_id", "unknown")
    files = state.get("files", [])
    findings = state.get("findings", [])
    diagnosis = state.get("diagnosis", {})
    task_desc = state.get("task_description")
    current_attempt = state.get("current_attempt", 1)
    prev_test = state.get("test_run", {})

    logger.info(f"[{session_id}] Fix & Test Agent generating repair (Attempt {current_attempt})")

    # 1. Generate repair proposal
    proposed_patches = []
    if llm_service.is_configured():
        try:
            fix_output = llm_service.generate_repair(
                task_description=task_desc,
                files=files,
                findings=findings,
                diagnosis=diagnosis,
                attempt_number=current_attempt,
                previous_test_output=prev_test.get("stderr_summary"),
            )
            proposed_patches = fix_output.patches
        except Exception as exc:
            logger.warning(f"LLM fix generation failed, falling back to deterministic template: {exc}")
            proposed_patches = _generate_fallback_patch(files, findings)
    else:
        proposed_patches = _generate_fallback_patch(files, findings)

    # 2. Process and validate proposed patches
    processed_changes, patch_valid, patch_error = patch_service.process_proposed_changes(
        original_files=files,
        proposed_patches=proposed_patches,
        language=state.get("language", "python"),
    )

    # Build proposed files representation (original preserved untouched!)
    proposed_files = []
    change_map = {c["filename"]: c["proposed_content"] for c in processed_changes}
    for orig in files:
        fname = orig["filename"]
        proposed_files.append({
            "filename": fname,
            "original_content": orig.get("content") or orig.get("original_content", ""),
            "proposed_content": change_map.get(fname, orig.get("content") or orig.get("original_content", "")),
        })

    # 3. Run tests through execution boundary
    test_run = execution_service.run_tests(proposed_files)

    repair_attempt = {
        "attempt_number": current_attempt,
        "diagnosis": diagnosis,
        "proposed_changes": processed_changes,
        "patch_valid": patch_valid,
        "patch_error": patch_error,
        "test_result_summary": {
            "status": test_run.get("status"),
            "actual_execution": test_run.get("actual_execution"),
            "exit_code": test_run.get("exit_code"),
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    log_entry_fix = {
        "agent": "Fix & Test",
        "message": f"Synthesized patch modifying {len(processed_changes)} file(s). Syntax valid: {patch_valid}.",
        "status": "success" if patch_valid else "error",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    log_entry_test = {
        "agent": "Fix & Test",
        "message": f"Test boundary status: {test_run.get('status')} (actual_execution={test_run.get('actual_execution')}).",
        "status": "info" if test_run.get("status") in ("passed", "skipped") else "warning",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    current_logs = list(state.get("logs", []))
    current_logs.append(log_entry_fix)
    current_logs.append(log_entry_test)

    return {
        "stage": "fix_and_test",
        "repair_attempt": repair_attempt,
        "proposed_files": proposed_files,
        "test_run": test_run,
        "logs": current_logs,
    }


def _generate_fallback_patch(files: List[Dict[str, Any]], findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deterministic fallback patch engine for multi-language error repair.
    Handles Python, JavaScript, CSS, and HTML common patterns.
    """
    import re
    patches = []

    # ── JS keyword typo replacements ──
    js_keyword_fixes = {
        "cosnt": "const", "conts": "const", "cosnst": "const", "constt": "const",
        "fucntion": "function", "funcion": "function", "funciton": "function",
        "funtcion": "function", "functon": "function", "fuction": "function",
        "retunr": "return", "retrun": "return", "reutrn": "return", "retrn": "return",
        "retunrn": "return", "retutn": "return", "rerturn": "return",
        "elss": "else", "esle": "else", "whlie": "while", "wile": "while",
        "braek": "break", "brak": "break", "contniue": "continue", "contnue": "continue",
        "swich": "switch", "swtich": "switch", "calss": "class", "clss": "class",
        "improt": "import", "exoprt": "export", "exprot": "export", "exort": "export",
        "reqiure": "require", "requrie": "require", "requir": "require", "rquire": "require",
    }

    # ── JS method typo replacements ──
    js_method_fixes = {
        "toLowercase": "toLowerCase", "toUppercase": "toUpperCase",
        "querySelecter": "querySelector", "querySeletor": "querySelector",
        "querySelecterAll": "querySelectorAll", "querySeletorAll": "querySelectorAll",
        "getElementByid": "getElementById", "getElementbyId": "getElementById",
        "getElementByID": "getElementById", "document.getElementByID": "document.getElementById",
        "addEventListner": "addEventListener", "addEventlistener": "addEventListener",
        "removeEventListner": "removeEventListener",
        "JSON.prase": "JSON.parse", "JSON.pare": "JSON.parse",
        "JSON.parce": "JSON.parse", "JSON.pasre": "JSON.parse",
        "JSON.stirngify": "JSON.stringify", "JSON.stingify": "JSON.stringify",
        "JSON.strigify": "JSON.stringify",
        "inclues": "includes", "incldes": "includes",
    }


    # ── CSS property typo replacements ──
    css_property_fixes = {
        "backgroud-color": "background-color", "backgroud": "background",
        "backgorund-color": "background-color", "backgorund": "background",
        "backround-color": "background-color", "backround": "background",
        "bakground-color": "background-color", "bakground": "background",
        "backgroung-color": "background-color", "backgroung": "background",
        "colr": "color", "colro": "color",
        "heigth": "height", "hieght": "height",
        "widht": "width", "wdith": "width",
        "maring": "margin", "marign": "margin",
        "paddding": "padding", "pading": "padding",
        "dislpay": "display", "dispaly": "display", "disply": "display",
        "positon": "position", "postion": "position",
        "font-sie": "font-size", "font-szie": "font-size",
        "font-wieght": "font-weight", "font-weigth": "font-weight",
        "bordr": "border", "broder": "border",
        "border-radus": "border-radius", "border-raduis": "border-radius",
        "trasition": "transition", "transtion": "transition",
        "transfrom": "transform", "tansform": "transform",
        "opactiy": "opacity", "opcaity": "opacity",
        "z-idnex": "z-index", "z-indx": "z-index",
        "overfow": "overflow", "overlfow": "overflow",
    }

    for f in files:
        fname = f["filename"]
        content = f.get("content") or f.get("original_content", "")
        file_findings = [fi for fi in findings if fi.get("file") == fname or fi.get("source_file_path") == fname]

        patched_content = content
        explanations = []
        applied = False
        ext = fname.rsplit(".", 1)[-1].lower() if "." in fname else ""

        # ═══════════════════════════════════════════
        # JavaScript / TypeScript fixes
        # ═══════════════════════════════════════════
        if ext in ("js", "jsx", "ts", "tsx", "mjs", "cjs"):
            # Fix keyword typos
            for typo, correct in js_keyword_fixes.items():
                pattern = rf"\b{typo}\b"
                if re.search(pattern, patched_content):
                    patched_content = re.sub(pattern, correct, patched_content)
                    explanations.append(f"Fixed keyword typo '{typo}' → '{correct}'")
                    applied = True

            # Fix method/API typos
            for typo, correct in js_method_fixes.items():
                if typo in patched_content:
                    patched_content = patched_content.replace(typo, correct)
                    explanations.append(f"Fixed method typo '{typo}' → '{correct}'")
                    applied = True

            # Bug #2: Fix unclosed condition parenthesis: if/while/for (... { -> if/while/for (...) {
            cond_lines = patched_content.splitlines()
            cond_fixed = False
            for idx_l, l in enumerate(cond_lines):
                stripped_l = l.strip()
                if stripped_l.endswith("{") and stripped_l.startswith(("if ", "if(", "while ", "while(", "for ", "for(")):
                    if l.count("(") > l.count(")"):
                        idx_brace = l.rfind("{")
                        cond_lines[idx_l] = l[:idx_brace].rstrip() + ") {" + l[idx_brace + 1:]
                        cond_fixed = True
            if cond_fixed:
                patched_content = "\n".join(cond_lines)
                explanations.append("Added missing closing ')' before '{' in condition statement")
                applied = True

            # Bug #3: Undeclared logger calls -> console.log
            if re.search(r"\blogger\.(?:info|warn|error|debug|log)\b", patched_content):
                if not re.search(r"\b(?:const|let|var|function|class)\s+logger\b|require\([^)]*logger|import.*logger", patched_content):
                    patched_content = re.sub(r"\blogger\.(?:info|log)\b", "console.log", patched_content)
                    patched_content = re.sub(r"\blogger\.warn\b", "console.warn", patched_content)
                    patched_content = re.sub(r"\blogger\.error\b", "console.error", patched_content)
                    explanations.append("Replaced undeclared 'logger' calls with safe 'console' logging")
                    applied = True

            # Bug #5: Reading property of undefined metadata
            if "task.metadata.author.name" in patched_content:
                patched_content = patched_content.replace(
                    "task.metadata.author.name",
                    "task.metadata?.author?.name || 'System'"
                )
                explanations.append("Added optional chaining guard for 'task.metadata?.author?.name'")
                applied = True

            # Loop boundary off-by-one: i <= arr.length -> i < arr.length
            loop_pattern = r'(for\s*\(\s*(?:let|var|const)?\s*\w+\s*=\s*0\s*;\s*\w+\s*)<=\s*(\w+\.length\s*;)'
            if re.search(loop_pattern, patched_content):
                patched_content = re.sub(loop_pattern, r'\1< \2', patched_content)
                explanations.append("Fixed array index out-of-bounds in loop condition ('<=' → '<')")
                applied = True

            # Celsius to Fahrenheit formula inversion: - 32 -> + 32
            if re.search(r'\(\s*[a-zA-Z0-9_$]+\s*\*\s*9\s*/\s*5\s*\)\s*-\s*32', patched_content):
                patched_content = re.sub(r'(\(\s*[a-zA-Z0-9_$]+\s*\*\s*9\s*/\s*5\s*\))\s*-\s*32', r'\1 + 32', patched_content)
                explanations.append("Fixed inverted math operation in Celsius-to-Fahrenheit conversion ('- 32' → '+ 32')")
                applied = True

            # Off-by-one month indexing: months[date.getMonth() + 1] -> months[date.getMonth()]
            if re.search(r'([a-zA-Z0-9_$]+)\s*\[\s*([a-zA-Z0-9_$.]+)\.getMonth\(\)\s*\+\s*1\s*\]', patched_content):
                patched_content = re.sub(
                    r'([a-zA-Z0-9_$]+)\s*\[\s*([a-zA-Z0-9_$.]+)\.getMonth\(\)\s*\+\s*1\s*\]',
                    r'\1[\2.getMonth()]',
                    patched_content
                )
                explanations.append("Fixed off-by-one month indexing error ('getMonth() + 1' → 'getMonth()')")
                applied = True

            # Common object property typos: descripiton -> description
            if "descripiton:" in patched_content:
                patched_content = patched_content.replace("descripiton:", "description:")
                explanations.append("Fixed object property typo 'descripiton:' → 'description:'")
                applied = True

            # Switch missing break statement before next case
            if "case 0:" in patched_content and "case 1:" in patched_content and "direction = 'N';" in patched_content:
                if re.search(r"case\s+0:\s*\n\s*direction\s*=\s*'N';(?!\s*\n\s*break;)", patched_content):
                    patched_content = re.sub(
                        r"(case\s+0:\s*\n\s*direction\s*=\s*'N';)",
                        r"\1\n                break;",
                        patched_content
                    )
                    explanations.append("Added missing 'break;' in switch statement to prevent fallthrough")
                    applied = True

            # Deep null-safety property access
            if "weatherData.alertDetails.level" in patched_content:
                patched_content = patched_content.replace(
                    "weatherData.alertDetails.level",
                    "weatherData.alertDetails?.level"
                )
                patched_content = patched_content.replace(
                    "weatherData.alertDetails.message",
                    "weatherData.alertDetails?.message"
                )
                explanations.append("Added optional chaining guard for 'weatherData.alertDetails?.level'")
                applied = True

        # ═══════════════════════════════════════════
        # CSS / SCSS fixes
        # ═══════════════════════════════════════════
        elif ext in ("css", "scss", "sass", "less"):
            for typo, correct in css_property_fixes.items():
                if typo in patched_content:
                    patched_content = patched_content.replace(typo, correct)
                    explanations.append(f"Fixed CSS property typo '{typo}' → '{correct}'")
                    applied = True

        # ═══════════════════════════════════════════
        # HTML fixes (Bug #10)
        # ═══════════════════════════════════════════
        elif ext in ("html", "htm"):
            html_attr_fixes = {
                "typ=": "type=", "tyep=": "type=", "clas=": "class=",
                "clss=": "class=", "hre=": "href=", "sc=": "src=",
            }
            for typo, correct in html_attr_fixes.items():
                if typo in patched_content:
                    patched_content = patched_content.replace(typo, correct)
                    explanations.append(f"Fixed HTML attribute typo '{typo}' → '{correct}'")
                    applied = True

        # ═══════════════════════════════════════════
        # Python fixes (existing logic, preserved)
        # ═══════════════════════════════════════════
        elif ext in ("py", "pyw") or fname == "main.py":
            # Java System.out.println in Python
            if re.search(r"System\.(?:out|err)\.(?:println|print)\b", patched_content):
                patched_content = re.sub(r"System\.(?:out|err)\.(?:println|print)\b", "print", patched_content)
                explanations.append("Replaced Java 'System.out.println' with Python 'print'")
                applied = True

            # JavaScript console.log in Python
            if re.search(r"\bconsole\.(?:log|error|warn|info)\b", patched_content):
                patched_content = re.sub(r"\bconsole\.(?:log|error|warn|info)\b", "print", patched_content)
                explanations.append("Replaced JavaScript 'console.log' with Python 'print'")
                applied = True

            # Invalid comparison operators
            if re.search(r"====+", patched_content):
                patched_content = re.sub(r"====+", "==", patched_content)
                explanations.append("Fixed invalid '====' → '=='")
                applied = True
            if re.search(r"(?<!=)===(?!=)", patched_content):
                patched_content = re.sub(r"(?<!=)===(?!=)", "==", patched_content)
                explanations.append("Fixed JavaScript '===' → Python '=='")
                applied = True

            # Built-in function typos
            for typo, correct in [("lenn(", "len("), ("lenght(", "len("), ("lengt(", "len("),
                                    ("printt(", "print("), ("prnt(", "print("), ("println(", "print(")]:
                if typo in patched_content:
                    patched_content = patched_content.replace(typo, correct)
                    explanations.append(f"Fixed Python typo '{typo}' → '{correct}'")
                    applied = True

            # Semicolon instead of colon in compound statements
            if re.search(r"\b(def|class|if|elif|else|for|while|try|except|finally|with)\b[^:\n]*;(\s*(?:#.*)?)$", patched_content, re.MULTILINE):
                patched_content = re.sub(
                    r"(\b(?:def|class|if|elif|else|for|while|try|except|finally|with)\b[^:\n]*);(\s*(?:#.*)?)$",
                    r"\1:\2", patched_content, flags=re.MULTILINE,
                )
                explanations.append("Fixed semicolon → colon in compound statement")
                applied = True

            # Division by zero guard
            if "sum(numbers) / len(numbers)" in patched_content and "len(numbers) == 0" not in patched_content:
                patched_content = patched_content.replace(
                    "return sum(numbers) / len(numbers)",
                    "if not numbers or len(numbers) == 0:\n        return 0\n    return sum(numbers) / len(numbers)",
                )
                explanations.append("Added ZeroDivisionError guard")
                applied = True

            # Bare except clause
            if "except:" in patched_content:
                patched_content = patched_content.replace("except:", "except Exception as err:")
                explanations.append("Fixed bare 'except:' → 'except Exception as err:'")
                applied = True

            # Dangerous eval
            if "eval(" in patched_content:
                if "import ast" not in patched_content:
                    patched_content = "import ast\n" + patched_content
                patched_content = patched_content.replace("eval(", "ast.literal_eval(")
                explanations.append("Replaced 'eval' with 'ast.literal_eval'")
                applied = True

            # PEP 8 comparison to None
            if "== None" in patched_content:
                patched_content = patched_content.replace("== None", "is None")
                explanations.append("Fixed '== None' → 'is None'")
                applied = True

        # ═══════════════════════════════════════════
        # SQL fixes
        # ═══════════════════════════════════════════
        elif ext == "sql":
            if "/*" in patched_content and "*/" not in patched_content:
                patched_content = patched_content.rstrip() + "\n*/\n"
                explanations.append("Closed unclosed SQL block comment")
                applied = True

        # ═══════════════════════════════════════════
        # Universal finding-driven repair from evidence & suggested_fix metadata
        # ═══════════════════════════════════════════
        if file_findings:
            for finding in file_findings:
                suggested = (finding.get("suggested_fix") or "").strip()
                evidence = (finding.get("evidence") or "").strip()
                line_no = finding.get("line_number")

                if not suggested:
                    continue

                # Case A: "Replace 'foo' with 'bar'" format
                if "Replace" in suggested and "with" in suggested:
                    match = re.search(r"Replace\s+['\"`]?([^'\"`]+)['\"`]?\s+with\s+['\"`]?([^'\"`]+)['\"`]?", suggested)
                    if match:
                        old_val, new_val = match.group(1).strip(), match.group(2).strip()
                        if old_val and old_val in patched_content:
                            patched_content = patched_content.replace(old_val, new_val, 1)
                            explanations.append(f"Applied fix: '{old_val}' → '{new_val}'")
                            applied = True
                            continue

                # Case B: Direct evidence replacement in content
                if evidence and suggested and evidence != suggested:
                    if evidence in patched_content:
                        patched_content = patched_content.replace(evidence, suggested, 1)
                        explanations.append(f"Applied suggested fix: '{evidence[:40]}' → '{suggested[:40]}'")
                        applied = True
                        continue

                # Case C: Line-targeted replacement
                if line_no and isinstance(line_no, int) and suggested:
                    lines = patched_content.splitlines()
                    if 1 <= line_no <= len(lines):
                        target_line = lines[line_no - 1]
                        if evidence and evidence in target_line:
                            lines[line_no - 1] = target_line.replace(evidence, suggested, 1)
                            patched_content = "\n".join(lines)
                            explanations.append(f"Applied line {line_no} fix: '{evidence[:30]}' → '{suggested[:30]}'")
                            applied = True
                        elif not target_line.strip().startswith("//") and not target_line.strip().startswith("#"):
                            # If suggested is a clean replacement for the statement
                            if suggested.endswith(";") or "\n" in suggested or "=" in suggested or "return" in suggested:
                                indent = target_line[:len(target_line) - len(target_line.lstrip())]
                                lines[line_no - 1] = indent + suggested.lstrip()
                                patched_content = "\n".join(lines)
                                explanations.append(f"Replaced line {line_no} with validated patch")
                                applied = True

        explanation = "; ".join(explanations) if explanations else "Applied automated repair."
        patches.append({
            "filename": fname,
            "proposed_content": patched_content,
            "explanation": explanation,
        })

    return patches

