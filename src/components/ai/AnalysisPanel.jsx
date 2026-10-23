import React, { useState } from 'react';
import { 
  AlertCircle, Lightbulb, CheckCircle2, ChevronRight, Copy, Check, 
  Sparkles, FlaskConical, ExternalLink, ShieldCheck, ChevronLeft
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function AnalysisPanel() {
  const { 
    selectedIssueId, issues, selectIssue, 
    applyFix, undoFix, appliedFixes, 
    setRightSidebarTab 
  } = useAppStore();

  const [copied, setCopied] = useState(false);

  const issue = issues.find(i => i.id === selectedIssueId) || issues[0];
  const isApplied = appliedFixes.includes(issue.id) || issue.status === 'Fixed';

  const handleCopy = () => {
    navigator.clipboard.writeText(issue.suggestedFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrevIssue = () => {
    const currentIndex = issues.findIndex(i => i.id === issue.id);
    if (currentIndex > 0) {
      selectIssue(issues[currentIndex - 1].id);
    }
  };

  const handleNextIssue = () => {
    const currentIndex = issues.findIndex(i => i.id === issue.id);
    if (currentIndex < issues.length - 1) {
      selectIssue(issues[currentIndex + 1].id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Context Pill */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border-subtle)', fontSize: 11 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>🐍</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{issue.file}</span>
          <span style={{ color: 'var(--text-muted)' }}>Line {issue.line}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge badge-critical" style={{ fontSize: 10, padding: '1px 6px' }}>
            {issue.category || 'Runtime Error'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button 
              className="icon-action-btn" 
              style={{ width: 20, height: 20 }}
              onClick={handlePrevIssue}
              title="Previous Issue"
            >
              <ChevronLeft size={12} />
            </button>
            <button 
              className="icon-action-btn" 
              style={{ width: 20, height: 20 }}
              onClick={handleNextIssue}
              title="Next Issue"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Issue Card */}
      <div className="issue-banner-card">
        <div className="issue-banner-header">
          <div className="issue-banner-icon">
            <AlertCircle size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {issue.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
              {issue.detail}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="issue-banner-badges">
          <span className="badge badge-critical">
            <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'currentColor' }} />
            {issue.severity}
          </span>
          <span className="badge badge-warning">
            {issue.source || 'Runtime Error'}
          </span>
          <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
            Confidence <span style={{ fontWeight: 700 }}>{issue.confidence}%</span>
          </span>
        </div>
      </div>

      {/* Section: Root Cause */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          <Lightbulb size={14} color="#38bdf8" />
          <span>Root Cause</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {issue.rootCause || 'The function does not handle the case when the input list is empty. Division by zero occurs when len(numbers) is 0.'}
        </div>
      </div>

      {/* Section: Suggested Fix */}
      <div className="card" style={{ gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            <CheckCircle2 size={14} color="var(--color-success)" />
            <span>Suggested Fix</span>
          </div>
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22 }}
            onClick={handleCopy}
            title="Copy fix code"
          >
            {copied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
          </button>
        </div>

        {/* Code Snippet Box */}
        <div style={{ 
          backgroundColor: 'var(--bg-code-block)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '8px 10px', 
          fontFamily: 'var(--font-mono)', 
          fontSize: 11,
          lineHeight: 1.5,
          color: 'var(--text-secondary)'
        }}>
          <div><span style={{ color: 'var(--text-muted)', marginRight: 10 }}>1</span><span className="token-keyword">def</span> <span className="token-function">calculate_average</span>(numbers):</div>
          <div><span style={{ color: 'var(--text-muted)', marginRight: 10 }}>2</span>    <span className="token-keyword">if</span> <span className="token-function">len</span>(numbers) == <span className="token-number">0</span>:</div>
          <div><span style={{ color: 'var(--text-muted)', marginRight: 10 }}>3</span>        <span className="token-keyword">return</span> <span className="token-number">0</span></div>
          <div><span style={{ color: 'var(--text-muted)', marginRight: 10 }}>4</span>    <span className="token-keyword">return</span> <span className="token-function">sum</span>(numbers) / <span className="token-function">len</span>(numbers)</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {isApplied ? (
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1.5, height: 32 }}
            onClick={() => undoFix(issue.id)}
          >
            <Check size={13} color="var(--color-success)" />
            <span>Fix Applied (Undo)</span>
          </button>
        ) : (
          <button 
            className="btn btn-primary-gradient" 
            style={{ flex: 1.5, height: 32 }}
            onClick={() => applyFix(issue.id)}
          >
            <Sparkles size={13} />
            <span>Apply Fix</span>
          </button>
        )}

        <button 
          className="btn btn-secondary" 
          style={{ flex: 1, height: 32 }}
          onClick={() => setRightSidebarTab('tests')}
          title="Run test case for this fix"
        >
          <FlaskConical size={13} color="#f97316" />
          <span>Add to Tests</span>
        </button>

        <button 
          className="btn btn-secondary" 
          style={{ width: 36, height: 32, padding: 0 }}
          onClick={() => setRightSidebarTab('chat')}
          title="Ask AI in Chat"
        >
          <Lightbulb size={14} color="#38bdf8" />
        </button>
      </div>

      {/* Additional Suggestions */}
      <div className="card" style={{ gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          <ShieldCheck size={14} color="#38bdf8" />
          <span>Additional Suggestions</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(issue.additionalSuggestions || [
            { id: 'sugg-1', title: 'Add input type validation', badge: 'Warning', type: 'warning' },
            { id: 'sugg-2', title: 'Add docstring', badge: 'Info', type: 'info' },
            { id: 'sugg-3', title: 'Handle non-numeric values', badge: 'Info', type: 'info' }
          ]).map((sugg) => (
            <div 
              key={sugg.id} 
              className="palette-item"
              style={{ 
                padding: '6px 8px', 
                background: 'var(--bg-card-subtle)', 
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {sugg.title}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={sugg.type === 'warning' ? 'badge badge-warning' : 'badge badge-info'} style={{ fontSize: 9 }}>
                  {sugg.badge}
                </span>
                <ChevronRight size={12} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
