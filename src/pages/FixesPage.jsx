import React, { useState } from 'react';
import { 
  Wrench, Sparkles, CheckCircle2, Undo2, Copy, Check, 
  FileCode, AlertTriangle, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import CodeDiff from '../components/editor/CodeDiff';

export default function FixesPage() {
  const { issues, selectedIssueId, selectIssue, applyFix, undoFix, appliedFixes, project } = useAppStore();
  const [selectedId, setSelectedId] = useState(selectedIssueId || 'ISSUE-01');

  const issue = issues.find(i => i.id === selectedId) || issues[0];
  const isApplied = appliedFixes.includes(issue.id) || issue.status === 'Fixed';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-badge" style={{ width: 32, height: 32 }}>
            <Wrench size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>AI Fixes &amp; Code Patches</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Deterministic automated patch proposals, AST validation, and unified diff review for {project.name}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {isApplied ? (
            <button 
              className="btn btn-secondary" 
              onClick={() => undoFix(issue.id)}
            >
              <Undo2 size={13} />
              <span>Undo Fix</span>
            </button>
          ) : (
            <button 
              className="btn btn-primary-gradient" 
              onClick={() => applyFix(issue.id)}
            >
              <Sparkles size={13} />
              <span>Apply Selected Fix</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Issue List on Left, Diff & Details on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: 16 }}>
        {/* Left: Issues List */}
        <div className="card" style={{ padding: '12px', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Detected Issues Requiring Fixes
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {issues.map((iss) => {
              const isSelected = selectedId === iss.id;
              const hasApplied = appliedFixes.includes(iss.id) || iss.status === 'Fixed';

              return (
                <div
                  key={iss.id}
                  className={`palette-item ${isSelected ? 'active' : ''}`}
                  style={{ 
                    padding: '10px 12px', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: 'var(--radius-sm)',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4
                  }}
                  onClick={() => setSelectedId(iss.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge badge-${iss.severity.toLowerCase()}`} style={{ fontSize: 9 }}>
                        {iss.severity}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>
                        {iss.title}
                      </span>
                    </div>

                    {hasApplied ? (
                      <span className="badge badge-success" style={{ fontSize: 9 }}>
                        <CheckCircle2 size={10} /> Applied
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: 9 }}>
                        Proposed
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {iss.file} • Line {iss.line}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Diff & Root Cause */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Issue Header Card */}
          <div className="card" style={{ gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {issue.title}
              </div>
              <span className="badge badge-success">Confidence: {issue.confidence}%</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {issue.detail}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
              <strong>Root Cause:</strong> {issue.rootCause}
            </div>
          </div>

          {/* Interactive Code Diff */}
          <CodeDiff issueId={issue.id} originalSnippet={issue.codeSnippet} fixedSnippet={issue.suggestedFix} />
        </div>
      </div>
    </div>
  );
}
