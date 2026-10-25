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
    findings = static_analysis_service.analyze_file("test.xyz", code, "unsupported_lang")
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


def test_python_semicolon_detection():
    # 1. Trailing semicolon E703
    code1 = "data = [10, 20, 30, 40, 50];\n"
    findings1 = static_analysis_service.analyze_file("main.py", code1, "python")
    semi1 = next((f for f in findings1 if "semicolon" in f["title"].lower()), None)
    assert semi1 is not None
    assert semi1["category"] == "Code Quality"
    assert "E703" in semi1["title"]
    assert semi1["line_number"] == 1

    # 2. Semicolon used instead of colon in compound statement
    code2 = "def calculate_average(numbers);\n    return 0\n"
    findings2 = static_analysis_service.analyze_file("main.py", code2, "python")
    semi2 = next((f for f in findings2 if "instead of colon" in f["title"].lower()), None)
    assert semi2 is not None
    assert semi2["category"] == "Syntax"
    assert semi2["severity"] == "Critical"
    assert semi2["line_number"] == 1


def test_springboot_java_defect_detection():
    java_code = (
        "package com.example.demo.controller;\n\n"
        "import org.springframework.web.bind.annotation.*;\n\n"
        "@RestControlller\n"
        "@RequestMapping(\"/api/v1\")\n"
        "public class UserController {\n\n"
        "    @GetMappng(\"/users\")\n"
        "    public String getUser(String name) {\n"
        "        if (name == \"admin\") {\n"
        "            return \"Access Granted\";\n"
        "        }\n"
        "        return \"User: \" + name;\n"
        "    }\n"
        "}\n"
    )
    findings = static_analysis_service.analyze_file("UserController.java", java_code, "springboot")
    assert len(findings) >= 3

    # Spring annotation typo @RestControlller
    controller_typo = next((f for f in findings if "@RestController" in f.get("title", "")), None)
    assert controller_typo is not None
    assert controller_typo["severity"] == "Critical"
    assert controller_typo["line_number"] == 5

    # Spring annotation typo @GetMappng
    mapping_typo = next((f for f in findings if "@GetMapping" in f.get("title", "")), None)
    assert mapping_typo is not None
    assert mapping_typo["severity"] == "Critical"
    assert mapping_typo["line_number"] == 9

    # Java string equality ==
    equality_hazard = next((f for f in findings if ".equals()" in f.get("title", "")), None)
    assert equality_hazard is not None
    assert equality_hazard["category"] in ("Logic", "Runtime")
    assert equality_hazard["line_number"] == 11


def test_springboot_properties_security():
    props_content = (
        "server.port=8080\n"
        "spring.datasource.url=jdbc:mysql://localhost:3306/mydb\n"
        "spring.datasource.username=root\n"
        "spring.datasource.password=superSecretPassword123\n"
    )
    findings = static_analysis_service.analyze_file("application.properties", props_content, "properties")
    assert len(findings) >= 1
    secret_finding = next((f for f in findings if "secret" in f.get("title", "").lower() or "password" in f.get("title", "").lower()), None)
    assert secret_finding is not None
    assert secret_finding["category"] == "Security"
    assert secret_finding["line_number"] == 4


def test_universal_framework_session_limits():
    from app.security.input_limits import validate_session_limits

    files = [{"filename": "Main.java", "content": "public class Main { public static void main(String[] args) {} }"}]
    
    # Should cleanly validate Spring Boot and enterprise frameworks without security violations
    for fw in ["springboot", "spring", "django", "fastapi", "express", "nextjs", "dotnet", "flutter", "custom_lang"]:
        validate_session_limits(files, language=fw, max_repair_attempts=3)


