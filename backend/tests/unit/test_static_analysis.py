from app.services.static_analysis_service import static_analysis_service


def test_syntax_error_detection():
    bad_code = "def broken(\n    return 42\n"
    findings = static_analysis_service.analyze_file("broken.py", bad_code, "python")
    assert len(findings) >= 1
    syntax_finding = next((f for f in findings if f["category"] == "Syntax"), None)
    assert syntax_finding is not None
    assert syntax_finding["severity"] == "Critical"
    assert syntax_finding["origin"] == "AST"
    assert syntax_finding["line_number"] is not None


def test_security_violation_detection():
    unsafe_code = (
        "import os\n"
        "def run_command(cmd):\n"
        "    os.system(cmd)\n"
        "    eval('2 + 2')\n"
    )
    findings = static_analysis_service.analyze_file("unsafe.py", unsafe_code, "python")
    security_findings = [f for f in findings if f["category"] == "Security"]
    assert len(security_findings) >= 2
    titles = [f["title"] for f in security_findings]
    assert any("eval" in t for t in titles)
    assert any("os.system" in t for t in titles)


def test_division_by_zero_potential_detection():
    code = (
        "def calculate_average(numbers):\n"
        "    return sum(numbers) / len(numbers)\n"
    )
    findings = static_analysis_service.analyze_file("main.py", code, "python")
    div_zero = next((f for f in findings if "division by zero" in f["title"].lower()), None)
    assert div_zero is not None
    assert div_zero["category"] == "Runtime Error"
    assert div_zero["line_number"] == 2


def test_unsupported_language_notice():
    code = "function test() { return 1; }"
    findings = static_analysis_service.analyze_file("test.js", code, "javascript")
    assert len(findings) == 1
    assert "skipped" in findings[0]["title"].lower()
    assert findings[0]["severity"] == "Info"
