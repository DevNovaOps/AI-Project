import React, { useState } from 'react';
import { 
  AlertCircle, Lightbulb, CheckCircle2, ChevronRight, Copy, Check, 
  Sparkles, FlaskConical, ExternalLink, ShieldCheck, ChevronLeft, Play
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';

export default function AnalysisPanel() {
  const { 
    selectedIssueId, issues, selectIssue, 
    applyFix, undoFix, appliedFixes, 
    setRightSidebarTab 
  } = useAppStore();

  const { startAutonomousWorkflow, workflowState } = useWorkflowStore();
  const [copied, setCopied] = useState(false);

  if (issues.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', textAlign: 'center', gap: 14, color: 'var(--text-muted)'
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--bg-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)'
        }}>
          <Sparkles size={22} color="#38bdf8" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            No Analysis Findings
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
            Run the 5-Agent pipeline to perform deep AST static analysis, diagnose root causes, and propose verified patches.
          </div>
        </div>
        <button
          className="btn btn-primary-gradient"
          onClick={startAutonomousWorkflow}
          disabled={workflowState !== 'idle' && workflowState !== 'completed' && workflowState !== 'failed'}
          style={{ height: 32, fontSize: 11, padding: '0 16px' }}
        >
          <Play size={12} fill="#ffffff" />
          <span>Start Autonomous Analysis</span>
        </button>
      </div>
    );
  }

  const issue = issues.find(i => i.id === selectedIssueId) || issues[0];
  const isApplied = appliedFixes.includes(issue.id) || issue.status === 'Fixed';

  const handleCopy = () => {
    navigator.clipboard.writeText(issue.suggestedFix || issue.codeSnippet || '');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {issue.file || issue.filePath}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Line {issue.line}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge-runtime-error">
            {issue.category || 'Issue'}
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
            <span style={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>!</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {issue.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
              {issue.detail || issue.message}
            </div>
          </div>
        </div>

        <div className="issue-banner-badges">
          <span className={`badge badge-${(issue.severity || 'medium').toLowerCase()}`}>
            <AlertCircle size={11} />
            <span>{issue.severity}</span>
          </span>
          <span className="badge-runtime-error">
            <Lightbulb size={11} />
            <span>{issue.category || 'Static Analysis'}</span>
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Confidence</span>
            <span className="badge badge-success">
              {issue.confidence || 90}%
            </span>
          </div>
        </div>
      </div>

      {/* Section: Root Cause */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
          <Lightbulb size={14} color="#38bdf8" />
          <span>Root Cause Diagnosis</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {issue.rootCause || issue.detail || 'Analysis detected potential defect based on AST traversal and rule matching.'}
        </div>
      </div>

      {/* Section: Suggested Fix */}
      {issue.suggestedFix && (
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

          <div style={{
            backgroundColor: 'var(--bg-code-block)',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            maxHeight: 140,
            overflowY: 'auto'
          }}>
            {issue.suggestedFix}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {isApplied ? (
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, height: 32 }}
            onClick={() => undoFix(issue.id)}
          >
            Undo Applied Fix
          </button>
        ) : (
          <button 
            className="btn btn-primary-gradient" 
            style={{ flex: 1, height: 32 }}
            onClick={() => applyFix(issue.id)}
          >
            Apply Fix to Workspace
          </button>
        )}
      </div>
    </div>
  );
}
