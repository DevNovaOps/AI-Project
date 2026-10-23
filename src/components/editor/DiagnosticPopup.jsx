import React from 'react';
import { AlertCircle, X, Sparkles, Lightbulb, FlaskConical, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function DiagnosticPopup() {
  const { 
    isDiagnosticPopupOpen, closeDiagnosticPopup, 
    selectedIssueId, issues, applyFix, 
    setRightSidebarTab, appliedFixes 
  } = useAppStore();

  if (!isDiagnosticPopupOpen) return null;

  const issue = issues.find(i => i.id === selectedIssueId) || issues[0];
  const isApplied = appliedFixes.includes(issue.id);

  const handleFixWithAI = () => {
    applyFix(issue.id);
    setRightSidebarTab('fixes');
  };

  const handleExplain = () => {
    setRightSidebarTab('analysis');
  };

  const handleAddTest = () => {
    setRightSidebarTab('tests');
  };

  return (
    <div className="diagnostic-popup" role="alertdialog" aria-labelledby="diag-title">
      {/* Header */}
      <div className="diagnostic-header">
        <div className="diagnostic-tag">
          <AlertCircle size={14} color="var(--color-critical)" />
          <span>{issue.category || 'Runtime Error'}</span>
        </div>
        <button 
          className="editor-tab-close" 
          onClick={closeDiagnosticPopup}
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
          style={{ height: 28, fontSize: 11, padding: '0 8px' }}
          onClick={handleExplain}
        >
          <Lightbulb size={12} color="#38bdf8" />
          <span>Explain</span>
        </button>

        <button 
          className="btn btn-primary-gradient" 
          style={{ height: 28, fontSize: 11, padding: '0 10px', flex: 1 }}
          onClick={handleFixWithAI}
          disabled={isApplied}
        >
          {isApplied ? (
            <>
              <Check size={12} />
              <span>Fix Applied</span>
            </>
          ) : (
            <>
              <Sparkles size={12} />
              <span>Fix with AI</span>
            </>
          )}
        </button>

        <button 
          className="btn btn-secondary" 
          style={{ height: 28, fontSize: 11, padding: '0 8px' }}
          onClick={handleAddTest}
        >
          <FlaskConical size={12} color="#f97316" />
          <span>Add Test</span>
        </button>
      </div>
    </div>
  );
}
