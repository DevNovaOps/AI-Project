import json
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "AutonomusAI"
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # Database (MySQL via PyMySQL)
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/autonomusai"
    DB_ECHO: bool = False

    # Groq AI
    GROQ_API_KEY: Optional[str] = Field(default=None, description="Groq API key")
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_TIMEOUT_SECONDS: int = 60

    # Workflow & Limits
    MAX_REPAIR_ATTEMPTS: int = Field(default=3, ge=1, le=10)
    MAX_FILES_PER_SESSION: int = Field(default=50, ge=1, le=200)
    MAX_SOURCE_FILE_SIZE_BYTES: int = Field(default=200_000, ge=1)  # 200 KB per file
    MAX_SESSION_SOURCE_SIZE_BYTES: int = Field(default=1_000_000, ge=1)  # 1 MB total
    MAX_EXECUTION_SECONDS: int = Field(default=10, ge=1, le=120)
    MAX_STDOUT_BYTES: int = Field(default=50_000, ge=1000)

    # GitHub Integration
    GITHUB_TOKEN: Optional[str] = Field(default=None, description="Optional GitHub Personal Access Token for rate limits")
    MAX_REPO_FILES: int = Field(default=350, ge=1, le=1000)
    MAX_REPO_SIZE_BYTES: int = Field(default=15_000_000, ge=10_000)  # 15 MB max total
    WORKSPACE_ROOT: str = "./workspaces"

    # Sandbox
    SANDBOX_ENABLED: bool = False
    SANDBOX_BACKEND: str = "docker"  # docker, gvisor, or mock

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
