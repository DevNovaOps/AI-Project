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


def test_java_sout_and_builtin_typo_detection():
    code = (
        "def calculate_average(numbers):\n"
        "    if lenn(numbers) ==== 0:\n"
        "        return 0\n"
        "    total = sum(numbers)\n"
        "    return total / len(numbers)\n\n"
        "data = [10, 20, 30]\n"
        "System.out.println('Average:', calculate_average(data))\n"
    )
    findings = static_analysis_service.analyze_file("main.py", code, "python")
    assert len(findings) >= 3

    # Check Java System.out.println detection
    java_finding = next((f for f in findings if "System.out.println" in f["title"]), None)
    assert java_finding is not None
    assert java_finding["category"] == "Language Mismatch"
    assert java_finding["severity"] == "Critical"
    assert java_finding["line_number"] == 8

    # Check builtin typo lenn
    typo_finding = next((f for f in findings if "lenn" in f["title"]), None)
    assert typo_finding is not None
    assert typo_finding["category"] == "Runtime Error"
    assert typo_finding["severity"] == "Critical"
    assert typo_finding["line_number"] == 2

    # Check invalid operator ====
    op_finding = next((f for f in findings if "====" in f["title"]), None)
    assert op_finding is not None
    assert op_finding["category"] == "Syntax"
    assert op_finding["severity"] == "Critical"
    assert op_finding["line_number"] == 2
