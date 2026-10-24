import React, { useState } from 'react';
import {
  Search, Filter, ChevronDown, MoreHorizontal, Eye, Lightbulb,
  AlertCircle, AlertTriangle, Info, CheckCircle2, ArrowDown, ArrowUp
} from 'lucide-react';

export default function IssueTable({
  issues,
  selectedIssueId,
  onSelectIssue,
  onExplainIssue,
  onViewInEditor
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'severity'
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Filter calculations
  const totalCount = issues.length;
  const criticalCount = issues.filter(i => i.severity === 'Critical').length;
  const highCount = issues.filter(i => i.severity === 'High').length;
  const mediumCount = issues.filter(i => i.severity === 'Medium').length;
  const lowCount = issues.filter(i => i.severity === 'Low').length;
  const fixedCount = issues.filter(i => i.status === 'Fixed').length;

  // Filter & Search processing
  const displayedIssues = issues.filter((item) => {
    // Category/Severity filter
    if (activeFilter === 'critical' && item.severity !== 'Critical') return false;
    if (activeFilter === 'high' && item.severity !== 'High') return false;
    if (activeFilter === 'medium' && item.severity !== 'Medium') return false;
    if (activeFilter === 'low' && item.severity !== 'Low') return false;
    if (activeFilter === 'fixed' && item.status !== 'Fixed') return false;

    // Search query across title, detail, file, category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDetail = item.detail?.toLowerCase().includes(q);
      const matchFile = item.file?.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDetail && !matchFile && !matchCat) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortOrder === 'newest') return (a.num || 0) - (b.num || 0);
    if (sortOrder === 'oldest') return (b.num || 0) - (a.num || 0);
    if (sortOrder === 'severity') {
      const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (rank[b.severity] || 0) - (rank[a.severity] || 0);
    }
    return 0;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="badge badge-critical">
            <AlertCircle size={11} />
            <span>Critical</span>
          </span>
        );
      case 'High':
        return (
          <span className="badge badge-warning">
            <AlertTriangle size={11} />
            <span>High</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="badge badge-medium">
            <Info size={11} />
            <span>Medium</span>
          </span>
        );
      case 'Low':
        return (
          <span className="badge badge-low">
            <ArrowDown size={11} />
            <span>Low</span>
          </span>
        );
      default:
        return <span className="badge badge-subtle">{severity}</span>;
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Runtime Error':
        return '#ef4444';
      case 'Logic':
      case 'Logic Issue':
        return '#f97316';
      case 'Code Quality':
        return '#06b6d4';
      case 'Best Practice':
        return '#a855f7';
      case 'Code Style':
        return '#8b5cf6';
      case 'Security':
        return '#10b981';
      case 'Performance':
        return '#a855f7';
      default:
        return '#8fa2be';
    }
  };

  return (
    <div
      className="card"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
        minHeight: 460
      }}
    >
      {/* Filter Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        {/* Filter Pills on the Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* All Issues */}
          <button
            onClick={() => setActiveFilter('all')}
            className={activeFilter === 'all' ? 'btn-primary-gradient' : 'btn-secondary'}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: activeFilter === 'all' ? 700 : 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <span>All Issues</span>
            <span
              style={{
                backgroundColor: activeFilter === 'all' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-card-subtle)',
                color: activeFilter === 'all' ? '#ffffff' : 'var(--text-primary)',
                padding: '1px 5px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700
              }}
            >
              {totalCount}
            </span>
          </button>

          {/* Critical */}
          <button
            onClick={() => setActiveFilter('critical')}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: activeFilter === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card-subtle)',
              border: activeFilter === 'critical' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <AlertCircle size={12} color="#ef4444" />
            <span>Critical</span>
            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
              {criticalCount}
            </span>
          </button>

          {/* High */}
          <button
            onClick={() => setActiveFilter('high')}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: activeFilter === 'high' ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-card-subtle)',
              border: activeFilter === 'high' ? '1px solid #f97316' : '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <AlertTriangle size={12} color="#f97316" />
            <span>High</span>
            <span style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)', color: '#f97316', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
              {highCount}
            </span>
          </button>

          {/* Medium */}
          <button
            onClick={() => setActiveFilter('medium')}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: activeFilter === 'medium' ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-card-subtle)',
              border: activeFilter === 'medium' ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <Info size={12} color="#06b6d4" />
            <span>Medium</span>
            <span style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
              {mediumCount}
            </span>
          </button>

          {/* Low */}
          <button
            onClick={() => setActiveFilter('low')}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: activeFilter === 'low' ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-card-subtle)',
              border: activeFilter === 'low' ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <ArrowDown size={12} color="#10b981" />
            <span>Low</span>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
              {lowCount}
            </span>
          </button>

          {/* Fixed */}
          <button
            onClick={() => setActiveFilter('fixed')}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: activeFilter === 'fixed' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card-subtle)',
              border: activeFilter === 'fixed' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={12} color="#10b981" />
            <span>Fixed</span>
            <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
              {fixedCount}
            </span>
          </button>
        </div>

        {/* Right Search and Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            padding: '4px 10px',
            width: 170
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 11,
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

          {/* Filter Funnel Icon */}
          <button
            className="icon-action-btn"
            style={{ width: 28, height: 28, backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}
            title="Filter configuration"
          >
            <Filter size={13} color="var(--text-secondary)" />
          </button>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              style={{
                height: 28,
                padding: '0 8px',
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer'
              }}
            >
              <span>{sortOrder === 'newest' ? 'Newest First' : (sortOrder === 'oldest' ? 'Oldest First' : 'By Severity')}</span>
              <ChevronDown size={12} color="var(--text-muted)" />
            </button>

            {sortDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  width: 130,
                  backgroundColor: 'var(--bg-dropdown)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: 4,
                  zIndex: 20,
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                }}
              >
                <div
                  onClick={() => { setSortOrder('newest'); setSortDropdownOpen(false); }}
                  style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 4 }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Newest First
                </div>
                <div
                  onClick={() => { setSortOrder('oldest'); setSortDropdownOpen(false); }}
                  style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 4 }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  Oldest First
                </div>
                <div
                  onClick={() => { setSortOrder('severity'); setSortDropdownOpen(false); }}
                  style={{ padding: '6px 8px', fontSize: 11, color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 4 }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  By Severity
                </div>
              </div>
            )}
          </div>

          {/* More Options */}
          <button
            className="icon-action-btn"
            style={{ width: 28, height: 28, backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}
            title="More Options"
          >
            <MoreHorizontal size={14} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
              <th style={{ padding: '8px 6px', width: 28, textAlign: 'center' }}>#</th>
              <th style={{ padding: '8px 10px', width: 95 }}>Severity</th>
              <th style={{ padding: '8px 10px' }}>Message</th>
              <th style={{ padding: '8px 10px', width: 85 }}>File</th>
              <th style={{ padding: '8px 6px', width: 45 }}>Line</th>
              <th style={{ padding: '8px 10px', width: 105 }}>Category</th>
              <th style={{ padding: '8px 10px', width: 75 }}>Status</th>
              <th style={{ padding: '8px 10px', width: 85 }}>Detected</th>
              <th style={{ padding: '8px 10px', width: 85, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedIssues.map((item, index) => {
              const isSelected = selectedIssueId === item.id;
              const rowNum = item.num || (index + 1);

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectIssue(item.id)}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #0070f3' : '3px solid transparent',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* # */}
                  <td style={{ padding: '8px 6px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                    {rowNum}
                  </td>

                  {/* Severity */}
                  <td style={{ padding: '8px 10px' }}>
                    {getSeverityBadge(item.severity)}
                  </td>

                  {/* Message */}
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>
                      {item.title}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>
                      {item.detail}
                    </div>
                  </td>

                  {/* File */}
                  <td style={{ padding: '8px 10px' }}>
                    <span
                      style={{ color: '#38bdf8', fontSize: 11, textDecoration: 'none', cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewInEditor) onViewInEditor(item.file, item.line);
                      }}
                      title={`Open ${item.file} in editor`}
                    >
                      {item.file}
                    </span>
                  </td>

                  {/* Line */}
                  <td style={{ padding: '8px 6px', color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {item.line}
                  </td>

                  {/* Category */}
                  <td style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: getCategoryColor(item.category) }}>
                    {item.category}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '8px 10px' }}>
                    {item.status === 'Fixed' ? (
                      <span className="badge badge-success" style={{ padding: '2px 8px' }}>
                        Fixed
                      </span>
                    ) : (
                      <span className="badge badge-critical" style={{ padding: '2px 8px' }}>
                        Open
                      </span>
                    )}
                  </td>

                  {/* Detected */}
                  <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 10, whiteSpace: 'nowrap' }}>
                    {item.detected || '10 mins ago'}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <button
                        className="icon-action-btn"
                        style={{ width: 22, height: 22 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewInEditor) onViewInEditor(item.file, item.line);
                        }}
                        title="View in Editor"
                      >
                        <Eye size={12} color="var(--text-secondary)" />
                      </button>

                      <button
                        className="icon-action-btn"
                        style={{ width: 22, height: 22 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onExplainIssue) onExplainIssue(item);
                        }}
                        title="Explain issue"
                      >
                        <Lightbulb size={12} color="#f59e0b" />
                      </button>

                      <button
                        className="icon-action-btn"
                        style={{ width: 22, height: 22 }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        title="Actions"
                      >
                        <MoreHorizontal size={12} color="var(--text-secondary)" />
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
