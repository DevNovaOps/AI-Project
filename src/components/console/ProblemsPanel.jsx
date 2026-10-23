import React, { useState } from 'react';
import { Lightbulb, ExternalLink, Filter, Search, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function ProblemsPanel() {
  const { 
    issues, selectedIssueId, selectIssue, 
    setRightSidebarTab, appliedFixes 
  } = useAppStore();

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
      const match = item.message.toLowerCase().includes(filterText.toLowerCase()) || 
                    item.file.toLowerCase().includes(filterText.toLowerCase()) ||
                    item.source.toLowerCase().includes(filterText.toLowerCase());
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
            style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 11, outline: 'none' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="ide-table-wrapper" style={{ flex: 1 }}>
        <table className="ide-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th style={{ width: 100 }}>Severity</th>
              <th>Message</th>
              <th style={{ width: 90 }}>File</th>
              <th style={{ width: 50 }}>Line</th>
              <th style={{ width: 100 }}>Source</th>
              <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map((issue) => {
              const isSelected = selectedIssueId === issue.id;
              const isFixed = appliedFixes.includes(issue.id) || issue.status === 'Fixed';

              return (
                <tr 
                  key={issue.id}
                  className={isSelected ? 'selected' : ''}
                  onClick={() => selectIssue(issue.id)}
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{issue.num}</td>
                  <td>{getSeverityBadge(issue.severity, isFixed)}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: isFixed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {issue.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {issue.detail}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{issue.file}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{issue.line}</td>
                  <td>
                    <span style={{ 
                      fontSize: 11, 
                      color: issue.source === 'Runtime' ? 'var(--color-critical)' : 'var(--text-secondary)' 
                    }}>
                      {issue.source}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button 
                        className="icon-action-btn" 
                        style={{ width: 22, height: 22 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectIssue(issue.id);
                          setRightSidebarTab('analysis');
                        }}
                        title="Explain in AI Assistant"
                      >
                        <Lightbulb size={13} color="#eab308" />
                      </button>
                      <button 
                        className="icon-action-btn" 
                        style={{ width: 22, height: 22 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectIssue(issue.id);
                        }}
                        title="Jump to code location"
                      >
                        <ExternalLink size={13} color="#38bdf8" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
