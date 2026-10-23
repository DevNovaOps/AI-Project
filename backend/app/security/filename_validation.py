import re

from app.core.exceptions import SecurityViolationException

# Prohibited characters in filenames across POSIX and Windows
FORBIDDEN_CHARS = re.compile(r'[<>:"|?*\0]')
# Prohibited Windows device names
RESERVED_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
}


def sanitize_and_validate_filename(filename: str) -> str:
    """
    Validates that a submitted filename is safe:
    - No directory traversal (.. or \\)
    - No absolute paths (/etc/passwd or C:\\...)
    - No forbidden characters
    - Not a reserved Windows name
    - Sensible length (< 255 chars)
    """
    if not filename or not filename.strip():
        raise SecurityViolationException("Filename cannot be empty.")

    clean_filename = filename.strip().replace("\\", "/")

    # Disallow leading slash (absolute path)
    if clean_filename.startswith("/"):
        raise SecurityViolationException(
            "Absolute paths are prohibited in submitted filenames."
        )

    # Check for path traversal attempts
    parts = clean_filename.split("/")
    for part in parts:
        if part in ("..", ".", ""):
            raise SecurityViolationException(
                f"Invalid filename segment '{part}'. Directory traversal is strictly forbidden."
            )
        pure_name = part.split(".")[0].upper()
        if pure_name in RESERVED_NAMES:
            raise SecurityViolationException(
                f"Filename contains reserved system device name: '{part}'."
            )
        if FORBIDDEN_CHARS.search(part):
            raise SecurityViolationException(
                f"Filename '{part}' contains illegal characters."
            )

    if len(clean_filename) > 255:
        raise SecurityViolationException(
            "Filename exceeds maximum length of 255 characters."
        )

    return clean_filename
