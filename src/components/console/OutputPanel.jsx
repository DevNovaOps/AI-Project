import React from 'react';

export function OutputPanel() {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ color: 'var(--text-muted)' }}>[2026-10-23 13:28:02] [info] Language Server Protocol (pyright) initialized in 214ms</div>
      <div style={{ color: 'var(--text-muted)' }}>[2026-10-23 13:28:02] [info] AegisVault AST indexer completed for 24 workspace files</div>
      <div style={{ color: '#38bdf8' }}>[2026-10-23 13:28:03] [diagnostics] Found 1 Critical error, 1 High warning, 2 Quality notices in backend/main.py</div>
      <div style={{ color: 'var(--color-critical)' }}>[2026-10-23 13:28:05] [runtime] ZeroDivisionError detected at line 6 col 12</div>
      <div style={{ color: 'var(--color-success)' }}>[2026-10-23 13:28:06] [ai-pipeline] Autonomous agent orchestrator ready for user trigger</div>
    </div>
  );
}

export function DebugConsolePanel() {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ color: 'var(--text-muted)' }}>pdb attached to process 4921 (Python 3.11.5)</div>
      <div style={{ color: 'var(--text-primary)' }}>&gt; backend/main.py(6)calculate_average()</div>
      <div style={{ color: 'var(--text-secondary)' }}>-&gt; return sum(numbers) / len(numbers)</div>
      <div style={{ color: '#38bdf8' }}>(Pdb) p numbers</div>
      <div style={{ color: 'var(--text-primary)' }}>[]</div>
      <div style={{ color: '#38bdf8' }}>(Pdb) p len(numbers)</div>
      <div style={{ color: 'var(--color-critical)' }}>0  &lt;-- Division by zero impending!</div>
    </div>
  );
}
