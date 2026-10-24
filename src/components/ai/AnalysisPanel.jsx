import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AlertCircle, Lightbulb, CheckCircle2, ChevronRight, Copy, Check, 
  Sparkles, FlaskConical, ExternalLink, ShieldCheck, ChevronLeft, Play, FileCode,
  RefreshCw, Bug, Activity
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';

export default function AnalysisPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    selectedIssueId, issues, selectIssue, 
    applyFix, undoFix, appliedFixes, 
    setRightSidebarTab, openFileAtLine
  } = useAppStore();

  const { 
    startAutonomousWorkflow, workflowState, 
    activeAgent, progress, agentLogs 
  } = useWorkflowStore();
  const [copied, setCopied] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);

  const isRunning = ['planning', 'analyzing', 'diagnosing', 'generating_fix', 'running_tests', 'validating'].includes(workflowState);

  // Helper to inject a realistic demo defect and trigger AI analysis
  const handleInjectDemoBug = async () => {
    setIsInjecting(true);
    const store = useAppStore.getState();
    const activePath = store.activeFilePath;
    const currentFile = activePath ? store.files[activePath] : null;

    const demoSnippet = `\n\n# --- INJECTED DEMO DEFECT FOR AI DEBUGGER ---\ndef calculate_system_metrics(total_items, error_count=0, cached_results=[]):\n    """Sample defect function for testing AETHERION 5-Agent Pipeline."""\n    if error_count == None:\n        error_count = 0\n    # Intentional ZeroDivisionError runtime defect:\n    return total_items / 0\n\n# Multi-language syntax & operator defects:\nif lenn([1, 2, 3]) ==== 0:\n    System.out.println("Invalid Java print in Python")\n`;

    try {
      if (currentFile && activePath) {
        const updatedContent = (currentFile.content || '') + demoSnippet;
        store.updateFileContent(activePath, updatedContent);
        store.addNotification({
          title: 'Demo Defect Injected',
          message: `Injected sample defect into ${activePath.split('/').pop()}. Starting 5-Agent AI pipeline...`,
          type: 'info'
        });
      } else {
        const demoPath = 'demo_defect.py';
        store.updateFileContent(demoPath, demoSnippet.trim());
        await store.openTab(demoPath);
        store.addNotification({
          title: 'Demo Defect Created',
          message: 'Created demo_defect.py with sample defects. Starting 5-Agent AI pipeline...',
          type: 'info'
        });
      }

      setTimeout(() => {
        setIsInjecting(false);
        startAutonomousWorkflow();
      }, 200);
    } catch (e) {
      setIsInjecting(false);
      console.error('Failed to inject demo defect:', e);
    }
  };

  // State 1: Active 5-Agent Workflow Running
  if (isRunning) {
    const latestLog = agentLogs && agentLogs.length > 0 ? agentLogs[agentLogs.length - 1] : null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          padding: '20px 14px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 12
        }}>
          <div style={{
            position: 'relative',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div className="animate-spin" style={{
              position: 'absolute',
              width: 44,
              height: 44,
              border: '2px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38bdf8',
              borderRadius: '50%'
            }} />
            <Activity size={22} color="#38bdf8" />
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeAgent || '5-Agent Pipeline Working'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Running AST static checks, root cause diagnosis, and verification...
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
              <span>Autonomous Progress</span>
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>{progress || 35}%</span>
            </div>
            <div style={{ width: '100%', height: 4, background: 'var(--bg-input)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${progress || 35}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Live log card */}
        {latestLog && (
          <div className="card" style={{ padding: '10px 12px', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
              <span className="status-dot-active" />
              <span>{latestLog.agent} Agent</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {latestLog.message}
            </div>
          </div>
        )}
      </div>
    );
  }

  // State 2: Workflow Completed with 0 issues (Code Verified Clean!)
  if (workflowState === 'completed' && issues.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Verification Status Banner */}
        <div style={{
          padding: '18px 14px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(56, 189, 248, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 10,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)'
          }}>
            <ShieldCheck size={24} color="#10b981" />
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Analysis Complete: Code Verified
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
              The 5-Agent pipeline analyzed your target files. Zero syntax defects, runtime bugs, or security vulnerabilities were detected.
            </div>
          </div>

          {/* Health Score Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            background: 'rgba(16, 185, 129, 0.15)',
            borderRadius: 20,
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: 11,
            fontWeight: 700,
            color: '#10b981'
          }}>
            <CheckCircle2 size={13} />
            <span>Health Score: 100/100 (Grade A+)</span>
          </div>
        </div>

        {/* Audit Breakdown Checklist */}
        <div className="card" style={{ padding: '12px', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Verification Checklist
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <Check size={12} color="#10b981" /> AST Syntax &amp; Grammar
              </span>
              <span className="badge badge-success">0 Errors</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <Check size={12} color="#10b981" /> Security &amp; Secrets Guard
              </span>
              <span className="badge badge-success">Clean</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <Check size={12} color="#10b981" /> Delimiters &amp; Structure
              </span>
              <span className="badge badge-success">Balanced</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                <Check size={12} color="#10b981" /> 5-Agent Validation Suite
              </span>
              <span className="badge badge-success">100% Passed</span>
            </div>
          </div>
        </div>

        {/* Demo Bug CTA Box */}
        <div style={{
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#38bdf8' }}>
            <Bug size={13} />
            <span>Want to test the AI Repair Engine?</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Inject a sample bug into the code to see AETHERION detect root causes, generate patch diffs, and perform 1-click repairs.
          </div>
          <button
            className="btn btn-primary-gradient"
            onClick={handleInjectDemoBug}
            disabled={isInjecting}
            style={{ height: 32, fontSize: 11 }}
          >
            <Bug size={12} />
            <span>{isInjecting ? 'Injecting...' : 'Inject Demo Defect & Auto-Repair'}</span>
          </button>
        </div>

        {/* Re-run button */}
        <button
          className="btn btn-secondary"
          onClick={startAutonomousWorkflow}
          style={{ height: 30, fontSize: 11 }}
        >
          <RefreshCw size={12} />
          <span>Re-run Autonomous Analysis</span>
        </button>
      </div>
    );
  }

  // State 3: Pre-Analysis / Idle state
  if (issues.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '36px 16px', textAlign: 'center', gap: 14, color: 'var(--text-muted)'
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--bg-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)'
        }}>
          <Sparkles size={22} color="#38bdf8" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Autonomous 5-Agent Analysis
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
            Run the 5-Agent pipeline to perform deep AST static analysis, diagnose root causes, and propose verified patches.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
          <button
            className="btn btn-primary-gradient"
            onClick={startAutonomousWorkflow}
            disabled={workflowState !== 'idle' && workflowState !== 'completed' && workflowState !== 'failed'}
            style={{ height: 34, fontSize: 11, width: '100%' }}
          >
            <Play size={12} fill="#ffffff" />
            <span>Start Autonomous Analysis</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleInjectDemoBug}
            disabled={isInjecting}
            style={{ height: 32, fontSize: 11, width: '100%' }}
            title="Inject a realistic defect to test the AI diagnosis and auto-repair engine"
          >
            <Bug size={12} />
            <span>{isInjecting ? 'Injecting...' : 'Test with Demo Defect'}</span>
          </button>
        </div>
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

  const handleOpenFile = async () => {
    const targetFile = issue.filePath || issue.file || 'file.py';
    if (location.pathname !== '/' && location.pathname !== '/editor') {
      navigate('/');
    }
    if (openFileAtLine) {
      await openFileAtLine(targetFile, issue.line || 1, issue.col || 1);
    }
    selectIssue(issue.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Context Pill */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border-subtle)', fontSize: 11 
      }}>
        <button
          onClick={handleOpenFile}
          className="context-file-pill-btn"
          title={`Click to open ${issue.file || issue.filePath} at line ${issue.line} in Monaco Editor`}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--text-primary)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <FileCode size={13} color="#38bdf8" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {issue.file || issue.filePath}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Line {issue.line}</span>
          <ExternalLink size={10} color="#38bdf8" style={{ opacity: 0.8, marginLeft: 2 }} />
        </button>

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
