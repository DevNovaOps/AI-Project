import ast
import difflib
from typing import Any, Dict, List, Optional, Tuple

from app.core.logging import logger


class PatchService:
    """
    Manages proposed code changes, diff computation, and validation.
    Guarantees original source files are preserved untouched.
    """

    def compute_diff(self, original_content: str, proposed_content: str, filename: str) -> str:
        orig_lines = original_content.splitlines(keepends=True)
        prop_lines = proposed_content.splitlines(keepends=True)
        diff = difflib.unified_diff(
            orig_lines,
            prop_lines,
            fromfile=f"a/{filename}",
            tofile=f"b/{filename}",
        )
        return "".join(diff)

    def validate_python_syntax(self, code: str, filename: str) -> Tuple[bool, Optional[str]]:
        try:
            ast.parse(code, filename=filename)
            return True, None
        except SyntaxError as e:
            return False, f"Syntax error at line {e.lineno}, col {e.offset}: {e.msg}"

    def process_proposed_changes(
        self,
        original_files: List[Dict[str, Any]],
        proposed_patches: List[Any],
        language: str = "python",
    ) -> Tuple[List[Dict[str, Any]], bool, Optional[str]]:
        """
        Validates proposed patches and produces structured changes with diffs.
        Returns: (processed_changes, all_valid, error_message)
        """
        file_map = {
            f["filename"]: f.get("content") or f.get("original_content", "")
            for f in original_files
        }

        processed = []
        for patch in proposed_patches:
            fname = getattr(patch, "filename", None) or patch.get("filename")
            p_content = getattr(patch, "proposed_content", None) or patch.get("proposed_content", "")
            explanation = getattr(patch, "explanation", None) or patch.get("explanation", "")

            if fname not in file_map:
                logger.warning(f"Patch proposes modifying unknown file: {fname}")
                continue

            orig_content = file_map[fname]

            # Validate syntax for python files
            if language.lower() in ("python", "py") or fname.endswith(".py"):
                valid, err = self.validate_python_syntax(p_content, fname)
                if not valid:
                    return [], False, f"Proposed patch for '{fname}' introduced a syntax error: {err}"

            diff_text = self.compute_diff(orig_content, p_content, fname)

            processed.append({
                "filename": fname,
                "original_snippet": orig_content[:500],
                "proposed_snippet": p_content[:500],
                "proposed_content": p_content,
                "diff": diff_text,
                "explanation": explanation,
            })

        return processed, True, None


patch_service = PatchService()
