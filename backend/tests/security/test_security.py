import pytest

from app.core.exceptions import SecurityViolationException
from app.security.filename_validation import sanitize_and_validate_filename
from app.security.input_limits import validate_session_limits
from app.utils.output_limits import truncate_output


def test_sanitize_valid_filenames():
    assert sanitize_and_validate_filename("main.py") == "main.py"
    assert sanitize_and_validate_filename("src/utils/calc.py") == "src/utils/calc.py"
    assert sanitize_and_validate_filename("tests/test_main.py") == "tests/test_main.py"


def test_path_traversal_rejection():
    with pytest.raises(SecurityViolationException) as exc:
        sanitize_and_validate_filename("../../../etc/passwd")
    assert "Directory traversal" in str(exc.value)

    with pytest.raises(SecurityViolationException) as exc:
        sanitize_and_validate_filename("sub/../../secret.py")
    assert "Directory traversal" in str(exc.value)


def test_absolute_path_rejection():
    with pytest.raises(SecurityViolationException) as exc:
        sanitize_and_validate_filename("/root/secret.py")
    assert "Absolute paths are prohibited" in str(exc.value)


def test_reserved_windows_device_names():
    with pytest.raises(SecurityViolationException) as exc:
        sanitize_and_validate_filename("CON.py")
    assert "reserved system device name" in str(exc.value)

    with pytest.raises(SecurityViolationException) as exc:
        sanitize_and_validate_filename("sub/NUL.txt")
    assert "reserved system device name" in str(exc.value)


def test_forbidden_characters_rejection():
    with pytest.raises(SecurityViolationException) as exc:
        sanitize_and_validate_filename("file|name.py")
    assert "illegal characters" in str(exc.value)

    with pytest.raises(SecurityViolationException) as exc:
        sanitize_and_validate_filename("bad:name?.py")
    assert "illegal characters" in str(exc.value)


def test_oversized_source_file_rejection():
    large_content = "x" * 250_000  # Exceeds 200 KB default limit
    files = [{"filename": "large.py", "content": large_content}]
    with pytest.raises(SecurityViolationException) as exc:
        validate_session_limits(files, language="python", max_repair_attempts=2)
    assert "exceeds max size limit" in str(exc.value)


def test_output_truncation_limits():
    small_text = "Standard stdout line"
    assert truncate_output(small_text, max_bytes=100) == small_text

    long_text = "A" * 500
    truncated = truncate_output(long_text, max_bytes=50)
    assert len(truncated.encode("utf-8")) < 500
    assert "OUTPUT TRUNCATED" in truncated
