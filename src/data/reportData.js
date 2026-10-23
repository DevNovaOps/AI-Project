// Analytics, trends, and summary data for the Reports page

export const initialReportMetrics = {
  totalIssues: 4,
  criticalIssues: 1,
  fixedIssues: 1,
  filesScanned: 24,
  analysisTime: '2.1s',
  codeQuality: 86,
  testPassRate: 75, // 3 passed out of 4
  testCoverage: '84.6%',
  locScanned: 3420,
  agentsInvolved: 5
};

export const issueTrendsData = [
  { date: 'Oct 17', total: 18, critical: 4, fixed: 12, quality: 72 },
  { date: 'Oct 18', total: 15, critical: 3, fixed: 14, quality: 75 },
  { date: 'Oct 19', total: 12, critical: 2, fixed: 11, quality: 79 },
  { date: 'Oct 20', total: 9, critical: 2, fixed: 8, quality: 82 },
  { date: 'Oct 21', total: 7, critical: 1, fixed: 7, quality: 84 },
  { date: 'Oct 22', total: 5, critical: 1, fixed: 5, quality: 85 },
  { date: 'Today', total: 4, critical: 1, fixed: 3, quality: 86 }
];

export const severityDistributionData = [
  { name: 'Critical', value: 1, color: '#ef4444' },
  { name: 'High', value: 1, color: '#f97316' },
  { name: 'Medium', value: 1, color: '#06b6d4' },
  { name: 'Low', value: 1, color: '#a855f7' }
];

export const categoryBreakdownData = [
  { name: 'Runtime', count: 1, pct: 25 },
  { name: 'Logic', count: 1, pct: 25 },
  { name: 'Code Quality', count: 1, pct: 25 },
  { name: 'Best Practice', count: 1, pct: 25 }
];

export const agentPerformanceData = [
  { agent: 'Planner', avgTime: 0.32, accuracy: 98, tasks: 42 },
  { agent: 'Code Analysis', avgTime: 0.65, accuracy: 96, tasks: 128 },
  { agent: 'Diagnosis', avgTime: 0.48, accuracy: 94, tasks: 64 },
  { agent: 'Fix & Test', avgTime: 0.85, accuracy: 92, tasks: 53 },
  { agent: 'Validation', avgTime: 0.41, accuracy: 99, tasks: 48 }
];
