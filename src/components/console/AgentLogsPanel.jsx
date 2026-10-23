import React from 'react';
import { Bot, Code, Search, Wrench, CheckCircle, Trash2, Clock, AlertTriangle, Info, Play } from 'lucide-react';
import { useWorkflowStore } from '../../store/useWorkflowStore';

export default function AgentLogsPanel() {
  const { agentLogs, clearLogs, workflowState, activeAgent, startAutonomousWorkflow } = useWorkflowStore();

  const getAgentIcon = (name = '') => {
    if (name.includes('Planner')) return <Bot size={13} color="#38bdf8" />;
    if (name.includes('Code Analysis') || name.includes('AST') || name.includes('Ruff')) return <Code size={13} color="#a855f7" />;
    if (name.includes('Diagnosis')) return <Search size={13} color="#06b6d4" />;
    if (name.includes('Fix') || name.includes('Repair')) return <Wrench size={13} color="#10b981" />;
    return <CheckCircle size={13} color="#38bdf8" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <span className="badge badge-success">OK</span>;
      case 'warning':
        return <span className="badge badge-warning">WARN</span>;
      case 'critical':
      case 'failed':
        return <span className="badge badge-critical">FAIL</span>;
      default:
        return <span className="badge badge-info">INFO</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
          <span>Multi-Agent Event Stream</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>{agentLogs.length} Events Logged</span>
          {activeAgent && (
            <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="animate-spin" style={{ width: 8, height: 8, border: '1.5px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%' }} />
              Active: {activeAgent}
            </span>
          )}
        </div>

        {agentLogs.length > 0 && (
          <button 
            className="btn btn-secondary" 
            style={{ height: 22, fontSize: 10, padding: '0 6px' }}
            onClick={clearLogs}
            title="Clear Logs"
          >
            <Trash2 size={11} />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* Logs Table or Empty State */}
      <div className="ide-table-wrapper" style={{ flex: 1 }}>
        {agentLogs.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 8, color: 'var(--text-muted)', padding: '24px', textAlign: 'center'
          }}>
            <Bot size={32} color="var(--border-focus)" />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              No Agent Events Logged
            </div>
            <div style={{ fontSize: 11 }}>
              Start an autonomous analysis session to watch Planner, Code Analysis, Diagnosis, Fix &amp; Test, and Validation stream their reasoning.
            </div>
            <button
              className="btn btn-primary-gradient"
              style={{ height: 28, fontSize: 11, marginTop: 4 }}
              onClick={startAutonomousWorkflow}
            >
              <Play size={11} fill="#ffffff" />
              <span>Run Autonomous Pipeline</span>
            </button>
          </div>
        ) : (
          <table className="ide-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Time</th>
                <th style={{ width: 140 }}>Agent</th>
                <th>Activity Description</th>
                <th style={{ width: 60 }}>Status</th>
                <th style={{ width: 80, textAlign: 'right' }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {agentLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {log.time}
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 11, color: 'var(--text-primary)' }}>
                      {getAgentIcon(log.agent)}
                      <span>{log.agent}</span>
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {log.message}
                  </td>
                  <td>{getStatusBadge(log.status)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {log.duration || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
