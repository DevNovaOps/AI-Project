import React, { useState } from 'react';
import { 
  Wrench, Sparkles, CheckCircle2, Undo2, Copy, Check, 
  FileCode, AlertTriangle, ShieldCheck, ChevronRight, Play 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import CodeDiff from '../components/editor/CodeDiff';

export default function FixesPage() {
  const navigate = useNavigate();
  const { issues, selectedIssueId, selectIssue, applyFix, undoFix, appliedFixes, project } = useAppStore();
  const [selectedId, setSelectedId] = useState(selectedIssueId || null);

  const issue = issues.find(i => i.id === (selectedId || selectedIssueId)) || issues[0] || null;
  const isApplied = issue ? (appliedFixes.includes(issue.id) || issue.status === 'Fixed') : false;

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

        {issue && (
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
                disabled={!issue.suggestedFix}
              >
                <Sparkles size={13} />
                <span>Apply Selected Fix</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content or Empty State */}
      {issues.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14
        }}>
          <Wrench size={38} color="var(--border-focus)" />
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              No Fix Proposals Generated Yet
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 460, margin: '6px auto 0', lineHeight: 1.5 }}>
              Execute the 5-Agent autonomous pipeline to detect code quality defects and generate deterministic unified diff repairs.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              className="btn btn-primary-gradient"
              onClick={() => {
                navigate('/');
              }}
              style={{ height: 34, padding: '0 20px', fontSize: 12 }}
            >
              <Sparkles size={13} style={{ marginRight: 6 }} />
              <span>Go to Editor &amp; Analyze</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: 16 }}>
          {/* Left: Issues List */}
          <div className="card" style={{ padding: '12px', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Detected Issues ({issues.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {issues.map((iss) => {
                const isSelected = (issue?.id === iss.id);
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
                    onClick={() => {
                      setSelectedId(iss.id);
                      selectIssue(iss.id);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge badge-${(iss.severity || 'medium').toLowerCase()}`} style={{ fontSize: 9 }}>
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
                      {iss.file || iss.filePath}:{iss.line} • {iss.category || 'Defect'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Code Diff & Details */}
          {issue ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="card" style={{ padding: '14px', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {issue.title}
                  </div>
                  <span className={`badge badge-${(issue.severity || 'medium').toLowerCase()}`}>
                    {issue.severity}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {issue.detail || issue.message}
                </div>
              </div>

              {/* Code Diff */}
              <CodeDiff 
                issueId={issue.id} 
                originalSnippet={issue.codeSnippet} 
                fixedSnippet={issue.suggestedFix} 
              />
            </div>
          ) : (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select an issue on the left to review its diff.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
