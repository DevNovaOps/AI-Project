import React, { useState } from 'react';
import {
  AlertCircle, AlertTriangle, Info, Check, Copy, ChevronLeft, ChevronRight,
  Sparkles, FlaskConical, Lightbulb, ChevronDown
} from 'lucide-react';

export default function IssueDetailsPanel({
  issue,
  currentIndex = 1,
  totalCount = 24,
  onPrev,
  onNext,
  onApplyFix,
  onAddToTests,
  onExplain,
  isFixed = false
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFix, setCopiedFix] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  if (!issue) return null;

  const handleCopyCode = () => {
    let raw = '';
    if (Array.isArray(issue.codeSnippet)) {
      raw = issue.codeSnippet.map(l => (typeof l === 'string' ? l : l.text || '')).join('\n');
    } else if (typeof issue.codeSnippet === 'string') {
      raw = issue.codeSnippet;
    } else {
      raw = issue.evidence || issue.detail || issue.message || '';
    }
    navigator.clipboard.writeText(raw);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyFix = () => {
    let raw = '';
    if (typeof issue.suggestedFix === 'string' && issue.suggestedFix) {
      raw = issue.suggestedFix;
    } else if (typeof issue.fixSnippet === 'string' && issue.fixSnippet) {
      raw = issue.fixSnippet;
    } else if (Array.isArray(issue.suggestedFixLines)) {
      raw = issue.suggestedFixLines.map(l => (typeof l === 'string' ? l : l.text || '')).join('\n');
    }
    navigator.clipboard.writeText(raw);
    setCopiedFix(true);
    setTimeout(() => setCopiedFix(false), 2000);
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="badge badge-critical" style={{ padding: '3px 8px' }}>
            <AlertCircle size={12} />
            <span>Critical</span>
          </span>
        );
      case 'High':
        return (
          <span className="badge badge-warning" style={{ padding: '3px 8px' }}>
            <AlertTriangle size={12} />
            <span>High</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="badge badge-medium" style={{ padding: '3px 8px' }}>
            <Info size={12} />
            <span>Medium</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-low" style={{ padding: '3px 8px' }}>
            <span>Low</span>
          </span>
        );
    }
  };

  return (
    <div
      className="card"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        height: '100%',
        minHeight: 450,
        boxSizing: 'border-box'
      }}
    >
      {/* Header: Severity Badge on Left, Position & Navigation on Right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          {getSeverityBadge(issue.severity)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', userSelect: 'none' }}>
            {currentIndex} of {totalCount}
          </span>
          <button
            className="icon-action-btn"
            style={{ width: 20, height: 20, backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}
            onClick={onPrev}
            title="Previous issue"
          >
            <ChevronLeft size={12} color="var(--text-secondary)" />
          </button>
          <button
            className="icon-action-btn"
            style={{ width: 20, height: 20, backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}
            onClick={onNext}
            title="Next issue"
          >
            <ChevronRight size={12} color="var(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {issue.title}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.35 }}>
          {issue.detail}
        </div>
      </div>

      {/* Metadata Pill Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 10.5 }}>
        {/* Python File */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '1px 6px', backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--text-primary)'
        }}>
          <span>🐍</span>
          <span style={{ fontWeight: 600 }}>{issue.file}</span>
        </div>

        {/* Line */}
        <span style={{ color: 'var(--text-muted)' }}>
          Line {issue.line}
        </span>

        {/* Category Badge */}
        <span className="badge-runtime-error" style={{ fontSize: 9.5, padding: '1px 6px' }}>
          {issue.category || 'Runtime Error'}
        </span>

        {/* Status Dropdown */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <button
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            style={{
              padding: '1px 6px',
              backgroundColor: isFixed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: isFixed ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 4,
              color: isFixed ? '#10b981' : '#ef4444',
              fontSize: 9.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: isFixed ? '#10b981' : '#ef4444' }} />
            <span>{isFixed ? 'Fixed' : 'Open'}</span>
            <ChevronDown size={10} />
          </button>

          {statusDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                width: 90,
                backgroundColor: 'var(--bg-dropdown)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: 4,
                zIndex: 20,
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div
                onClick={() => { setStatusDropdownOpen(false); }}
                style={{ padding: '4px 6px', fontSize: 10, color: '#ef4444', cursor: 'pointer', borderRadius: 4 }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card-hover)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ● Open
              </div>
              <div
                onClick={() => { setStatusDropdownOpen(false); if (onApplyFix) onApplyFix(issue.id); }}
                style={{ padding: '4px 6px', fontSize: 10, color: '#10b981', cursor: 'pointer', borderRadius: 4 }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-card-hover)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ● Fixed
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code Snippet Box */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-primary)' }}>Code Snippet</span>
          <button
            onClick={handleCopyCode}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: 'transparent', border: 'none',
              color: 'var(--text-secondary)', fontSize: 9.5, cursor: 'pointer'
            }}
          >
            {copiedCode ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-code-block)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4,
          padding: '4px 8px',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          lineHeight: 1.45,
          color: 'var(--text-primary)'
        }}>
          {(() => {
            let lines = [];
            if (Array.isArray(issue.codeSnippet)) {
              lines = issue.codeSnippet;
            } else if (typeof issue.codeSnippet === 'string' && issue.codeSnippet.trim()) {
              lines = issue.codeSnippet.split('\n').map((text, idx) => ({
                lineNum: (issue.line || 1) + idx,
                text,
                isError: true
              }));
            } else if (typeof issue.evidence === 'string' && issue.evidence.trim()) {
              lines = issue.evidence.split('\n').map((text, idx) => ({
                lineNum: (issue.line || 1) + idx,
                text,
                isError: true
              }));
            } else {
              lines = [
                { lineNum: issue.line || 1, text: issue.detail || issue.title || 'Code inspection required', isError: true }
              ];
            }
            return lines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  backgroundColor: line.isError ? 'rgba(239, 68, 68, 0.16)' : 'transparent',
                  borderRadius: 2,
                  padding: '0 2px',
                  color: line.isError ? '#ef4444' : 'var(--text-primary)'
                }}
              >
                <span style={{ color: 'var(--text-muted)', width: 22, userSelect: 'none' }}>
                  {line.lineNum || (idx + 1)}
                </span>
                <span style={{ color: line.isError ? '#ef4444' : 'transparent', width: 10, userSelect: 'none' }}>
                  {line.isError ? '>' : ''}
                </span>
                <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {typeof line === 'string' ? line : (line.text || '')}
                </span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Explanation Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <Info size={12} color="#38bdf8" />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-primary)' }}>Explanation</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {issue.explanation || issue.detail || issue.rootCause || "Analysis identified a defect requiring defensive validation."}
        </div>
      </div>

      {/* Suggested Fix Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900
            }}>
              ✓
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-primary)' }}>Suggested Fix</span>
          </div>

          <button
            onClick={handleCopyFix}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: 'transparent', border: 'none',
              color: 'var(--text-secondary)', fontSize: 9.5, cursor: 'pointer'
            }}
          >
            {copiedFix ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
            <span>{copiedFix ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-code-block)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4,
          padding: '4px 8px',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          lineHeight: 1.45,
          color: 'var(--text-primary)'
        }}>
          {(() => {
            let lines = [];
            if (Array.isArray(issue.suggestedFixLines)) {
              lines = issue.suggestedFixLines;
            } else if (typeof issue.suggestedFix === 'string' && issue.suggestedFix.trim()) {
              lines = issue.suggestedFix.split('\n').map((text, idx) => ({
                lineNum: (issue.line || 1) + idx,
                text,
                prefix: '+'
              }));
            } else if (typeof issue.fixSnippet === 'string' && issue.fixSnippet.trim()) {
              lines = issue.fixSnippet.split('\n').map((text, idx) => ({
                lineNum: (issue.line || 1) + idx,
                text,
                prefix: '+'
              }));
            } else {
              lines = [
                { lineNum: issue.line || 1, text: '// Automated defensive fix recommended', prefix: '+' }
              ];
            }
            return lines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  color: line.prefix === '+' ? '#10b981' : (line.prefix === '>' ? '#ef4444' : 'var(--text-primary)'),
                  backgroundColor: line.prefix === '+' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                  borderRadius: 2,
                  padding: '0 2px'
                }}
              >
                <span style={{ color: 'var(--text-muted)', width: 22, userSelect: 'none' }}>
                  {line.lineNum || (idx + 1)}
                </span>
                <span style={{ color: line.prefix === '+' ? '#10b981' : '#ef4444', width: 10, userSelect: 'none' }}>
                  {line.prefix || '+'}
                </span>
                <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {typeof line === 'string' ? line : (line.text || '')}
                </span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 1fr', gap: 6, marginTop: 'auto', paddingTop: 2 }}>
        <button
          className="btn btn-primary-gradient"
          style={{ height: 28, fontSize: 10.5, padding: '0 6px', gap: 4 }}
          onClick={() => onApplyFix && onApplyFix(issue.id)}
        >
          {isFixed ? (
            <>
              <Check size={12} />
              <span>Fix Applied</span>
            </>
          ) : (
            <>
              <Sparkles size={12} />
              <span>Apply Fix</span>
            </>
          )}
        </button>

        <button
          className="btn btn-secondary"
          style={{ height: 28, fontSize: 10.5, padding: '0 6px', gap: 4 }}
          onClick={() => onAddToTests && onAddToTests(issue)}
        >
          <FlaskConical size={12} />
          <span>Add to Tests</span>
        </button>

        <button
          className="btn btn-secondary"
          style={{ height: 28, fontSize: 10.5, padding: '0 6px', gap: 4 }}
          onClick={() => onExplain && onExplain(issue)}
        >
          <Lightbulb size={12} />
          <span>Explain</span>
        </button>
      </div>

    </div>
  );
}
