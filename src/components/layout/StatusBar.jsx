import React from 'react';
import { 
  GitBranch, AlertCircle, XCircle, CheckCircle, Cpu, HardDrive, 
  Clock, ShieldAlert, Sparkles, Terminal, SplitSquareVertical, Sliders
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { getLanguageInfo } from '../../utils/languages';

export default function StatusBar() {
  const { 
    project, selectedBranch, activeFilePath, 
    issues, testCases, activeLanguage,
    setConsoleTab, toggleConsole
  } = useAppStore();

  const { workflowState, activeAgent } = useWorkflowStore();

  const openIssuesCount = issues.filter(i => i.status === 'Open').length;
  const failedTestsCount = testCases.filter(t => t.status === 'failed').length;

  const getWorkflowBadge = () => {
    switch (workflowState) {
      case 'planning':
      case 'analyzing':
      case 'diagnosing':
      case 'generating_fix':
      case 'running_tests':
      case 'validating':
        return (
          <div className="status-badge" style={{ color: '#38bdf8' }}>
            <span className="animate-spin" style={{ width: 8, height: 8, border: '1.5px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <span>AI Agents: {activeAgent ? activeAgent.split(' ')[0] : 'Processing...'}</span>
          </div>
        );
      case 'completed':
        return (
          <div className="status-badge" style={{ color: '#10b981' }}>
            <CheckCircle size={12} color="#10b981" />
            <span>AI Agents: Validated</span>
          </div>
        );
      case 'failed':
        return (
          <div 
            className="status-badge cursor-pointer" 
            style={{ color: '#ef4444' }}
            title="Click to view Agent Logs in console"
            onClick={() => setConsoleTab('agentLogs')}
          >
            <AlertCircle size={12} color="#ef4444" />
            <span>AI Agents: Failed</span>
          </div>
        );
      default:
        return (
          <div className="status-badge" style={{ color: 'var(--text-secondary)' }}>
            <span className="status-dot-active" />
            <span>AI Agents: Ready</span>
          </div>
        );
    }
  };

  return (
    <footer className="status-bar" aria-label="Status Bar">
      {/* Left: Project path breadcrumbs & Diagnostic Counts */}
      <div className="status-group">
        <button 
          className="icon-action-btn" 
          style={{ width: 20, height: 20 }}
          onClick={toggleConsole}
          title="Toggle Terminal Console"
        >
          <Terminal size={12} />
        </button>

        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
          <span>{project.name}</span>
          <span>&gt;</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <GitBranch size={11} color="#a855f7" />
            {selectedBranch}
          </span>
          <span>&gt;</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            {activeFilePath ? activeFilePath.split('/').pop() : 'none'}
          </span>
        </span>

        {/* Issues Quick Badge */}
        <div 
          className="status-badge" 
          onClick={() => setConsoleTab('problems')}
          style={{ color: openIssuesCount > 0 ? '#ef4444' : '#10b981' }}
          title="Open Problems View"
        >
          {openIssuesCount > 0 ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
          <span>{openIssuesCount} Issues</span>
        </div>

        {/* Tests Quick Badge */}
        <div 
          className="status-badge" 
          onClick={() => setConsoleTab('testResults')}
          style={{ color: failedTestsCount > 0 ? '#f97316' : (testCases.length > 0 ? '#10b981' : 'var(--text-secondary)') }}
          title="Open Test Results View"
        >
          {failedTestsCount > 0 ? <XCircle size={12} /> : (testCases.length > 0 ? <CheckCircle size={12} /> : <Clock size={12} />)}
          <span>{testCases.length === 0 ? 'No Tests Run' : (failedTestsCount > 0 ? `${failedTestsCount} Tests Failed` : 'All Tests Passed')}</span>
        </div>
      </div>

      {/* Right: Telemetry & AI Status */}
      <div className="status-group">
        {/* Workflow State indicator */}
        {getWorkflowBadge()}

        <span style={{ color: 'var(--text-muted)' }}>{getLanguageInfo(activeLanguage).runtime}</span>
        <span style={{ color: 'var(--text-muted)' }}>UTF-8</span>
        <span style={{ color: 'var(--text-muted)' }}>Spaces: 4</span>
      </div>
    </footer>
  );
}
