import React, { useState } from 'react';
import { Lightbulb, ExternalLink, Filter, Search, CheckCircle, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';

export default function ProblemsPanel() {
  const { 
    issues, selectedIssueId, selectIssue, 
    setRightSidebarTab, appliedFixes 
  } = useAppStore();
  const { workflowState, activeAgent } = useWorkflowStore();

  const [severityFilter, setSeverityFilter] = useState('All');
  const [filterText, setFilterText] = useState('');

  const counts = {
    all: issues.length,
    errors: issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length,
    warnings: issues.filter(i => i.severity === 'Medium').length,
    info: issues.filter(i => i.severity === 'Low').length
  };

  const filteredIssues = issues.filter((item) => {
    if (severityFilter === 'Errors' && item.severity !== 'Critical' && item.severity !== 'High') return false;
    if (severityFilter === 'Warnings' && item.severity !== 'Medium') return false;
    if (severityFilter === 'Info' && item.severity !== 'Low') return false;
    if (filterText) {
      const match = (item.message || item.title || '').toLowerCase().includes(filterText.toLowerCase()) || 
                    (item.file || item.filePath || '').toLowerCase().includes(filterText.toLowerCase()) ||
                    (item.source || '').toLowerCase().includes(filterText.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity, isFixed) => {
    if (isFixed) {
      return (
        <span className="badge badge-success">
          <CheckCircle size={10} /> Fixed
        </span>
      );
    }
    switch (severity) {
      case 'Critical':
        return <span className="badge badge-critical">Critical</span>;
      case 'High':
        return <span className="badge badge-warning">High</span>;
      case 'Medium':
        return <span className="badge badge-medium">Medium</span>;
      case 'Low':
        return <span className="badge badge-low">Low</span>;
      default:
        return <span className="badge badge-subtle">{severity}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filters Bar */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        paddingBottom: 8, gap: 10, borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 
      }}>
        {/* Pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'All', label: `All (${counts.all})` },
            { id: 'Errors', label: `Errors (${counts.errors})` },
            { id: 'Warnings', label: `Warnings (${counts.warnings})` },
            { id: 'Info', label: `Info (${counts.info})` }
          ].map((pill) => (
            <button
              key={pill.id}
              className={`btn btn-secondary ${severityFilter === pill.id ? 'active' : ''}`}
              style={{ 
                height: 24, fontSize: 11, padding: '0 8px',
                borderColor: severityFilter === pill.id ? 'var(--border-focus)' : undefined,
                color: severityFilter === pill.id ? '#38bdf8' : undefined
              }}
              onClick={() => setSeverityFilter(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-input)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: 200 }}>
          <Search size={12} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter problems..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 11, outline: 'none', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Table or Empty State */}
      <div className="ide-table-wrapper" style={{ flex: 1 }}>
        {issues.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 8, color: 'var(--text-muted)', padding: '24px', textAlign: 'center'
          }}>
            {workflowState === 'completed' ? (
              <>
                <ShieldCheck size={32} color="#10b981" />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
                  Analysis Complete: 0 Problems Detected
                </div>
                <div style={{ fontSize: 11, maxWidth: 400, lineHeight: 1.4 }}>
                  ✓ Workspace code is 100% clean and verified across AST syntax, security rules, and structural integrity.
                </div>
              </>
            ) : ['planning', 'analyzing', 'diagnosing', 'generating_fix', 'running_tests', 'validating'].includes(workflowState) ? (
              <>
                <div className="animate-spin" style={{ width: 28, height: 28, border: '2px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8', borderRadius: '50%' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#38bdf8' }}>
                  AI Agents Analyzing Workspace...
                </div>
                <div style={{ fontSize: 11 }}>
                  Running AST static inspection and diagnostics in the background.
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 size={32} color="var(--color-success)" opacity={0.8} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  No problems detected in workspace
                </div>
                <div style={{ fontSize: 11 }}>
                  Click "Run with AI Agents" in the top bar to run full multi-agent code analysis.
                </div>
              </>
            )}
          </div>
        ) : (
          <table className="ide-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Severity</th>
                <th style={{ width: 140 }}>File &amp; Line</th>
                <th>Diagnostic Message</th>
                <th style={{ width: 100 }}>Rule / Tool</th>
                <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((item) => {
                const isSelected = selectedIssueId === item.id;
                const isFixed = appliedFixes.includes(item.id) || item.status === 'Fixed';

                return (
                  <tr 
                    key={item.id} 
                    className={isSelected ? 'selected' : ''}
                    onClick={() => selectIssue(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{getSeverityBadge(item.severity, isFixed)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)' }}>
                      {item.file || item.filePath}:{item.line}
                    </td>
                    <td style={{ fontSize: 11, color: isFixed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {item.title || item.message}
                    </td>
                    <td style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {item.source || 'AutonomusAI'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ height: 20, fontSize: 10, padding: '0 6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectIssue(item.id);
                          setRightSidebarTab('analysis');
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
