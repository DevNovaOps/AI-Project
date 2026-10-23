import React, { useState } from 'react';
import { GitBranch, GitCommit, Check, RefreshCw, FileCode, ArrowUpRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function SourceControlPage() {
  const { project, selectedBranch, appliedFixes } = useAppStore();
  const [commitMsg, setCommitMsg] = useState('fix(core): add defensive zero-division guard in calculate_average');
  const [committed, setCommitted] = useState(false);

  const hasChanges = appliedFixes.length > 0;

  const handleCommit = (e) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;
    setCommitted(true);
    setTimeout(() => setCommitted(false), 3000);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-badge" style={{ width: 32, height: 32 }}>
            <GitBranch size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Source Control (Git)</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Current Branch: <strong style={{ color: '#a855f7' }}>{selectedBranch}</strong> • Remote: origin/{selectedBranch}
            </p>
          </div>
        </div>
      </div>

      {/* Commit Box */}
      <div className="card" style={{ padding: '14px', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Commit Staged Changes
        </div>

        <form onSubmit={handleCommit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            rows={3}
            placeholder="Commit message (e.g. fix: resolve division by zero)..."
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            style={{ padding: '8px 10px', fontSize: 12, resize: 'none' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Press Ctrl+Enter to commit</span>
            <button 
              type="submit" 
              className="btn btn-primary-gradient" 
              style={{ height: 30, fontSize: 11 }}
            >
              <GitCommit size={13} />
              <span>{committed ? 'Committed to ' + selectedBranch : 'Commit & Push'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Changes list */}
      <div className="card" style={{ padding: '14px', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Working Tree Changes
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="palette-item" style={{ padding: '8px 12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCode size={14} color="#38bdf8" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>backend/main.py</span>
            </div>
            <span className="badge badge-warning" style={{ fontSize: 9 }}>M (Modified)</span>
          </div>

          <div className="palette-item" style={{ padding: '8px 12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCode size={14} color="#10b981" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>tests/test_main.py</span>
            </div>
            <span className="badge badge-success" style={{ fontSize: 9 }}>M (Verified)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
