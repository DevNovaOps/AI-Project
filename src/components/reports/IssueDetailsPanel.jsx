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
    const raw = (issue.codeSnippet || []).map(l => l.text).join('\n') || issue.detail;
    navigator.clipboard.writeText(raw);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyFix = () => {
    const raw = issue.fixSnippet || (issue.suggestedFixLines || []).map(l => l.text).join('\n') || '';
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
      className="reports-card"
      style={{
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
          <span className="reports-text-muted" style={{ fontSize: 10.5, userSelect: 'none' }}>
            {currentIndex} of {totalCount}
          </span>
          <button 
            className="icon-action-btn reports-input-btn"
            style={{ width: 20, height: 20, borderRadius: 4, padding: 0, justifyContent: 'center' }}
            onClick={onPrev}
            title="Previous issue"
          >
            <ChevronLeft size={12} className="reports-sub-muted" />
          </button>
          <button 
            className="icon-action-btn reports-input-btn"
            style={{ width: 20, height: 20, borderRadius: 4, padding: 0, justifyContent: 'center' }}
            onClick={onNext}
            title="Next issue"
          >
            <ChevronRight size={12} className="reports-sub-muted" />
          </button>
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <div className="reports-heading" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
          {issue.title}
        </div>
        <div className="reports-text-muted" style={{ fontSize: 10.5, marginTop: 2, lineHeight: 1.35 }}>
          {issue.detail}
        </div>
      </div>

      {/* Metadata Pill Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 10.5 }}>
        {/* Python File */}
        <div className="reports-file-pill" style={{ 
          display: 'flex', alignItems: 'center', gap: 4, 
          fontSize: 10.5
        }}>
          <span>🐍</span>
          <span style={{ fontWeight: 600 }}>{issue.file}</span>
        </div>

        {/* Line */}
        <span className="reports-text-muted">
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
              className="reports-dropdown"
              style={{
                top: 'calc(100% + 4px)',
                right: 0,
                width: 90,
                zIndex: 20
              }}
            >
              <div 
                className="reports-dropdown-item"
                onClick={() => { setStatusDropdownOpen(false); }}
                style={{ padding: '4px 6px', fontSize: 10, color: '#ef4444' }}
              >
                ● Open
              </div>
              <div 
                className="reports-dropdown-item"
                onClick={() => { setStatusDropdownOpen(false); if (onApplyFix) onApplyFix(issue.id); }}
                style={{ padding: '4px 6px', fontSize: 10, color: '#10b981' }}
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
          <span className="reports-heading" style={{ fontSize: 10.5, fontWeight: 700 }}>Code Snippet</span>
          <button 
            onClick={handleCopyCode}
            className="reports-text-muted"
            style={{ 
              display: 'flex', alignItems: 'center', gap: 3, 
              background: 'transparent', border: 'none', 
              fontSize: 9.5, cursor: 'pointer' 
            }}
          >
            {copiedCode ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="reports-code-box" style={{ padding: '4px 8px' }}>
          {(issue.codeSnippet || [
            { lineNum: 3, text: 'def calculate_average(numbers):' },
            { lineNum: 4, text: '    if len(numbers) == 0:' },
            { lineNum: 5, text: '        return 0' },
            { lineNum: 6, text: '    return sum(numbers) / len(numbers)', isError: true }
          ]).map((line, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                backgroundColor: line.isError ? 'rgba(239, 68, 68, 0.16)' : 'transparent',
                borderRadius: 2,
                padding: '0 2px'
              }}
            >
              <span className="reports-code-gutter" style={{ width: 20 }}>
                {line.lineNum}
              </span>
              <span style={{ color: line.isError ? '#ef4444' : 'transparent', width: 10, userSelect: 'none' }}>
                {line.isError ? '>' : ''}
              </span>
              <span style={{ flex: 1, whiteSpace: 'pre', color: line.isError ? '#ef4444' : 'inherit' }}>
                {line.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <Info size={12} color="#38bdf8" />
          <span className="reports-heading" style={{ fontSize: 10.5, fontWeight: 700 }}>Explanation</span>
        </div>
        <div className="reports-text-muted" style={{ fontSize: 10, lineHeight: 1.4 }}>
          {issue.explanation || "The function doesn't handle the case when the input list is empty. When len(numbers) is 0, division by zero occurs."}
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
            <span className="reports-heading" style={{ fontSize: 10.5, fontWeight: 700 }}>Suggested Fix</span>
          </div>

          <button 
            onClick={handleCopyFix}
            className="reports-text-muted"
            style={{ 
              display: 'flex', alignItems: 'center', gap: 3, 
              background: 'transparent', border: 'none', 
              fontSize: 9.5, cursor: 'pointer' 
            }}
          >
            {copiedFix ? <Check size={10} color="#10b981" /> : <Copy size={10} />}
            <span>{copiedFix ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="reports-code-box" style={{ padding: '4px 8px' }}>
          {(issue.suggestedFixLines || [
            { lineNum: 3, text: '    def calculate_average(numbers):', prefix: '+' },
            { lineNum: 4, text: '        if len(numbers) == 0:', prefix: '+' },
            { lineNum: 5, text: '            return 0', prefix: '+' },
            { lineNum: 6, text: '        return sum(numbers) / len(numbers)', prefix: '>' }
          ]).map((line, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                color: line.prefix === '+' ? '#10b981' : (line.prefix === '>' ? '#ef4444' : 'inherit'),
                backgroundColor: line.prefix === '+' ? 'rgba(16, 185, 129, 0.12)' : (line.prefix === '>' ? 'rgba(239, 68, 68, 0.12)' : 'transparent'),
                borderRadius: 2,
                padding: '0 2px'
              }}
            >
              <span className="reports-code-gutter" style={{ width: 20 }}>
                {line.lineNum}
              </span>
              <span style={{ color: line.prefix === '+' ? '#10b981' : '#ef4444', width: 10, userSelect: 'none', fontWeight: 700 }}>
                {line.prefix}
              </span>
              <span style={{ flex: 1, whiteSpace: 'pre' }}>
                {line.text}
              </span>
            </div>
          ))}
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
