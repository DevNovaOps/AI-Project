from typing import List

from app.core.config import settings
from app.core.exceptions import SecurityViolationException

SUPPORTED_LANGUAGES = {
    # Web & Frontend
    "javascript", "js", "typescript", "ts", "jsx", "tsx", "react", "vue", "svelte",
    "html", "htm", "css", "scss", "sass", "less",
    # Backend & Systems
    "python", "py", "java", "c", "cpp", "cxx", "h", "hpp", "csharp", "cs", "dotnet",
    "go", "golang", "rust", "rs", "php", "ruby", "rb", "rails",
    "kotlin", "kt", "swift", "dart", "scala", "r", "lua", "perl", "pl",
    # Data & Databases
    "sql", "tsql", "mysql", "postgres", "postgresql", "sqlite", "plsql",
    # Config, Data & DevOps
    "json", "yaml", "yml", "xml", "markdown", "md", "csv", "tsv", "plaintext", "txt",
    "shell", "sh", "bash", "zsh", "powershell", "ps1", "bat", "cmd",
    "dockerfile", "docker", "graphql", "gql", "toml", "ini", "properties"
}


def validate_session_limits(files_data: List[dict], language: str, max_repair_attempts: int) -> None:
    """
    Validates file count, per-file size, total session size, language support, and max repair attempts.
    """
    if not files_data:
        raise SecurityViolationException("At least one source file must be provided.")

    if len(files_data) > settings.MAX_FILES_PER_SESSION:
        raise SecurityViolationException(
            f"Exceeded maximum file count ({settings.MAX_FILES_PER_SESSION}). Submitted: {len(files_data)}."
        )

    total_bytes = 0
    for f in files_data:
        content = f.get("content", "")
        size = len(content.encode("utf-8"))
        if size > settings.MAX_SOURCE_FILE_SIZE_BYTES:
            raise SecurityViolationException(
                f"File '{f.get('filename')}' exceeds max size limit of {settings.MAX_SOURCE_FILE_SIZE_BYTES} bytes."
            )
        total_bytes += size

    if total_bytes > settings.MAX_SESSION_SOURCE_SIZE_BYTES:
        raise SecurityViolationException(
            f"Total session source size ({total_bytes} bytes) exceeds limit of {settings.MAX_SESSION_SOURCE_SIZE_BYTES} bytes."
        )

    if language.lower() not in SUPPORTED_LANGUAGES:
        raise SecurityViolationException(
            f"Language '{language}' is not currently supported. Supported languages: {sorted(SUPPORTED_LANGUAGES)}."
        )

    if max_repair_attempts < 1 or max_repair_attempts > settings.MAX_REPAIR_ATTEMPTS:
        raise SecurityViolationException(
            f"max_repair_attempts must be between 1 and {settings.MAX_REPAIR_ATTEMPTS}."
        )
