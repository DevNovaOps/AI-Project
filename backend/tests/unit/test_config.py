from app.core.config import Settings


def test_settings_default_values():
    s = Settings(
        APP_NAME="AutonomusAI Test",
        DATABASE_URL="sqlite:///./test_cfg.db",
        GROQ_API_KEY="test_key_dummy",
    )
    assert s.APP_NAME == "AutonomusAI Test"
    assert s.MAX_REPAIR_ATTEMPTS == 3
    assert s.SANDBOX_ENABLED is False
    assert "http://localhost:5173" in s.CORS_ORIGINS
    assert s.GROQ_MODEL in ("llama-3.3-70b-versatile", "qwen/qwen3.8-27b", "deepseek-r1-distill-llama-70b")


def test_cors_origin_parsing():
    s = Settings(CORS_ORIGINS='["http://example.com", "http://test.local"]')
    assert "http://example.com" in s.CORS_ORIGINS
    assert "http://test.local" in s.CORS_ORIGINS
