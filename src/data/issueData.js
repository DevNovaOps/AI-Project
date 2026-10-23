// Diagnostic issues dataset matching the reference images

export const initialIssues = [
  {
    id: 'ISSUE-01',
    num: 1,
    severity: 'Critical',
    title: 'Division by zero',
    message: 'Division by zero',
    detail: 'len(numbers) could be 0. Add a validation check before division.',
    file: 'main.py',
    fullPath: 'backend/main.py',
    line: 6,
    col: 12,
    source: 'Runtime',
    category: 'Runtime Error',
    confidence: 95,
    status: 'Open',
    codeSnippet: '    return sum(numbers) / len(numbers)',
    rootCause: 'The function does not handle the case when the input list is empty. Division by zero occurs when len(numbers) is 0.',
    suggestedFix: `def calculate_average(numbers):
    if len(numbers) == 0:
        return 0
    return sum(numbers) / len(numbers)`,
    appliedFixSnippet: `def calculate_average(numbers):
    if not numbers or len(numbers) == 0:
        return 0
    return sum(numbers) / len(numbers)`,
    additionalSuggestions: [
      { id: 'sugg-1', title: 'Add input type validation', badge: 'Warning', type: 'warning' },
      { id: 'sugg-2', title: 'Add docstring', badge: 'Info', type: 'info' },
      { id: 'sugg-3', title: 'Handle non-numeric values', badge: 'Info', type: 'info' }
    ]
  },
  {
    id: 'ISSUE-02',
    num: 2,
    severity: 'High',
    title: 'No input validation',
    message: 'No input validation',
    detail: "Function doesn't handle empty list or non-iterable objects gracefully",
    file: 'main.py',
    fullPath: 'backend/main.py',
    line: 3,
    col: 5,
    source: 'Logic',
    category: 'Logic',
    confidence: 90,
    status: 'Open',
    codeSnippet: 'def calculate_average(numbers):',
    rootCause: 'Parameters are accepted without verifying iterable structure or type safety.',
    suggestedFix: `def calculate_average(numbers):
    if not isinstance(numbers, (list, tuple)):
        raise TypeError("Expected a list or tuple of numbers")`,
    additionalSuggestions: [
      { id: 'sugg-2-1', title: 'Add isinstance checks', badge: 'Warning', type: 'warning' }
    ]
  },
  {
    id: 'ISSUE-03',
    num: 3,
    severity: 'Medium',
    title: 'Missing type hints',
    message: 'Missing type hints',
    detail: 'Parameters lack type annotations (PEP 484)',
    file: 'main.py',
    fullPath: 'backend/main.py',
    line: 1,
    col: 23,
    source: 'Code Quality',
    category: 'Code Quality',
    confidence: 88,
    status: 'Open',
    codeSnippet: 'def calculate_average(numbers):',
    rootCause: 'Function signature lacks typing annotations for static checkers like mypy.',
    suggestedFix: `from typing import Sequence, Union

def calculate_average(numbers: Sequence[Union[int, float]]) -> float:`,
    additionalSuggestions: [
      { id: 'sugg-3-1', title: 'Enable strict mypy typing', badge: 'Info', type: 'info' }
    ]
  },
  {
    id: 'ISSUE-04',
    num: 4,
    severity: 'Low',
    title: 'No docstring',
    message: 'No docstring',
    detail: 'Function should have structured PEP 257 documentation',
    file: 'main.py',
    fullPath: 'backend/main.py',
    line: 1,
    col: 1,
    source: 'Best Practice',
    category: 'Best Practice',
    confidence: 94,
    status: 'Open',
    codeSnippet: 'def calculate_average(numbers):',
    rootCause: 'Missing docstring explaining arguments, return value, and exceptions.',
    suggestedFix: `"""Calculate the arithmetic mean of a list of numbers.

Args:
    numbers: A sequence of numeric values.

Returns:
    float: The average value, or 0.0 if empty.
"""`,
    additionalSuggestions: [
      { id: 'sugg-4-1', title: 'Generate Sphinx / Google style docs', badge: 'Info', type: 'info' }
    ]
  }
];
