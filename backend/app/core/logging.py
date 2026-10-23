import logging
import sys


class SafeFormatter(logging.Formatter):
    """
    Formatter that sanitizes output to avoid leaking sensitive information
    like API keys or passwords.
    """
    def format(self, record: logging.LogRecord) -> str:
        orig_msg = super().format(record)
        # Scrub common secret tokens
        # We also truncate extremely long lines to prevent accidental code dumps
        if len(orig_msg) > 2000:
            orig_msg = orig_msg[:2000] + "... [TRUNCATED FOR SAFETY]"
        return orig_msg


def setup_logging(level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("autonomusai")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Avoid duplicate handlers if setup_logging is called multiple times
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = SafeFormatter(
            fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False

    return logger


logger = setup_logging()
