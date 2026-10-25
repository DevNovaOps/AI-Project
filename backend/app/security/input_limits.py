import re
from typing import List

from app.core.config import settings
from app.core.exceptions import SecurityViolationException
from app.core.logging import logger

SUPPORTED_LANGUAGES = {
    # Java, JVM & Spring Boot Ecosystem
    "java", "springboot", "spring-boot", "spring", "maven", "gradle", "groovy", "scala",
    "kotlin", "kt", "kts", "clojure", "clj",

    # Web & Modern Frontend Frameworks
    "javascript", "js", "typescript", "ts", "jsx", "tsx", "react", "reactjs",
    "next", "nextjs", "vue", "vuejs", "nuxt", "nuxtjs", "angular", "svelte", "sveltekit",
    "astro", "remix", "solid", "solidjs", "html", "htm", "css", "scss", "sass", "less",
    "tailwind", "bootstrap",

    # Python & Frameworks
    "python", "py", "pyw", "django", "fastapi", "flask", "tornado", "pyramid", "celery",

    # Node.js & Backend JavaScript
    "node", "nodejs", "express", "expressjs", "nest", "nestjs", "fastify", "koa", "deno", "bun",

    # C, C++, C# & .NET Frameworks
    "c", "cpp", "cxx", "cc", "h", "hpp", "hxx", "csharp", "cs", "c#",
    "dotnet", "aspnet", "aspnetcore", "blazor", "fsharp", "fs", "objective-c", "objc",

    # Systems, Cloud & Modern Languages
    "go", "golang", "rust", "rs", "zig", "nim", "d", "v",

    # PHP & Frameworks
    "php", "laravel", "symfony", "wordpress", "codeigniter",

    # Ruby & Frameworks
    "ruby", "rb", "rails", "ruby-on-rails", "sinatra",

    # Mobile & Cross-Platform
    "swift", "swiftui", "dart", "flutter", "react-native", "android", "ios",

    # Databases, ORMs & Data Formats
    "sql", "tsql", "mysql", "postgres", "postgresql", "sqlite", "plsql", "prisma", "graphql", "gql",
    "r", "julia", "matlab",

    # Functional, Scripting & Emerging
    "elixir", "phoenix", "erlang", "haskell", "hs", "ocaml", "lua", "perl", "pl", "solidity", "sol",

    # Config, Build, Shell & DevOps
    "json", "jsonc", "yaml", "yml", "xml", "markdown", "md", "csv", "tsv", "plaintext", "txt",
    "shell", "sh", "bash", "zsh", "powershell", "ps1", "bat", "cmd",
    "dockerfile", "docker", "toml", "ini", "properties", "terraform", "hcl", "ansible", "kubernetes"
}


def validate_session_limits(files_data: List[dict], language: str, max_repair_attempts: int) -> None:
    """
    Validates and sanitizes file count, per-file size, total session size, language support, and max repair attempts.
    Gracefully trims files exceeding limits to keep sessions resilient across large repositories.
    Supports ALL programming languages and frameworks (Spring Boot, Django, Next.js, Express, .NET, etc.).
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
            # Priority 0: Primary application source code (Java, Spring, Python, TS, JS, C#, Go, etc.)
            if fn.endswith((
                ".java", ".kt", ".kts", ".groovy", ".scala",
                ".py", ".pyw",
                ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue", ".svelte",
                ".cs", ".cpp", ".c", ".h", ".hpp", ".go", ".rs", ".php", ".rb", ".swift", ".dart"
            )) or fn in ("pom.xml", "build.gradle", "application.properties", "application.yml"):
                return 0
            # Priority 1: Markup, styles, database queries, and configs
            if fn.endswith((".html", ".htm", ".css", ".scss", ".sql", ".properties", ".graphql", ".gql", ".proto")):
                return 1
            # Priority 2: Structured data and config documents
            if fn.endswith((".json", ".yaml", ".yml", ".toml", ".xml", ".ini", ".env", ".env.example")):
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
            raise SecurityViolationException(
                f"File '{f.get('filename', 'unknown')}' exceeds max size limit of {settings.MAX_SOURCE_FILE_SIZE_BYTES} bytes."
            )

        if total_bytes + len(encoded) > settings.MAX_SESSION_SOURCE_SIZE_BYTES:
            raise SecurityViolationException(
                f"Total session source code exceeds max size limit of {settings.MAX_SESSION_SOURCE_SIZE_BYTES} bytes."
            )
        total_bytes += len(encoded)
        valid_files.append(f)

    files_data.clear()
    files_data.extend(valid_files)

    # Universal Language Support: Normalize and support any valid language / framework identifier
    clean_lang = re.sub(r'[^a-zA-Z0-9_\-\.\+]', '', str(language or "generic").lower().strip())
    if not clean_lang:
        clean_lang = "generic"

    if clean_lang not in SUPPORTED_LANGUAGES:
        # Dynamically register unlisted programming languages / custom frameworks
        logger.info(f"Dynamically allowing extended programming language/framework: '{clean_lang}'")
        SUPPORTED_LANGUAGES.add(clean_lang)

    if max_repair_attempts < 1 or max_repair_attempts > settings.MAX_REPAIR_ATTEMPTS:
        raise SecurityViolationException(
            f"max_repair_attempts must be between 1 and {settings.MAX_REPAIR_ATTEMPTS}."
        )

