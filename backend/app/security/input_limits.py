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


from app.core.logging import logger


def validate_session_limits(files_data: List[dict], language: str, max_repair_attempts: int) -> None:
    """
    Validates and sanitizes file count, per-file size, total session size, language support, and max repair attempts.
    Gracefully trims files exceeding limits to keep sessions resilient across large repositories.
    """
    if not files_data:
        raise SecurityViolationException("At least one source file must be provided.")

    # Gracefully prioritize and cap files if exceeding MAX_FILES_PER_SESSION
    if len(files_data) > settings.MAX_FILES_PER_SESSION:
        logger.info(
            f"Submitted {len(files_data)} files exceeding MAX_FILES_PER_SESSION ({settings.MAX_FILES_PER_SESSION}). "
            f"Prioritizing primary source code files and capping to {settings.MAX_FILES_PER_SESSION}."
        )
        def file_priority(f):
            fn = (f.get("filename") or "").lower()
            if fn.endswith((".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".c", ".cpp", ".cs", ".go", ".rs", ".php")):
                return 0
            if fn.endswith((".html", ".htm", ".css", ".scss", ".sql")):
                return 1
            if fn.endswith((".json", ".yaml", ".yml", ".toml", ".xml")):
                return 2
            return 3
        files_data.sort(key=file_priority)
        del files_data[settings.MAX_FILES_PER_SESSION:]

    total_bytes = 0
    valid_files = []
    for f in files_data:
        content = f.get("content", "")
        if not isinstance(content, str):
            content = str(content)
        encoded = content.encode("utf-8")
        if len(encoded) > settings.MAX_SOURCE_FILE_SIZE_BYTES:
            # Truncate rather than failing session
            content = encoded[:settings.MAX_SOURCE_FILE_SIZE_BYTES].decode("utf-8", errors="ignore")
            f["content"] = content
            encoded = content.encode("utf-8")

        if total_bytes + len(encoded) > settings.MAX_SESSION_SOURCE_SIZE_BYTES:
            logger.warning(f"Total session size reached limit of {settings.MAX_SESSION_SOURCE_SIZE_BYTES} bytes. Omitting remaining files.")
            break
        total_bytes += len(encoded)
        valid_files.append(f)

    files_data.clear()
    files_data.extend(valid_files)

    if language.lower() not in SUPPORTED_LANGUAGES:
        raise SecurityViolationException(
            f"Language '{language}' is not currently supported. Supported languages: {sorted(SUPPORTED_LANGUAGES)}."
        )

    if max_repair_attempts < 1 or max_repair_attempts > settings.MAX_REPAIR_ATTEMPTS:
        raise SecurityViolationException(
            f"max_repair_attempts must be between 1 and {settings.MAX_REPAIR_ATTEMPTS}."
        )
