import ast
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict, List

from app.core.logging import logger


class SecurityASTVisitor(ast.NodeVisitor):
    """
    Scans Python AST for potentially dangerous operations before
    considering sandboxed execution or code evaluation.
    """

    def __init__(self, filename: str):
        self.filename = filename
        self.findings: List[Dict[str, Any]] = []

    def _get_call_chain(self, node: ast.AST) -> str:
        parts = []
        curr = node
        while isinstance(curr, ast.Attribute):
            parts.append(curr.attr)
            curr = curr.value
        if isinstance(curr, ast.Name):
            parts.append(curr.id)
        return ".".join(reversed(parts))

    def visit_Call(self, node: ast.Call):
        func_name = self._get_call_chain(node.func)

        # 1. Detect Java standard output / sout in Python (System.out.println / System.out.print)
        if func_name in ("System.out.println", "System.out.print", "System.err.println", "System.err.print"):
            self.findings.append({
                "category": "Language Mismatch",
                "severity": "Critical",
                "title": "Java 'System.out.println' syntax used in Python",
                "description": (
                    f"Java standard output method '{func_name}' is invalid in Python. "
                    "In Python, use the built-in 'print(...)' function. "
                    "At runtime, this will raise 'NameError: name \\'System\\' is not defined'."
                ),
                "file": self.filename,
                "line_number": getattr(node, "lineno", None),
                "column_number": getattr(node, "col_offset", None),
                "evidence": f"Call to '{func_name}(...)'",
                "origin": "AST",
                "status": "Open",
                "suggested_fix": "Replace with print(...)",
            })

        # 2. Detect JavaScript console logging in Python (console.log / console.error)
        elif func_name in ("console.log", "console.error", "console.warn", "console.info", "console.debug"):
            self.findings.append({
                "category": "Language Mismatch",
                "severity": "Critical",
                "title": f"JavaScript '{func_name}' syntax used in Python",
                "description": f"JavaScript '{func_name}' is invalid in Python. Use 'print(...)' instead.",
                "file": self.filename,
                "line_number": getattr(node, "lineno", None),
                "column_number": getattr(node, "col_offset", None),
                "evidence": f"Call to '{func_name}(...)'",
                "origin": "AST",
                "status": "Open",
                "suggested_fix": "Replace with print(...)",
            })

        # 3. Detect Go fmt output in Python (fmt.Println / fmt.Printf)
        elif func_name in ("fmt.Println", "fmt.Printf", "fmt.Print"):
            self.findings.append({
                "category": "Language Mismatch",
                "severity": "Critical",
                "title": f"Go '{func_name}' syntax used in Python",
                "description": f"Go '{func_name}' is invalid in Python. Use 'print(...)' instead.",
                "file": self.filename,
                "line_number": getattr(node, "lineno", None),
                "column_number": getattr(node, "col_offset", None),
                "evidence": f"Call to '{func_name}(...)'",
                "origin": "AST",
                "status": "Open",
                "suggested_fix": "Replace with print(...)",
            })

        # 4. Detect common typos for built-in functions
        builtin_typos = {
            "lenn": "len",
            "lenght": "len",
            "lengt": "len",
            "printt": "print",
            "prnt": "print",
            "prntln": "print",
            "println": "print",
            "rang": "range",
            "rnge": "range",
            "strr": "str",
            "intr": "int",
            "flot": "float",
        }
        if func_name in builtin_typos:
            correct_name = builtin_typos[func_name]
            self.findings.append({
                "category": "Runtime Error",
                "severity": "Critical",
                "title": f"Undefined function '{func_name}' (typo for '{correct_name}')",
                "description": (
                    f"'{func_name}' is not a built-in Python function. "
                    f"Did you mean '{correct_name}()'? At runtime, this will raise "
                    f"'NameError: name \\'{func_name}\\' is not defined'."
                ),
                "file": self.filename,
                "line_number": getattr(node, "lineno", None),
                "column_number": getattr(node, "col_offset", None),
                "evidence": f"Call to '{func_name}(...)'",
                "origin": "AST",
                "status": "Open",
                "suggested_fix": f"Replace with {correct_name}(...)",
            })

        # 5. Detect dangerous dynamic execution
        if func_name in ("eval", "exec", "compile"):
            self.findings.append({
                "category": "Security",
                "severity": "Critical",
                "title": f"Dangerous dynamic execution: '{func_name}'",
                "description": f"Use of dynamic code execution function '{func_name}' is dangerous and can allow arbitrary code execution.",
                "file": self.filename,
                "line_number": getattr(node, "lineno", None),
                "column_number": getattr(node, "col_offset", None),
                "evidence": f"Call to '{func_name}' detected.",
                "origin": "AST",
                "status": "Open",
            })

        # 6. Detect shell execution
        if func_name in ("os.system", "os.popen", "subprocess.Popen", "subprocess.run", "subprocess.call"):
            self.findings.append({
                "category": "Security",
                "severity": "High",
                "title": f"Process execution detected: '{func_name}'",
                "description": f"Process invocation '{func_name}' requires strict sandboxing and input validation to prevent command injection.",
                "file": self.filename,
                "line_number": getattr(node, "lineno", None),
                "column_number": getattr(node, "col_offset", None),
                "evidence": f"Call to '{func_name}' detected.",
                "origin": "AST",
                "status": "Open",
            })

        # 7. Detect unsafe deserialization
        if func_name in ("pickle.loads", "pickle.load", "yaml.unsafe_load"):
            self.findings.append({
                "category": "Security",
                "severity": "Critical",
                "title": f"Unsafe deserialization: '{func_name}'",
                "description": f"Unsafe deserialization using '{func_name}' can lead to remote code execution.",
                "file": self.filename,
                "line_number": getattr(node, "lineno", None),
                "column_number": getattr(node, "col_offset", None),
                "evidence": f"Call to '{func_name}' detected.",
                "origin": "AST",
                "status": "Open",
            })

        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        # Detect mutable default arguments: def foo(x=[]) or def foo(x={})
        for default in node.args.defaults:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                self.findings.append({
                    "category": "Logic",
                    "severity": "High",
                    "title": "Mutable default argument",
                    "description": f"Function '{node.name}' uses a mutable default argument. Default objects are shared across calls; use 'None' instead.",
                    "file": self.filename,
                    "line_number": getattr(default, "lineno", node.lineno),
                    "column_number": getattr(default, "col_offset", None),
                    "evidence": f"Mutable default in function '{node.name}'.",
                    "origin": "AST",
                    "status": "Open",
                })

        old_guarded = getattr(self, "in_guarded_func", False)
        has_guard = False
        for stmt in node.body:
            if isinstance(stmt, ast.If):
                # Checks if guard has return or raise
                if any(isinstance(sub, (ast.Return, ast.Raise)) for sub in ast.walk(stmt)):
                    has_guard = True
                    break
        self.in_guarded_func = has_guard
        self.generic_visit(node)
        self.in_guarded_func = old_guarded

    def visit_Compare(self, node: ast.Compare):
        # Detect == None or != None
        for op, comp in zip(node.ops, node.comparators):
            if isinstance(comp, ast.Constant) and comp.value is None:
                if isinstance(op, (ast.Eq, ast.NotEq)):
                    op_str = "==" if isinstance(op, ast.Eq) else "!="
                    suggested_op = "is" if isinstance(op, ast.Eq) else "is not"
                    self.findings.append({
                        "category": "Code Quality",
                        "severity": "Low",
                        "title": f"Comparison to None using '{op_str}'",
                        "description": f"Comparison to None should use '{suggested_op} None' instead of '{op_str} None' (PEP 8).",
                        "file": self.filename,
                        "line_number": getattr(node, "lineno", None),
                        "column_number": getattr(node, "col_offset", None),
                        "evidence": f"Comparison using '{op_str} None'.",
                        "origin": "AST",
                        "status": "Open",
                    })
        self.generic_visit(node)

    def visit_Try(self, node: ast.Try):
        # Detect bare except:
        for handler in node.handlers:
            if handler.type is None:
                self.findings.append({
                    "category": "Code Quality",
                    "severity": "Medium",
                    "title": "Bare 'except:' clause",
                    "description": "Bare 'except:' catches system-exiting exceptions like KeyboardInterrupt and SystemExit. Catch 'Exception' instead.",
                    "file": self.filename,
                    "line_number": getattr(handler, "lineno", None),
                    "column_number": getattr(handler, "col_offset", None),
                    "evidence": "Bare 'except:' clause without exception class.",
                    "origin": "AST",
                    "status": "Open",
                })
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        # Detect wildcard imports
        for alias in node.names:
            if alias.name == "*":
                mod_name = node.module or "..."
                self.findings.append({
                    "category": "Code Quality",
                    "severity": "Low",
                    "title": "Wildcard import detected",
                    "description": f"Wildcard import 'from {mod_name} import *' pollutes the namespace and can cause subtle variable shadowing.",
                    "file": self.filename,
                    "line_number": getattr(node, "lineno", None),
                    "column_number": getattr(node, "col_offset", None),
                    "evidence": f"from {mod_name} import *",
                    "origin": "AST",
                    "status": "Open",
                })
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp):
        # Detect division by zero or potential division by len() without zero check
        if isinstance(node.op, (ast.Div, ast.FloorDiv, ast.Mod)):
            if isinstance(node.right, ast.Constant) and node.right.value == 0:
                self.findings.append({
                    "category": "Runtime Error",
                    "severity": "Critical",
                    "title": "Division by zero literal",
                    "description": "Direct division by literal 0 will unconditionally raise ZeroDivisionError at runtime.",
                    "file": self.filename,
                    "line_number": getattr(node, "lineno", None),
                    "column_number": getattr(node, "col_offset", None),
                    "evidence": "Division operator with right operand 0.",
                    "origin": "AST",
                    "status": "Open",
                })
            elif isinstance(node.right, ast.Call) and isinstance(node.right.func, ast.Name) and node.right.func.id == "len":
                if not getattr(self, "in_guarded_func", False):
                    self.findings.append({
                        "category": "Runtime Error",
                        "severity": "High",
                        "title": "Potential division by zero (empty collection)",
                        "description": "Division by len(...) could result in ZeroDivisionError if the input collection is empty. Add a length/truthiness validation guard before dividing.",
                        "file": self.filename,
                        "line_number": getattr(node, "lineno", None),
                        "column_number": getattr(node, "col_offset", None),
                        "evidence": "Division by len(...) without verifiable zero guard.",
                        "origin": "AST",
                        "status": "Open",
                    })

        self.generic_visit(node)


class StaticAnalysisService:
    """
    Performs deterministic static analysis on source code using
    Python AST and Ruff linter.
    """

    def _analyze_python_lexical(self, filename: str, content: str) -> List[Dict[str, Any]]:
        """
        Scans Python code lexically for obvious foreign language syntax,
        illegal operators, and builtin typos across all lines, even if AST parsing fails.
        """
        findings: List[Dict[str, Any]] = []
        lines = content.splitlines()

        for idx, line in enumerate(lines, start=1):
            # 1. Invalid comparison operators: ====
            if re.search(r"====+", line):
                col = line.find("====") + 1
                findings.append({
                    "category": "Syntax",
                    "severity": "Critical",
                    "title": "Invalid comparison operator '===='",
                    "description": f"Python uses '==' for equality comparison. Operator '====' is invalid syntax on line {idx}.",
                    "file": filename,
                    "line_number": idx,
                    "column_number": col,
                    "evidence": line.strip()[:80],
                    "origin": "Lexical Syntax Check",
                    "status": "Open",
                    "suggested_fix": "Replace '====' with '=='",
                })
            elif re.search(r"(?<!=)===(?!=)", line):
                col = line.find("===") + 1
                findings.append({
                    "category": "Language Mismatch",
                    "severity": "Critical",
                    "title": "JavaScript strict equality '===' used in Python",
                    "description": f"Python uses '==' instead of JavaScript strict equality '===' on line {idx}.",
                    "file": filename,
                    "line_number": idx,
                    "column_number": col,
                    "evidence": line.strip()[:80],
                    "origin": "Lexical Language Check",
                    "status": "Open",
                    "suggested_fix": "Replace '===' with '=='",
                })
            elif re.search(r"(?<!=)!==(?!=)", line):
                col = line.find("!==") + 1
                findings.append({
                    "category": "Language Mismatch",
                    "severity": "Critical",
                    "title": "JavaScript strict inequality '!==' used in Python",
                    "description": f"Python uses '!=' instead of JavaScript '!==' on line {idx}.",
                    "file": filename,
                    "line_number": idx,
                    "column_number": col,
                    "evidence": line.strip()[:80],
                    "origin": "Lexical Language Check",
                    "status": "Open",
                    "suggested_fix": "Replace '!==' with '!='",
                })

            # 2. Java standard output / sout in Python
            if re.search(r"\bSystem\.(?:out|err)\.(?:println|print)\b", line):
                col = max(1, line.find("System.") + 1)
                findings.append({
                    "category": "Language Mismatch",
                    "severity": "Critical",
                    "title": "Java 'System.out.println' syntax used in Python",
                    "description": (
                        f"Java standard output ('System.out.println') on line {idx} is invalid in Python. "
                        "In Python, use the built-in 'print(...)' function. "
                        "At runtime, this will raise 'NameError: name \\'System\\' is not defined'."
                    ),
                    "file": filename,
                    "line_number": idx,
                    "column_number": col,
                    "evidence": line.strip()[:80],
                    "origin": "Lexical Language Check",
                    "status": "Open",
                    "suggested_fix": "Replace with print(...)",
                })

            # 3. JavaScript console output in Python
            elif re.search(r"\bconsole\.(?:log|error|warn|info|debug)\b", line):
                col = max(1, line.find("console.") + 1)
                findings.append({
                    "category": "Language Mismatch",
                    "severity": "Critical",
                    "title": "JavaScript 'console.log' syntax used in Python",
                    "description": f"JavaScript 'console.log' on line {idx} is invalid in Python. In Python, use 'print(...)'.",
                    "file": filename,
                    "line_number": idx,
                    "column_number": col,
                    "evidence": line.strip()[:80],
                    "origin": "Lexical Language Check",
                    "status": "Open",
                    "suggested_fix": "Replace with print(...)",
                })

            # 4. Built-in function typos
            has_java_print = "System." in line
            for typo, correct in [
                ("lenn", "len"),
                ("lenght", "len"),
                ("lengt", "len"),
                ("printt", "print"),
                ("prnt", "print"),
                ("prntln", "print"),
                ("println", "print"),
            ]:
                if has_java_print and typo in ("println", "prntln", "printt", "prnt"):
                    continue
                pattern = rf"\b{typo}\s*\("
                m = re.search(pattern, line)
                if m:
                    findings.append({
                        "category": "Runtime Error",
                        "severity": "Critical",
                        "title": f"Undefined function '{typo}' (typo for '{correct}')",
                        "description": (
                            f"'{typo}' is not a built-in Python function. "
                            f"Did you mean '{correct}()'? At runtime, this will raise "
                            f"'NameError: name \\'{typo}\\' is not defined'."
                        ),
                        "file": filename,
                        "line_number": idx,
                        "column_number": m.start() + 1,
                        "evidence": line.strip()[:80],
                        "origin": "Lexical Identifier Check",
                        "status": "Open",
                        "suggested_fix": f"Replace with {correct}(...)",
                    })

            # 5. Semicolon anomalies in Python (PEP 8 E703, E702, and syntax errors)
            s_code = re.sub(r'("""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\'|"[^"\\]*(?:\\.[^"\\]*)*"|\'[^\'\\]*(?:\\.[^\'\\]*)*\')', '""', line)
            comment_idx = s_code.find('#')
            if comment_idx != -1:
                s_code = s_code[:comment_idx]
            s_code = s_code.rstrip()

            if s_code:
                # 5a. Semicolon used instead of colon in compound statement (Syntax Error)
                if re.search(r'\b(def|class|if|elif|else|for|while|try|except|finally|with)\b[^:]*;\s*$', s_code):
                    col = line.rfind(';') + 1
                    findings.append({
                        "category": "Syntax",
                        "severity": "Critical",
                        "title": "Semicolon ';' used instead of colon ':'",
                        "description": (
                            f"Python compound statements ('if', 'for', 'while', 'def', 'class', etc.) "
                            f"must end with a colon ':', not a semicolon ';' on line {idx}."
                        ),
                        "file": filename,
                        "line_number": idx,
                        "column_number": col,
                        "evidence": line.strip()[:80],
                        "origin": "Lexical Syntax Check",
                        "status": "Open",
                        "suggested_fix": "Replace ';' with ':'",
                    })
                # 5b. Unnecessary trailing semicolon (PEP 8 E703)
                elif s_code.endswith(';'):
                    col = line.rfind(';') + 1
                    findings.append({
                        "category": "Code Quality",
                        "severity": "Medium",
                        "title": "Unnecessary trailing semicolon ';' (PEP 8 E703)",
                        "description": (
                            f"Trailing semicolon ';' detected at end of line {idx}. "
                            "Semicolons are not required to terminate statements in Python and violate "
                            "PEP 8 (rule E703: statement ends with a semicolon)."
                        ),
                        "file": filename,
                        "line_number": idx,
                        "column_number": col,
                        "evidence": line.strip()[:80],
                        "origin": "Lexical Syntax Check",
                        "status": "Open",
                        "suggested_fix": "Remove trailing semicolon ';'",
                    })
                # 5c. Multiple statements on one line separated by semicolon (PEP 8 E702)
                elif ';' in s_code:
                    col = line.find(';') + 1
                    findings.append({
                        "category": "Code Quality",
                        "severity": "Low",
                        "title": "Multiple statements separated by ';' (PEP 8 E702)",
                        "description": (
                            f"Multiple statements on line {idx} are separated by a semicolon. "
                            "PEP 8 recommends placing each statement on its own line."
                        ),
                        "file": filename,
                        "line_number": idx,
                        "column_number": col,
                        "evidence": line.strip()[:80],
                        "origin": "Lexical Syntax Check",
                        "status": "Open",
                        "suggested_fix": "Split into separate lines",
                    })

        return findings

    def analyze_python_ast(self, filename: str, content: str) -> List[Dict[str, Any]]:
        findings: List[Dict[str, Any]] = []

        # 1. Lexical scan for multi-language anomalies & syntax patterns across all lines
        lexical_findings = self._analyze_python_lexical(filename, content)
        findings.extend(lexical_findings)

        # 2. AST parsing
        try:
            tree = ast.parse(content, filename=filename)
        except SyntaxError as e:
            # Deterministic syntax error detection
            snippet = e.text.strip() if e.text else ""
            findings.append({
                "category": "Syntax",
                "severity": "Critical",
                "title": f"Syntax Error: {e.msg}",
                "description": f"Failed to parse '{filename}' due to syntax error at line {e.lineno}, col {e.offset}: {e.msg}",
                "file": filename,
                "line_number": e.lineno,
                "column_number": e.offset,
                "evidence": snippet,
                "origin": "AST",
                "status": "Open",
            })
            # Deduplicate findings
            seen = set()
            deduped = []
            for f in findings:
                key = (f.get("line_number"), f.get("title"))
                if key not in seen:
                    seen.add(key)
                    deduped.append(f)
            return deduped

        # 3. Security and defect AST visitor
        visitor = SecurityASTVisitor(filename=filename)
        visitor.visit(tree)
        findings.extend(visitor.findings)

        # Deduplicate findings
        seen = set()
        deduped = []
        for f in findings:
            key = (f.get("line_number"), f.get("title"))
            if key not in seen:
                seen.add(key)
                deduped.append(f)
        return deduped

    def run_ruff(self, filename: str, content: str) -> List[Dict[str, Any]]:
        """
        Runs Ruff CLI on Python source code and parses structured JSON output.
        Falls back gracefully if Ruff is not installed or errors.
        """
        findings: List[Dict[str, Any]] = []
        ruff_bin = shutil.which("ruff")
        if not ruff_bin:
            logger.info("Ruff binary not found in PATH; skipping Ruff analysis.")
            return findings

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_file = Path(temp_dir) / filename.replace("/", "_")
            temp_file.write_text(content, encoding="utf-8")

            try:
                result = subprocess.run(
                    [
                        ruff_bin,
                        "check",
                        str(temp_file),
                        "--output-format",
                        "json",
                    ],
                    capture_output=True,
                    text=True,
                    timeout=5,
                )
                output = result.stdout.strip()
                if not output:
                    return findings

                ruff_issues = json.loads(output)
                for issue in ruff_issues:
                    code = issue.get("code", "")
                    message = issue.get("message", "")
                    location = issue.get("location", {})
                    line = location.get("row")
                    col = location.get("column")

                    # Map Ruff codes to severities and categories
                    category = "Code Quality"
                    severity = "Medium"

                    if code.startswith("F82"):  # Undefined name
                        category = "Runtime Error"
                        severity = "High"
                    elif code.startswith("F"):  # Pyflakes
                        category = "Logic"
                        severity = "Medium"
                    elif code.startswith("E") or code.startswith("W"):
                        category = "Code Quality"
                        severity = "Low"
                    elif code.startswith("S"):  # Bandit security rules
                        category = "Security"
                        severity = "High"

                    findings.append({
                        "category": category,
                        "severity": severity,
                        "title": f"[{code}] {message}",
                        "description": f"Ruff rule {code}: {message}",
                        "file": filename,
                        "line_number": line,
                        "column_number": col,
                        "evidence": f"Ruff code: {code}",
                        "origin": "Ruff",
                        "status": "Open",
                    })
            except Exception as exc:
                logger.warning(f"Ruff analysis failed for {filename}: {exc}")

        return findings

    def analyze_sql(self, filename: str, content: str) -> List[Dict[str, Any]]:
        """Static analysis for SQL queries and stored procedures."""
        findings = []
        lines = content.splitlines()

        # Check block comments
        open_comments = content.count("/*")
        close_comments = content.count("*/")
        if open_comments > close_comments:
            findings.append({
                "category": "Syntax",
                "severity": "High",
                "title": "Unclosed SQL block comment",
                "description": "Block comment opened with '/*' has no matching '*/' closing delimiter.",
                "file": filename,
                "line_number": 1,
                "column_number": 1,
                "evidence": f"{open_comments} open tag(s), {close_comments} close tag(s)",
                "origin": "SQL Static Analyzer",
                "status": "Open",
            })

        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            if stripped.startswith("--") or stripped.startswith("/*") or not stripped:
                continue

            # Check SELECT * in procedures or views
            if re.search(r"\bSELECT\s+\*\s+FROM\b", stripped, re.IGNORECASE):
                findings.append({
                    "category": "Code Quality",
                    "severity": "Medium",
                    "title": "Use of 'SELECT *' in data pipeline",
                    "description": "Using 'SELECT *' in data warehouse procedures can cause breaking schema changes. Explicitly declare target columns.",
                    "file": filename,
                    "line_number": idx,
                    "column_number": max(1, line.upper().find("SELECT *") + 1),
                    "evidence": line.strip()[:100],
                    "origin": "SQL Static Analyzer",
                    "status": "Open",
                })

            # Check UPDATE/DELETE without WHERE on complete statement lines
            upper_line = stripped.upper()
            if (upper_line.startswith("DELETE FROM") or upper_line.startswith("UPDATE ")) and stripped.endswith(";"):
                if "WHERE" not in upper_line:
                    findings.append({
                        "category": "Security",
                        "severity": "Critical",
                        "title": "DML statement without WHERE clause",
                        "description": "DELETE or UPDATE statement without a WHERE clause will modify or delete all rows in the table.",
                        "file": filename,
                        "line_number": idx,
                        "column_number": 1,
                        "evidence": line.strip()[:100],
                        "origin": "SQL Static Analyzer",
                        "status": "Open",
                    })

        return findings

    def analyze_csv(self, filename: str, content: str) -> List[Dict[str, Any]]:
        """Static data quality checks for CSV dataset files."""
        findings = []
        lines = [l for l in content.splitlines() if l.strip()]
        if not lines:
            return [{
                "category": "Data Quality",
                "severity": "High",
                "title": "Empty CSV dataset",
                "description": f"Dataset file '{filename}' has no content or headers.",
                "file": filename,
                "line_number": 1,
                "column_number": 1,
                "evidence": "File is empty",
                "origin": "CSV Validator",
                "status": "Open",
            }]

        header_cols = [c.strip() for c in lines[0].split(",")]
        seen = set()
        for col_idx, col in enumerate(header_cols):
            if not col:
                findings.append({
                    "category": "Data Quality",
                    "severity": "High",
                    "title": f"Empty header column at index {col_idx + 1}",
                    "description": "Dataset contains an unnamed/empty header column.",
                    "file": filename,
                    "line_number": 1,
                    "column_number": col_idx + 1,
                    "evidence": lines[0][:80],
                    "origin": "CSV Validator",
                    "status": "Open",
                })
            elif col in seen:
                findings.append({
                    "category": "Data Quality",
                    "severity": "High",
                    "title": f"Duplicate column header '{col}'",
                    "description": f"Column '{col}' appears multiple times in dataset header.",
                    "file": filename,
                    "line_number": 1,
                    "column_number": col_idx + 1,
                    "evidence": col,
                    "origin": "CSV Validator",
                    "status": "Open",
                })
            seen.add(col)

        expected_count = len(header_cols)
        for row_idx, row in enumerate(lines[1:50], start=2):
            cols = row.split(",")
            if len(cols) != expected_count:
                findings.append({
                    "category": "Data Integrity",
                    "severity": "Medium",
                    "title": f"Inconsistent column count on row {row_idx}",
                    "description": f"Row has {len(cols)} columns but header has {expected_count} columns.",
                    "file": filename,
                    "line_number": row_idx,
                    "column_number": 1,
                    "evidence": row[:80],
                    "origin": "CSV Validator",
                    "status": "Open",
                })
                break

        return findings

    def analyze_javascript(self, filename: str, content: str, language: str = "javascript") -> List[Dict[str, Any]]:
        """Static security and quality analysis for JavaScript, TypeScript, and React (JSX/TSX)."""
        findings = []
        lines = content.splitlines()

        stack = []
        pairs = {')': '(', '}': '{', ']': '['}

        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("/*"):
                continue

            # Detect dangerous eval()
            if re.search(r"\beval\s*\(", stripped):
                findings.append({
                    "category": "Security",
                    "severity": "Critical",
                    "title": "Arbitrary code execution risk: 'eval()'",
                    "description": "Use of 'eval()' is dangerous and allows arbitrary script execution. Avoid dynamic evaluation.",
                    "file": filename,
                    "line_number": idx,
                    "column_number": max(1, line.find("eval") + 1),
                    "evidence": line.strip()[:100],
                    "origin": "JS Static Analyzer",
                    "status": "Open",
                })

            # Detect document.write()
            if "document.write" in stripped:
                findings.append({
                    "category": "Security",
                    "severity": "High",
                    "title": "Unsafe DOM injection: 'document.write'",
                    "description": "'document.write' can lead to cross-site scripting (XSS) and blocks page rendering. Use modern DOM APIs or React state.",
                    "file": filename,
                    "line_number": idx,
                    "column_number": max(1, line.find("document.write") + 1),
                    "evidence": line.strip()[:100],
                    "origin": "JS Static Analyzer",
                    "status": "Open",
                })

            # Detect React dangerouslySetInnerHTML
            if "dangerouslySetInnerHTML" in stripped:
                findings.append({
                    "category": "Security",
                    "severity": "High",
                    "title": "Cross-Site Scripting (XSS) risk: 'dangerouslySetInnerHTML'",
                    "description": "Bypassing React's built-in XSS protection with 'dangerouslySetInnerHTML' can introduce severe injection vulnerabilities.",
                    "file": filename,
                    "line_number": idx,
                    "column_number": max(1, line.find("dangerouslySetInnerHTML") + 1),
                    "evidence": line.strip()[:100],
                    "origin": "React Security Analyzer",
                    "status": "Open",
                })

            # Detect debugger statements
            if re.search(r"\bdebugger\b;?", stripped):
                findings.append({
                    "category": "Code Quality",
                    "severity": "Medium",
                    "title": "Production code contains 'debugger' statement",
                    "description": "A 'debugger' breakpoint was left in the source code. Remove debuggers before deploying.",
                    "file": filename,
                    "line_number": idx,
                    "column_number": max(1, line.find("debugger") + 1),
                    "evidence": line.strip()[:100],
                    "origin": "JS Static Analyzer",
                    "status": "Open",
                })

            for char in line:
                if char in ('(', '{', '['):
                    stack.append((char, idx))
                elif char in (')', '}', ']'):
                    if stack and stack[-1][0] == pairs[char]:
                        stack.pop()
                    elif not stack:
                        findings.append({
                            "category": "Syntax",
                            "severity": "Critical",
                            "title": f"Unmatched closing delimiter '{char}'",
                            "description": f"Encountered unexpected closing delimiter '{char}' without a matching opening delimiter.",
                            "file": filename,
                            "line_number": idx,
                            "column_number": 1,
                            "evidence": line.strip()[:80],
                            "origin": "JS Syntax Analyzer",
                            "status": "Open",
                        })
                        break

        if stack and len(findings) == 0:
            unclosed_char, unclosed_line = stack[-1]
            findings.append({
                "category": "Syntax",
                "severity": "Critical",
                "title": f"Unclosed delimiter '{unclosed_char}'",
                "description": f"Opening delimiter '{unclosed_char}' on line {unclosed_line} was never closed.",
                "file": filename,
                "line_number": unclosed_line,
                "column_number": 1,
                "evidence": f"Unclosed '{unclosed_char}'",
                "origin": "JS Syntax Analyzer",
                "status": "Open",
            })

        if not findings:
            return [{
                "category": "Code Quality",
                "severity": "Info",
                "title": f"Static analysis skipped for {language}",
                "description": f"File '{filename}' passed JavaScript/TypeScript lexical checks with no immediate syntax or security violations.",
                "file": filename,
                "line_number": None,
                "column_number": None,
                "evidence": f"Language: {language}",
                "origin": "JS Static Analyzer",
                "status": "Skipped",
            }]

        return findings

    def analyze_html(self, filename: str, content: str) -> List[Dict[str, Any]]:
        """Static accessibility and structural analysis for HTML."""
        findings = []
        lines = content.splitlines()

        for idx, line in enumerate(lines, start=1):
            if "<img" in line.lower() and "alt=" not in line.lower():
                findings.append({
                    "category": "Accessibility",
                    "severity": "Medium",
                    "title": "Image missing required 'alt' attribute",
                    "description": "HTML <img> elements must specify an 'alt' attribute for screen reader accessibility and SEO standards.",
                    "file": filename,
                    "line_number": idx,
                    "column_number": max(1, line.lower().find("<img") + 1),
                    "evidence": line.strip()[:100],
                    "origin": "HTML Accessibility Linter",
                    "status": "Open",
                })

        return findings

    def analyze_css(self, filename: str, content: str) -> List[Dict[str, Any]]:
        """Static syntax and brace matching for CSS / SCSS."""
        findings = []
        open_braces = content.count("{")
        close_braces = content.count("}")
        if open_braces != close_braces:
            findings.append({
                "category": "Syntax",
                "severity": "High",
                "title": "Mismatched CSS block braces",
                "description": f"CSS stylesheet has {open_braces} opening '{{' and {close_braces} closing '}}' braces.",
                "file": filename,
                "line_number": 1,
                "column_number": 1,
                "evidence": f"Brace count mismatch: {open_braces} open vs {close_braces} close",
                "origin": "CSS Linter",
                "status": "Open",
            })
        return findings

    def analyze_json(self, filename: str, content: str) -> List[Dict[str, Any]]:
        """Static syntax validation for JSON data."""
        try:
            json.loads(content)
            return []
        except json.JSONDecodeError as exc:
            return [{
                "category": "Syntax",
                "severity": "Critical",
                "title": f"Invalid JSON syntax: {exc.msg}",
                "description": f"JSON parsing failed: {exc.msg} at line {exc.lineno}, column {exc.colno}.",
                "file": filename,
                "line_number": exc.lineno,
                "column_number": exc.colno,
                "evidence": f"Error at position {exc.pos}: {exc.msg}",
                "origin": "JSON Validator",
                "status": "Open",
            }]

    def analyze_generic(self, filename: str, content: str, language: str) -> List[Dict[str, Any]]:
        """General static checks for Java, C++, C#, Go, Rust, PHP, Ruby, etc."""
        findings = []
        lines = content.splitlines()

        secret_patterns = [
            (r"""(?i)(?:api[_-]?key|apikey|secret|auth[_-]?token|private[_-]?key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]""", "Exposed API key / secret credential"),
            (r"""(?i)(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{6,}['"]""", "Hardcoded plaintext password"),
        ]

        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("#") or stripped.startswith("/*"):
                continue

            for pattern, title in secret_patterns:
                if re.search(pattern, stripped):
                    findings.append({
                        "category": "Security",
                        "severity": "Critical",
                        "title": title,
                        "description": f"Potential credential or API secret exposed directly in source code on line {idx}.",
                        "file": filename,
                        "line_number": idx,
                        "column_number": 1,
                        "evidence": re.sub(r"""(['"])[^'"]{8,}(['"])""", r"\1********\2", line.strip())[:100],
                        "origin": "Credential Safety Scanner",
                        "status": "Open",
                    })
                    break

        if not findings:
            return [{
                "category": "Code Quality",
                "severity": "Info",
                "title": f"Static analysis skipped for {language}",
                "description": f"File '{filename}' indexed for multi-agent pipeline analysis, root-cause diagnosis, and verification.",
                "file": filename,
                "line_number": None,
                "column_number": None,
                "evidence": f"Language: {language}",
                "origin": "Static Analyzer",
                "status": "Open",
            }]

        return findings

    def analyze_text_document(self, filename: str, content: str) -> List[Dict[str, Any]]:
        """
        Analyzes a plain text or markdown documentation file.
        Text documents (guidelines, READMEs, licenses) do not have programming syntax errors.
        Only performs credential/secret leakage checks.
        """
        findings: List[Dict[str, Any]] = []
        secret_patterns = [
            (r'(?i)(api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*["\']([a-zA-Z0-9_\-]{16,})["\']', "Potential exposed secret or API key in documentation"),
            (r'ghp_[a-zA-Z0-9]{36}', "Exposed GitHub Personal Access Token"),
            (r'AIza[0-9A-Za-z-_]{35}', "Exposed Google API Key"),
        ]
        for pattern, desc in secret_patterns:
            for match in re.finditer(pattern, content):
                lineno = content[:match.start()].count("\n") + 1
                findings.append({
                    "category": "Security",
                    "severity": "High",
                    "title": "Exposed Credential in Text File",
                    "description": f"{desc} in '{filename}' at line {lineno}.",
                    "file": filename,
                    "file_path": filename,
                    "source_file_path": filename,
                    "line_number": lineno,
                    "column_number": 1,
                    "evidence": match.group(0)[:60] + "...",
                    "origin": "Static Analyzer",
                    "status": "Open",
                })
        return findings

    def analyze_file(self, filename: str, content: str, language: str = "python") -> List[Dict[str, Any]]:
        """Analyzes a source file based on extension and language."""
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        lang = (language or "python").lower()

        # Non-code documents: .txt, .md, .markdown, .rst, .log, .license, etc.
        # NEVER parse plain text documents with programming language ASTs!
        if ext in ("txt", "text", "md", "markdown", "rst", "log", "license", "guidelines") or lang in ("plaintext", "text", "markdown"):
            findings = self.analyze_text_document(filename, content)
            for f in findings:
                f["file"] = filename
                f["file_path"] = filename
                f["source_file_path"] = filename
            return findings

        # 1. Determine by file extension first! Extension takes strict precedence over session fallback
        if ext in ("html", "htm"):
            findings = self.analyze_html(filename, content)
        elif ext in ("css", "scss", "sass", "less"):
            findings = self.analyze_css(filename, content)
        elif ext in ("json",):
            findings = self.analyze_json(filename, content)
        elif ext in ("js", "jsx", "mjs", "cjs", "ts", "tsx", "vue", "svelte"):
            findings = self.analyze_javascript(filename, content, ext)
        elif ext in ("sql",):
            findings = self.analyze_sql(filename, content)
        elif ext in ("csv", "tsv"):
            findings = self.analyze_csv(filename, content)
        elif ext in ("py", "pyw"):
            ast_findings = self.analyze_python_ast(filename, content)
            has_syntax_error = any(f["category"] == "Syntax" for f in ast_findings)
            if has_syntax_error:
                findings = ast_findings
            else:
                ruff_findings = self.run_ruff(filename, content)
                findings = ast_findings + ruff_findings
        # 2. If extension is unknown or absent, dispatch by session language
        elif lang in ("html", "htm"):
            findings = self.analyze_html(filename, content)
        elif lang in ("css", "scss", "sass", "less"):
            findings = self.analyze_css(filename, content)
        elif lang in ("json",):
            findings = self.analyze_json(filename, content)
        elif lang in ("javascript", "js", "typescript", "ts", "jsx", "tsx", "react", "vue", "svelte"):
            findings = self.analyze_javascript(filename, content, language)
        elif lang in ("sql", "tsql", "mysql", "postgres", "postgresql", "sqlite"):
            findings = self.analyze_sql(filename, content)
        elif lang in ("csv",):
            findings = self.analyze_csv(filename, content)
        elif lang in ("python", "py"):
            ast_findings = self.analyze_python_ast(filename, content)
            has_syntax_error = any(f["category"] == "Syntax" for f in ast_findings)
            if has_syntax_error:
                findings = ast_findings
            else:
                ruff_findings = self.run_ruff(filename, content)
                findings = ast_findings + ruff_findings
        else:
            findings = self.analyze_generic(filename, content, language or ext)

        # Normalize file path fields on all findings
        for f in findings:
            f["file"] = filename
            f["file_path"] = filename
            f["source_file_path"] = filename

        return findings

    def analyze_session_files(self, files: List[Dict[str, Any]], language: str = "python") -> List[Dict[str, Any]]:
        """Analyzes all files in a session and combines findings."""
        all_findings = []
        for f in files:
            fname = f.get("filename", "unknown.py")
            content = f.get("content") or f.get("original_content", "")
            file_lang = f.get("language") or language
            file_findings = self.analyze_file(fname, content, file_lang)
            all_findings.extend(file_findings)
        return all_findings


static_analysis_service = StaticAnalysisService()
