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

    def visit_Call(self, node: ast.Call):
        func_name = ""
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            # e.g. os.system, subprocess.run
            val = node.func.value
            module_name = getattr(val, "id", "")
            func_name = f"{module_name}.{node.func.attr}" if module_name else node.func.attr

        # Detect dangerous dynamic execution
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

        # Detect shell execution
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

        # Detect unsafe deserialization
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

    def analyze_python_ast(self, filename: str, content: str) -> List[Dict[str, Any]]:
        findings: List[Dict[str, Any]] = []

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
            return findings

        # Run security and defect AST visitor
        visitor = SecurityASTVisitor(filename=filename)
        visitor.visit(tree)
        findings.extend(visitor.findings)

        return findings

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

    def analyze_file(self, filename: str, content: str, language: str = "python") -> List[Dict[str, Any]]:
        """Analyzes a source file based on extension and language."""
        ext = filename.split(".")[-1].lower() if "." in filename else ""

        if ext in ("sql",) or language.lower() in ("sql",):
            return self.analyze_sql(filename, content)

        if ext in ("csv", "tsv") or language.lower() in ("csv",):
            return self.analyze_csv(filename, content)

        if ext in ("py", "pyw") or language.lower() in ("python", "py"):
            ast_findings = self.analyze_python_ast(filename, content)
            has_syntax_error = any(f["category"] == "Syntax" for f in ast_findings)
            if has_syntax_error:
                return ast_findings
            ruff_findings = self.run_ruff(filename, content)
            return ast_findings + ruff_findings

        return [{
            "category": "Code Quality",
            "severity": "Info",
            "title": f"Static analysis skipped for {language or ext}",
            "description": f"File '{filename}' indexed for pipeline diagnosis and verification.",
            "file": filename,
            "line_number": None,
            "column_number": None,
            "evidence": f"Language: {language or ext}",
            "origin": "AST",
            "status": "Open",
        }]

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
