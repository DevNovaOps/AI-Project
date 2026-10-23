from app.core.config import settings


def truncate_output(text: str, max_bytes: int = None) -> str:
    """Safely bounds output to prevent terminal/database column exhaustion."""
    if text is None:
        return ""
    if max_bytes is None:
        max_bytes = settings.MAX_STDOUT_BYTES

    encoded = text.encode("utf-8", errors="replace")
    if len(encoded) <= max_bytes:
        return text

    truncated_encoded = encoded[:max_bytes]
    decoded = truncated_encoded.decode("utf-8", errors="ignore")
    return f"{decoded}\n... [OUTPUT TRUNCATED: Exceeded {max_bytes} bytes limit]"
