import React, { useState } from 'react';
import { 
  AlertCircle, Terminal, FlaskConical, FileText, Bug, 
  Bot, ChevronUp, ChevronDown, X, Maximize2, Minimize2 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import ProblemsPanel from './ProblemsPanel';
import TerminalPanel from './TerminalPanel';
import TestResultsPanel from './TestResultsPanel';
import AgentLogsPanel from './AgentLogsPanel';
import { OutputPanel, DebugConsolePanel } from './OutputPanel';

export default function BottomPanel() {
  const { 
    isConsoleOpen, toggleConsole, 
    consoleTab, setConsoleTab, 
    issues, testCases 
  } = useAppStore();

  const [isMaximized, setIsMaximized] = useState(false);

  if (!isConsoleOpen) return null;

  const openIssuesCount = issues.filter(i => i.status === 'Open').length;
  const failedTestsCount = testCases.filter(t => t.status === 'failed').length;

  const tabs = [
    { id: 'problems', label: 'Problems', icon: AlertCircle, count: openIssuesCount, badgeColor: openIssuesCount > 0 ? '#ef4444' : '#10b981' },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'testResults', label: 'Test Results', icon: FlaskConical, count: failedTestsCount, badgeColor: failedTestsCount > 0 ? '#f97316' : '#10b981' },
    { id: 'output', label: 'Output', icon: FileText },
    { id: 'debugConsole', label: 'Debug Console', icon: Bug },
    { id: 'agentLogs', label: 'Agent Logs', icon: Bot }
  ];

  return (
    <div 
      className="bottom-console" 
      style={{ height: isMaximized ? '480px' : '220px' }}
      role="region"
      aria-label="Developer Console"
    >
      {/* Tab bar */}
      <div className="console-tabs-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = consoleTab === tab.id;

            return (
              <button
                key={tab.id}
                className={`console-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setConsoleTab(tab.id)}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      backgroundColor: tab.badgeColor, 
                      color: '#ffffff', 
                      padding: '1px 5px', 
                      borderRadius: 'var(--radius-full)' 
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22 }}
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore Console Size' : 'Maximize Console'}
          >
            {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22 }}
            onClick={toggleConsole}
            title="Close Console (Ctrl+`)"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Console content */}
      <div className="console-body">
        {consoleTab === 'problems' && <ProblemsPanel />}
        {consoleTab === 'terminal' && <TerminalPanel />}
        {consoleTab === 'testResults' && <TestResultsPanel />}
        {consoleTab === 'output' && <OutputPanel />}
        {consoleTab === 'debugConsole' && <DebugConsolePanel />}
        {consoleTab === 'agentLogs' && <AgentLogsPanel />}
      </div>
    </div>
  );
}
