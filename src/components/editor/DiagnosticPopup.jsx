import React from 'react';
import { AlertCircle, X, Sparkles, Lightbulb, FlaskConical, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function DiagnosticPopup({ style, onMouseEnter, onMouseLeave, onClose }) {
  const { 
    closeDiagnosticPopup, 
    selectedIssueId, issues, applyFix, 
    setRightSidebarTab, appliedFixes 
  } = useAppStore();

  const issue = issues.find(i => i.id === selectedIssueId) || issues[0];
  const isApplied = appliedFixes.includes(issue.id);

  const handleClose = (e) => {
    e?.stopPropagation();
    if (onClose) onClose();
    closeDiagnosticPopup();
  };

  const handleFixWithAI = () => {
    applyFix(issue.id);
    setRightSidebarTab('fixes');
    if (onClose) onClose();
  };

  const handleExplain = () => {
    setRightSidebarTab('analysis');
    if (onClose) onClose();
  };

  const handleAddTest = () => {
    setRightSidebarTab('tests');
    if (onClose) onClose();
  };

  return (
    <div 
      className="diagnostic-popup" 
      role="alertdialog" 
      aria-labelledby="diag-title"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="diagnostic-header">
        <div className="diagnostic-tag">
          <AlertCircle size={14} color="var(--color-critical)" />
          <span>{issue.category || 'Runtime Error'}</span>
        </div>
        <button 
          className="editor-tab-close" 
          onClick={handleClose}
          title="Dismiss Diagnostic Popup"
        >
          <X size={13} />
        </button>
      </div>

      {/* Title & Description */}
      <div>
        <div id="diag-title" className="diagnostic-title">{issue.title || 'Division by zero'}</div>
        <div className="diagnostic-desc">{issue.detail}</div>
      </div>

      {/* Code Snippet Preview */}
      <div className="diagnostic-code-box">
        <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>{issue.line || 6}</span>
        <span>
          return <span style={{ color: '#38bdf8' }}>sum</span>(numbers) <span style={{ color: '#f43f5e', fontWeight: 'bold' }}>/</span> <span style={{ color: '#38bdf8' }}>len</span>(numbers)
        </span>
      </div>

      {/* Actions */}
      <div className="diagnostic-actions">
        <button 
          className="btn btn-secondary" 
          style={{ height: 28, fontSize: 11, padding: '0 10px', gap: 5 }}
          onClick={handleExplain}
        >
          <Lightbulb size={13} color="#38bdf8" />
          <span>Explain</span>
        </button>

        <button 
          className="btn btn-primary-gradient" 
          style={{ height: 28, fontSize: 11, padding: '0 12px', flex: 1.2, gap: 6 }}
          onClick={handleFixWithAI}
          disabled={isApplied}
        >
          {isApplied ? (
            <>
              <Check size={13} />
              <span>Fix Applied</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Fix with AI</span>
            </>
          )}
        </button>

        <button 
          className="btn btn-secondary" 
          style={{ height: 28, fontSize: 11, padding: '0 10px', gap: 5 }}
          onClick={handleAddTest}
        >
          <FlaskConical size={13} color="#f97316" />
          <span>Add Test</span>
        </button>
      </div>
    </div>
  );
}
