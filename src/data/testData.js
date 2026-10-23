// Test suite data for AegisVault test runner

export const initialTestCases = [
  {
    id: 'test-1',
    name: 'test_average_normal_case',
    file: 'tests/test_main.py',
    status: 'passed',
    duration: '14ms',
    error: null,
    stdout: 'Tested standard list [10, 20, 30, 40, 50] -> result: 30.0 OK'
  },
  {
    id: 'test-2',
    name: 'test_average_float_numbers',
    file: 'tests/test_main.py',
    status: 'passed',
    duration: '18ms',
    error: null,
    stdout: 'Tested float list [1.5, 2.5, 3.5] -> result: 2.5 OK'
  },
  {
    id: 'test-3',
    name: 'test_average_empty_list',
    file: 'tests/test_main.py',
    status: 'failed',
    duration: '25ms',
    error: 'ZeroDivisionError: division by zero',
    traceback: `Traceback (most recent call last):
  File "tests/test_main.py", line 14, in test_average_empty_list
    self.assertEqual(calculate_average([]), 0)
  File "backend/main.py", line 6, in calculate_average
    return sum(numbers) / len(numbers)
ZeroDivisionError: division by zero`,
    associatedIssueId: 'ISSUE-01'
  },
  {
    id: 'test-4',
    name: 'test_average_large_numbers',
    file: 'tests/test_main.py',
    status: 'passed',
    duration: '32ms',
    error: null,
    stdout: 'Tested large values [1000000, 2000000] -> result: 1500000 OK'
  }
];

export const testHistory = [
  { id: 'run-1', timestamp: '13:28:10', passed: 3, failed: 1, duration: '89ms' },
  { id: 'run-2', timestamp: '13:25:02', passed: 2, failed: 2, duration: '94ms' },
  { id: 'run-3', timestamp: '13:20:45', passed: 4, failed: 0, duration: '78ms' }
];
