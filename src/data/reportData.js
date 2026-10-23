// Complete telemetry, metrics, and issue records for the AETHERION Reports Page

export const summaryMetricsData = [
  {
    id: 'total-issues',
    title: 'Total Issues',
    value: '24',
    change: '+12%',
    isPositive: false,
    subtitle: 'vs last run',
    iconType: 'bug',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.25)'
  },
  {
    id: 'critical-issues',
    title: 'Critical Issues',
    value: '4',
    change: '+1',
    isPositive: false,
    subtitle: 'vs last run',
    iconType: 'warning',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.25)'
  },
  {
    id: 'fixed-issues',
    title: 'Fixed Issues',
    value: '18',
    change: '+6',
    isPositive: true,
    subtitle: 'vs last run',
    iconType: 'info',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.25)'
  },
  {
    id: 'files-scanned',
    title: 'Files Scanned',
    value: '32',
    change: '+8',
    isPositive: true,
    subtitle: 'vs last run',
    iconType: 'document',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.25)'
  },
  {
    id: 'analysis-time',
    title: 'Analysis Time',
    value: '2.4s',
    change: '-35%',
    isPositive: true,
    subtitle: 'vs last run',
    iconType: 'clock',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.25)'
  },
  {
    id: 'code-quality',
    title: 'Code Quality',
    value: '82%',
    change: '+6%',
    isPositive: true,
    subtitle: 'vs last run',
    iconType: 'check',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.25)'
  }
];

export const issueTrendsData = [
  { date: 'Oct 1', total: 25, critical: 8, high: 7, medium: 6, low: 4 },
  { date: 'Oct 2', total: 34, critical: 10, high: 9, medium: 9, low: 6 },
  { date: 'Oct 3', total: 28, critical: 7, high: 8, medium: 8, low: 5 },
  { date: 'Oct 4', total: 24, critical: 6, high: 7, medium: 7, low: 4 },
  { date: 'Oct 5', total: 18, critical: 4, high: 5, medium: 6, low: 3 },
  { date: 'Oct 6', total: 21, critical: 5, high: 6, medium: 6, low: 4 },
  { date: 'Oct 7', total: 26, critical: 6, high: 8, medium: 7, low: 5 },
  { date: 'Oct 8', total: 23, critical: 5, high: 7, medium: 7, low: 4 },
  { date: 'Oct 9', total: 21, critical: 4, high: 6, medium: 7, low: 4 },
  { date: 'Oct 10', total: 30, critical: 6, high: 9, medium: 9, low: 6 }
];

export const severityDistributionData = [
  { name: 'Critical', value: 4, percentage: '17%', count: 4, color: '#ef4444' },
  { name: 'High', value: 6, percentage: '25%', count: 6, color: '#f97316' },
  { name: 'Medium', value: 8, percentage: '33%', count: 8, color: '#06b6d4' },
  { name: 'Low', value: 6, percentage: '25%', count: 6, color: '#10b981' }
];

export const categoryBreakdownData = [
  { name: 'Runtime Error', count: 8, max: 8, color: '#ef4444' },
  { name: 'Logic Issue', count: 6, max: 8, color: '#f97316' },
  { name: 'Code Quality', count: 4, max: 8, color: '#06b6d4' },
  { name: 'Best Practice', count: 3, max: 8, color: '#a855f7' },
  { name: 'Security', count: 2, max: 8, color: '#10b981' },
  { name: 'Performance', count: 1, max: 8, color: '#8b5cf6' }
];

export const detailedIssuesList = [
  {
    id: 'ISSUE-01',
    num: 1,
    severity: 'Critical',
    title: 'Division by zero',
    detail: 'len(numbers) could be 0. Add a validation check before division.',
    file: 'main.py',
    line: 6,
    category: 'Runtime Error',
    status: 'Open',
    detected: '2 mins ago',
    source: 'backend/main.py',
    confidence: 95,
    codeSnippet: [
      { lineNum: 3, text: 'def calculate_average(numbers):' },
      { lineNum: 4, text: '    if len(numbers) == 0:' },
      { lineNum: 5, text: '        return 0' },
      { lineNum: 6, text: '    return sum(numbers) / len(numbers)', isError: true }
    ],
    explanation: "The function doesn't handle the case when the input list is empty. When len(numbers) is 0, division by zero occurs.",
    suggestedFixLines: [
      { lineNum: 3, text: '    def calculate_average(numbers):', prefix: '+' },
      { lineNum: 4, text: '        if len(numbers) == 0:', prefix: '+' },
      { lineNum: 5, text: '            return 0', prefix: '+' },
      { lineNum: 6, text: '        return sum(numbers) / len(numbers)', prefix: '>' }
    ],
    fixSnippet: "def calculate_average(numbers):\n    if len(numbers) == 0:\n        return 0\n    return sum(numbers) / len(numbers)"
  },
  {
    id: 'ISSUE-02',
    num: 2,
    severity: 'High',
    title: 'No input validation',
    detail: "Function doesn't handle empty list or non-iterable objects gracefully",
    file: 'main.py',
    line: 3,
    category: 'Logic',
    status: 'Open',
    detected: '5 mins ago',
    source: 'backend/main.py',
    confidence: 91,
    codeSnippet: [
      { lineNum: 1, text: 'def calculate_average(numbers):' },
      { lineNum: 2, text: '    # missing type and none validation' },
      { lineNum: 3, text: '    total = sum(numbers)', isError: true }
    ],
    explanation: "Passing None or an invalid non-iterable parameter throws a TypeError before boundary checks.",
    suggestedFixLines: [
      { lineNum: 2, text: '    if not isinstance(numbers, (list, tuple)) or not numbers:', prefix: '+' },
      { lineNum: 3, text: '        return 0.0', prefix: '+' }
    ],
    fixSnippet: "if not isinstance(numbers, (list, tuple)) or not numbers:\n    return 0.0"
  },
  {
    id: 'ISSUE-03',
    num: 3,
    severity: 'Medium',
    title: 'Missing type hints',
    detail: 'Parameters lack type annotations for strict static analysis',
    file: 'main.py',
    line: 1,
    category: 'Code Quality',
    status: 'Open',
    detected: '10 mins ago',
    source: 'backend/main.py',
    confidence: 88,
    codeSnippet: [
      { lineNum: 1, text: 'def calculate_average(numbers):', isError: true }
    ],
    explanation: "Explicit type hints like `List[Union[int, float]] -> float` improve IDE auto-complete and Mypy validation.",
    suggestedFixLines: [
      { lineNum: 1, text: 'def calculate_average(numbers: list[float]) -> float:', prefix: '+' }
    ],
    fixSnippet: "def calculate_average(numbers: list[float]) -> float:"
  },
  {
    id: 'ISSUE-04',
    num: 4,
    severity: 'Low',
    title: 'No docstring',
    detail: 'Function should have Google or Sphinx documentation string',
    file: 'main.py',
    line: 1,
    category: 'Best Practice',
    status: 'Open',
    detected: '10 mins ago',
    source: 'backend/main.py',
    confidence: 85,
    codeSnippet: [
      { lineNum: 1, text: 'def calculate_average(numbers):', isError: true }
    ],
    explanation: "Document function arguments, return values, and raised exceptions in docstring format.",
    suggestedFixLines: [
      { lineNum: 2, text: '    """Calculate arithmetic mean of numeric sequence."""', prefix: '+' }
    ],
    fixSnippet: '    """Calculate arithmetic mean of numeric sequence."""'
  },
  {
    id: 'ISSUE-05',
    num: 5,
    severity: 'High',
    title: 'Unused variable',
    detail: "Variable 'temp' is assigned but never accessed",
    file: 'utils.py',
    line: 15,
    category: 'Code Quality',
    status: 'Fixed',
    detected: '20 mins ago',
    source: 'backend/utils.py',
    confidence: 96,
    codeSnippet: [
      { lineNum: 14, text: 'def clean_data(raw):' },
      { lineNum: 15, text: '    temp = raw.strip()', isError: true },
      { lineNum: 16, text: '    return raw.lower()' }
    ],
    explanation: "Dead assignments cause unnecessary memory consumption and confuse maintainers.",
    suggestedFixLines: [
      { lineNum: 15, text: '    return raw.strip().lower()', prefix: '+' }
    ],
    fixSnippet: "return raw.strip().lower()"
  },
  {
    id: 'ISSUE-06',
    num: 6,
    severity: 'Medium',
    title: 'Hardcoded values',
    detail: 'Use constants instead of numeric/string literals',
    file: 'config.py',
    line: 22,
    category: 'Best Practice',
    status: 'Open',
    detected: '25 mins ago',
    source: 'backend/config.py',
    confidence: 90,
    codeSnippet: [
      { lineNum: 21, text: 'def connect_database():' },
      { lineNum: 22, text: "    timeout = 30 # hardcoded seconds", isError: true }
    ],
    explanation: "Extract connection timeouts and magic numbers into environment variables or uppercase constants.",
    suggestedFixLines: [
      { lineNum: 22, text: '    timeout = os.getenv("DB_TIMEOUT", 30)', prefix: '+' }
    ],
    fixSnippet: 'timeout = os.getenv("DB_TIMEOUT", 30)'
  },
  {
    id: 'ISSUE-07',
    num: 7,
    severity: 'Low',
    title: 'Line too long',
    detail: 'Line exceeds 120 characters PEP8 standard limit',
    file: 'planner.py',
    line: 45,
    category: 'Code Style',
    status: 'Open',
    detected: '30 mins ago',
    source: 'backend/app/agents/planner.py',
    confidence: 98,
    codeSnippet: [
      { lineNum: 45, text: '    logger.info("Executing plan for repository with parameters %s and flags %s", params, flags)', isError: true }
    ],
    explanation: "Break long string interpolations across multiple lines to adhere to style guidelines.",
    suggestedFixLines: [
      { lineNum: 45, text: '    logger.info(\n        "Executing plan for repository with params %s",\n        params\n    )', prefix: '+' }
    ],
    fixSnippet: 'logger.info(\n    "Executing plan with params %s",\n    params\n)'
  },
  {
    id: 'ISSUE-08',
    num: 8,
    severity: 'Critical',
    title: 'SQL Injection Vulnerability',
    detail: 'Direct string concatenation in database query parameter',
    file: 'database.py',
    line: 88,
    category: 'Security',
    status: 'Open',
    detected: '35 mins ago',
    source: 'backend/database.py',
    confidence: 97,
    codeSnippet: [
      { lineNum: 88, text: 'cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")', isError: true }
    ],
    explanation: "Direct interpolation permits unsanitized input injection. Use parameterized queries.",
    suggestedFixLines: [
      { lineNum: 88, text: 'cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))', prefix: '+' }
    ],
    fixSnippet: 'cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))'
  },
  {
    id: 'ISSUE-09',
    num: 9,
    severity: 'Critical',
    title: 'Uncaught NullPointerException',
    detail: 'Accessing properties of undefined response object',
    file: 'api.py',
    line: 42,
    category: 'Runtime Error',
    status: 'Open',
    detected: '40 mins ago',
    source: 'backend/api.py',
    confidence: 94,
    codeSnippet: [
      { lineNum: 42, text: 'user_email = response.data.user.email', isError: true }
    ],
    explanation: "If response.data or user is null, unhandled exception terminates the event loop.",
    suggestedFixLines: [
      { lineNum: 42, text: 'user_email = response.get("data", {}).get("user", {}).get("email")', prefix: '+' }
    ],
    fixSnippet: 'user_email = response.get("data", {}).get("user", {}).get("email")'
  },
  {
    id: 'ISSUE-10',
    num: 10,
    severity: 'High',
    title: 'Race Condition in Worker Pool',
    detail: 'Shared mutable counter without lock synchronization',
    file: 'worker.py',
    line: 63,
    category: 'Logic Issue',
    status: 'Open',
    detected: '45 mins ago',
    source: 'backend/worker.py',
    confidence: 92,
    codeSnippet: [
      { lineNum: 63, text: 'self.active_jobs += 1', isError: true }
    ],
    explanation: "Concurrent threads increment counter without threading.Lock acquire/release.",
    suggestedFixLines: [
      { lineNum: 63, text: 'with self._lock:\n        self.active_jobs += 1', prefix: '+' }
    ],
    fixSnippet: 'with self._lock:\n    self.active_jobs += 1'
  },
  {
    id: 'ISSUE-11',
    num: 11,
    severity: 'High',
    title: 'Memory Leak in Event Listener',
    detail: 'Event listeners are registered repeatedly without deregistration',
    file: 'events.py',
    line: 34,
    category: 'Performance',
    status: 'Open',
    detected: '50 mins ago',
    source: 'backend/events.py',
    confidence: 89,
    codeSnippet: [
      { lineNum: 34, text: 'dispatcher.on("change", self.handle_change)', isError: true }
    ],
    explanation: "Re-attaching handler on every component update leaks memory over time.",
    suggestedFixLines: [
      { lineNum: 34, text: 'dispatcher.once("change", self.handle_change)', prefix: '+' }
    ],
    fixSnippet: 'dispatcher.once("change", self.handle_change)'
  },
  {
    id: 'ISSUE-12',
    num: 12,
    severity: 'High',
    title: 'Insecure Token Generation',
    detail: 'Using standard random instead of secrets module for auth token',
    file: 'auth.py',
    line: 19,
    category: 'Security',
    status: 'Open',
    detected: '1 hour ago',
    source: 'backend/auth.py',
    confidence: 99,
    codeSnippet: [
      { lineNum: 19, text: 'token = "".join(random.choices(string.ascii_letters, k=32))', isError: true }
    ],
    explanation: "Pseudo-random generator is cryptographically predictable. Use secrets.token_hex(32).",
    suggestedFixLines: [
      { lineNum: 19, text: 'token = secrets.token_urlsafe(32)', prefix: '+' }
    ],
    fixSnippet: 'token = secrets.token_urlsafe(32)'
  },
  {
    id: 'ISSUE-13',
    num: 13,
    severity: 'Medium',
    title: 'Unclosed File Descriptor',
    detail: 'File opened with open() rather than context manager with statement',
    file: 'parser.py',
    line: 52,
    category: 'Best Practice',
    status: 'Open',
    detected: '1 hour ago',
    source: 'backend/parser.py',
    confidence: 93,
    codeSnippet: [
      { lineNum: 52, text: 'f = open("data.json"); content = f.read()', isError: true }
    ],
    explanation: "Failing to close handles can exhaust operating system file descriptors.",
    suggestedFixLines: [
      { lineNum: 52, text: 'with open("data.json", "r") as f:\n        content = f.read()', prefix: '+' }
    ],
    fixSnippet: 'with open("data.json", "r") as f:\n    content = f.read()'
  },
  {
    id: 'ISSUE-14',
    num: 14,
    severity: 'Medium',
    title: 'N+1 Query Pattern',
    detail: 'Iterating over records and making query per item',
    file: 'service.py',
    line: 77,
    category: 'Performance',
    status: 'Open',
    detected: '1 hour ago',
    source: 'backend/service.py',
    confidence: 91,
    codeSnippet: [
      { lineNum: 77, text: 'for u in users:\n        posts = db.get_posts_for_user(u.id)', isError: true }
    ],
    explanation: "Use JOIN or bulk IN queries to fetch associated records in a single query.",
    suggestedFixLines: [
      { lineNum: 77, text: 'posts_by_user = db.get_posts_for_users([u.id for u in users])', prefix: '+' }
    ],
    fixSnippet: 'posts_by_user = db.get_posts_for_users([u.id for u in users])'
  },
  {
    id: 'ISSUE-15',
    num: 15,
    severity: 'Medium',
    title: 'Broad Exception Handling',
    detail: 'Catching bare Exception hides unexpected programming errors',
    file: 'handler.py',
    line: 91,
    category: 'Code Quality',
    status: 'Open',
    detected: '1 hour ago',
    source: 'backend/handler.py',
    confidence: 87,
    codeSnippet: [
      { lineNum: 91, text: 'except Exception as e:\n        pass', isError: true }
    ],
    explanation: "Explicitly catch known exceptions like ValueError or KeyError rather than base Exception.",
    suggestedFixLines: [
      { lineNum: 91, text: 'except (ValueError, KeyError) as e:\n        logger.warning("Handled payload error: %s", e)', prefix: '+' }
    ],
    fixSnippet: 'except (ValueError, KeyError) as e:\n    logger.warning("Handled payload error: %s", e)'
  },
  {
    id: 'ISSUE-16',
    num: 16,
    severity: 'Medium',
    title: 'Missing HTTP Timeout',
    detail: 'requests.get() call without explicit timeout duration',
    file: 'client.py',
    line: 18,
    category: 'Runtime Error',
    status: 'Open',
    detected: '2 hours ago',
    source: 'backend/client.py',
    confidence: 95,
    codeSnippet: [
      { lineNum: 18, text: 'res = requests.get(endpoint_url)', isError: true }
    ],
    explanation: "Without timeout parameter, slow or dropped sockets hang indefinitely.",
    suggestedFixLines: [
      { lineNum: 18, text: 'res = requests.get(endpoint_url, timeout=(3.05, 10))', prefix: '+' }
    ],
    fixSnippet: 'res = requests.get(endpoint_url, timeout=(3.05, 10))'
  },
  {
    id: 'ISSUE-17',
    num: 17,
    severity: 'Medium',
    title: 'Deprecated Library Call',
    detail: 'Using datetime.utcnow() which is deprecated in Python 3.12+',
    file: 'models.py',
    line: 104,
    category: 'Code Quality',
    status: 'Open',
    detected: '2 hours ago',
    source: 'backend/models.py',
    confidence: 96,
    codeSnippet: [
      { lineNum: 104, text: 'created_at = datetime.utcnow()', isError: true }
    ],
    explanation: "Use timezone-aware datetime.now(timezone.utc) to prevent timezone conversion discrepancies.",
    suggestedFixLines: [
      { lineNum: 104, text: 'created_at = datetime.now(timezone.utc)', prefix: '+' }
    ],
    fixSnippet: 'created_at = datetime.now(timezone.utc)'
  },
  {
    id: 'ISSUE-18',
    num: 18,
    severity: 'Low',
    title: 'Redundant Type Conversion',
    detail: 'Calling str() on an already validated string instance',
    file: 'formatter.py',
    line: 38,
    category: 'Code Quality',
    status: 'Open',
    detected: '2 hours ago',
    source: 'backend/formatter.py',
    confidence: 89,
    codeSnippet: [
      { lineNum: 38, text: 'output = str(user_name)', isError: true }
    ],
    explanation: "Redundant casting adds slight overhead and clutters code formatting.",
    suggestedFixLines: [
      { lineNum: 38, text: 'output = user_name', prefix: '+' }
    ],
    fixSnippet: 'output = user_name'
  },
  {
    id: 'ISSUE-19',
    num: 19,
    severity: 'Low',
    title: 'Trailing Whitespace',
    detail: 'Several lines end with invisible whitespace characters',
    file: 'styles.py',
    line: 12,
    category: 'Code Style',
    status: 'Open',
    detected: '3 hours ago',
    source: 'backend/styles.py',
    confidence: 99,
    codeSnippet: [
      { lineNum: 12, text: 'COLOR_PALETTE = {   ', isError: true }
    ],
    explanation: "Trailing spaces cause unnecessary git diff churn.",
    suggestedFixLines: [
      { lineNum: 12, text: 'COLOR_PALETTE = {', prefix: '+' }
    ],
    fixSnippet: 'COLOR_PALETTE = {'
  },
  {
    id: 'ISSUE-20',
    num: 20,
    severity: 'Low',
    title: 'Inconsistent Variable Naming',
    detail: 'camelCase variable used in Python snake_case module',
    file: 'router.py',
    line: 29,
    category: 'Code Style',
    status: 'Open',
    detected: '3 hours ago',
    source: 'backend/router.py',
    confidence: 90,
    codeSnippet: [
      { lineNum: 29, text: 'userProfileData = fetch_profile(id)', isError: true }
    ],
    explanation: "Adhere to PEP8 snake_case for local variables and parameters.",
    suggestedFixLines: [
      { lineNum: 29, text: 'user_profile_data = fetch_profile(id)', prefix: '+' }
    ],
    fixSnippet: 'user_profile_data = fetch_profile(id)'
  },
  {
    id: 'ISSUE-21',
    num: 21,
    severity: 'Medium',
    title: 'Recursive Stack Overflow Risk',
    detail: 'Deep recursive tree parsing lacking maximum recursion depth limit',
    file: 'tree_parser.py',
    line: 67,
    category: 'Runtime Error',
    status: 'Open',
    detected: '3 hours ago',
    source: 'backend/tree_parser.py',
    confidence: 92,
    codeSnippet: [
      { lineNum: 67, text: 'return self.walk(node.child)', isError: true }
    ],
    explanation: "Iterate with an explicit stack rather than unlimited call stack recursion.",
    suggestedFixLines: [
      { lineNum: 67, text: 'if depth > MAX_DEPTH: raise RecursionError("Depth exceeded")', prefix: '+' }
    ],
    fixSnippet: 'if depth > MAX_DEPTH:\n    raise RecursionError("Depth exceeded")'
  },
  {
    id: 'ISSUE-22',
    num: 22,
    severity: 'Critical',
    title: 'Unauthenticated Admin Endpoint',
    detail: 'Route missing @require_admin decorator',
    file: 'admin_routes.py',
    line: 14,
    category: 'Security',
    status: 'Open',
    detected: '4 hours ago',
    source: 'backend/admin_routes.py',
    confidence: 98,
    codeSnippet: [
      { lineNum: 14, text: '@app.route("/admin/reset_db")\ndef reset_db():', isError: true }
    ],
    explanation: "Critical destructive endpoint is accessible by unauthenticated visitors.",
    suggestedFixLines: [
      { lineNum: 14, text: '@app.route("/admin/reset_db")\n@require_auth\n@require_admin\ndef reset_db():', prefix: '+' }
    ],
    fixSnippet: '@app.route("/admin/reset_db")\n@require_auth\n@require_admin\ndef reset_db():'
  },
  {
    id: 'ISSUE-23',
    num: 23,
    severity: 'High',
    title: 'Floating Point Precision Comparison',
    detail: 'Direct equality comparison between float numbers',
    file: 'math_utils.py',
    line: 58,
    category: 'Logic Issue',
    status: 'Open',
    detected: '4 hours ago',
    source: 'backend/math_utils.py',
    confidence: 95,
    codeSnippet: [
      { lineNum: 58, text: 'if val1 + val2 == 0.3:', isError: true }
    ],
    explanation: "0.1 + 0.2 evaluates to 0.30000000000000004 in IEEE 754 floats. Use math.isclose.",
    suggestedFixLines: [
      { lineNum: 58, text: 'if math.isclose(val1 + val2, 0.3, rel_tol=1e-9):', prefix: '+' }
    ],
    fixSnippet: 'if math.isclose(val1 + val2, 0.3, rel_tol=1e-9):'
  },
  {
    id: 'ISSUE-24',
    num: 24,
    severity: 'Low',
    title: 'Magic String Key Usage',
    detail: 'Accessing dictionary using literal strings instead of enum keys',
    file: 'constants.py',
    line: 73,
    category: 'Best Practice',
    status: 'Open',
    detected: '5 hours ago',
    source: 'backend/constants.py',
    confidence: 86,
    codeSnippet: [
      { lineNum: 73, text: 'status = payload["active_user_flag"]', isError: true }
    ],
    explanation: "Use Enum values or declared string constants to prevent typo bugs.",
    suggestedFixLines: [
      { lineNum: 73, text: 'status = payload[PayloadKeys.ACTIVE_USER]', prefix: '+' }
    ],
    fixSnippet: 'status = payload[PayloadKeys.ACTIVE_USER]'
  }
];
