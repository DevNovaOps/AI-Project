// Mock File contents and language mapping

export const initialFiles = {
  'backend/main.py': {
    name: 'main.py',
    path: 'backend/main.py',
    language: 'python',
    content: `# Function to calculate average of a list
def calculate_average(numbers):
    if len(numbers) == 0:
        return 0

    return sum(numbers) / len(numbers)


# Example usage
data = [10, 20, 30, 40, 50]
print("Average:", calculate_average(data))

# Edge case (this might cause an issue)
empty_list = []
print("Empty list average:", calculate_average(empty_list))
`,
    fixedContent: `# Function to calculate average of a list
def calculate_average(numbers):
    # Guard against empty list or invalid inputs
    if not numbers or len(numbers) == 0:
        return 0

    return sum(numbers) / len(numbers)


# Example usage
data = [10, 20, 30, 40, 50]
print("Average:", calculate_average(data))

# Edge case handled safely
empty_list = []
print("Empty list average:", calculate_average(empty_list))
`
  },

  'backend/utils.py': {
    name: 'utils.py',
    path: 'backend/utils.py',
    language: 'python',
    content: `"""Utility helpers for AegisVault data processing and logging."""
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AegisVault")

def sanitize_input(raw_data):
    """Sanitize and clean raw input dictionary or array."""
    if raw_data is None:
        return {}
    if isinstance(raw_data, dict):
        return {k: str(v).strip() for k, v in raw_data.items() if v is not None}
    return raw_data

def measure_execution_time(func):
    """Decorator to measure and log function execution time."""
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        duration = time.perf_counter() - start
        logger.info(f"Execution of {func.__name__} took {duration:.4f}s")
        return result
    return wrapper
`
  },

  'tests/test_main.py': {
    name: 'test_main.py',
    path: 'tests/test_main.py',
    language: 'python',
    content: `"""Unit tests for calculate_average in main.py."""
import unittest
from backend.main import calculate_average

class TestCalculateAverage(unittest.TestCase):
    def test_average_normal_case(self):
        """Test with standard positive integer list."""
        self.assertEqual(calculate_average([10, 20, 30, 40, 50]), 30)

    def test_average_float_numbers(self):
        """Test with floating point numbers."""
        self.assertAlmostEqual(calculate_average([1.5, 2.5, 3.5]), 2.5)

    def test_average_empty_list(self):
        """Test edge case with empty list. Should return 0 without raising ZeroDivisionError."""
        self.assertEqual(calculate_average([]), 0)

    def test_average_large_numbers(self):
        """Test with large numerical values."""
        self.assertEqual(calculate_average([1000000, 2000000]), 1500000)

if __name__ == '__main__':
    unittest.main()
`
  },

  'backend/app/agents/planner.py': {
    name: 'planner.py',
    path: 'backend/app/agents/planner.py',
    language: 'python',
    content: `"""Planner / Orchestrator Agent for multi-agent autonomous workflow."""
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class WorkflowPlan:
    session_id: str
    target_files: List[str]
    steps: List[str]
    max_retries: int = 3

class PlannerAgent:
    def __init__(self, model_name: str = "gemini-3.8-flash"):
        self.model_name = model_name
        self.active_plan = None

    def create_debugging_plan(self, project_path: str) -> WorkflowPlan:
        """Create a structured multi-agent execution pipeline."""
        return WorkflowPlan(
            session_id="dbg_session_9281",
            target_files=["backend/main.py"],
            steps=[
                "code_analysis",
                "diagnosis",
                "fix_generation",
                "test_execution",
                "validation_reporting"
            ],
            max_retries=3
        )
`
  },

  'backend/app/agents/code_analysis.py': {
    name: 'code_analysis.py',
    path: 'backend/app/agents/code_analysis.py',
    language: 'python',
    content: `"""Code Analysis Agent: AST traversal, static analysis, pattern recognition."""
import ast

class CodeAnalysisAgent:
    def scan_file(self, file_content: str):
        tree = ast.parse(file_content)
        findings = []
        # Check division operations for zero guard
        for node in ast.walk(tree):
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Div):
                findings.append({
                    "type": "potential_zero_division",
                    "lineno": node.lineno,
                    "severity": "Critical"
                })
        return findings
`
  },

  'backend/models.py': {
    name: 'models.py',
    path: 'backend/models.py',
    language: 'python',
    content: `"""Data models for AegisVault telemetry and issue tracking."""
from dataclasses import dataclass
from typing import Optional

@dataclass
class IssueRecord:
    id: str
    severity: str
    message: str
    file_path: str
    line: int
    confidence: float
    status: str = "Open"
    suggested_fix: Optional[str] = None
`
  },

  'frontend/src/App.jsx': {
    name: 'App.jsx',
    path: 'frontend/src/App.jsx',
    language: 'javascript',
    content: `import React from 'react';

export default function App() {
  return (
    <div className="app-container">
      <h1>AegisVault Web Interface</h1>
      <p>Autonomous AI Debugging & Analysis Console</p>
    </div>
  );
}
`
  },

  'requirements.txt': {
    name: 'requirements.txt',
    path: 'requirements.txt',
    language: 'plaintext',
    content: `fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.0
pytest>=8.0.0
monaco-editor>=0.45.0
`
  },

  'README.md': {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    content: `# AegisVault
Autonomous Multi-Agent Debugging, Testing & Validation System.

## Architecture
- Planner / Orchestrator
- Code Analysis Agent
- Diagnosis Agent
- Fix & Test Agent
- Validation & Reporting Agent
`
  }
};
