from typing import Generator, Tuple

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.logging import logger

engine_kwargs = {
    "echo": settings.DB_ECHO,
    "pool_pre_ping": True,
}

db_url = settings.DATABASE_URL

if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif "mysql" in db_url:
    engine_kwargs["pool_recycle"] = 3600
    # Test connection if placeholder password is used
    if "YOUR_MYSQL_PASSWORD" in db_url:
        logger.warning(
            "Default placeholder password detected in DATABASE_URL. "
            "Falling back to local SQLite 'autonomusai.db' until valid MySQL credentials are provided."
        )
        db_url = "sqlite:///./autonomusai.db"
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        if "pool_recycle" in engine_kwargs:
            del engine_kwargs["pool_recycle"]

try:
    engine = create_engine(db_url, **engine_kwargs)
    with engine.connect() as test_conn:
        test_conn.execute(text("SELECT 1"))
except Exception as exc:
    if "mysql" in db_url:
        logger.warning(
            f"MySQL connection to {db_url.split('@')[-1]} failed ({exc}). "
            "Using fallback local SQLite database 'autonomusai.db'."
        )
        db_url = "sqlite:///./autonomusai.db"
        engine_kwargs = {"echo": settings.DB_ECHO, "connect_args": {"check_same_thread": False}}
        engine = create_engine(db_url, **engine_kwargs)
    else:
        raise exc

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for yielding database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> Tuple[bool, str]:
    """Verifies database connectivity without crashing if disconnected."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, "connected"
    except Exception as exc:
        logger.warning(f"Database health check failed: {exc}")
        return False, f"unavailable: {type(exc).__name__}"
