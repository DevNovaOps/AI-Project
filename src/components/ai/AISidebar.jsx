import React, { useState } from 'react';
import {
  Sparkles, X, Maximize2, Minimize2, Send, CornerDownLeft,
  MessageSquare, Search, FlaskConical, Wrench, BarChart2, MoreHorizontal
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import AnalysisPanel from './AnalysisPanel';
import ChatPanel from './ChatPanel';
import TestsPanel from './TestsPanel';
import FixesPanel from './FixesPanel';
import ReportPreview from './ReportPreview';
import aetherionLogo from '../../assets/images/aetherion-logo.png';

export default function AISidebar() {
  const {
    isRightSidebarOpen, toggleRightSidebar,
    rightSidebarTab, setRightSidebarTab,
    activeFilePath
  } = useAppStore();

  const [bottomInput, setBottomInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isRightSidebarOpen) return null;

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'analysis', label: 'Analysis', icon: Search },
    { id: 'tests', label: 'Tests', icon: FlaskConical },
    { id: 'fixes', label: 'Fixes', icon: Wrench },
    { id: 'report', label: 'Report', icon: BarChart2 }
  ];

  const handleBottomPrompt = (promptText) => {
    setRightSidebarTab('chat');
  };

  const handleBottomSubmit = (e) => {
    e.preventDefault();
    if (!bottomInput.trim()) return;
    setRightSidebarTab('chat');
    setBottomInput('');
  };

  return (
    <aside
      className="ai-sidebar"
      style={{ width: isExpanded ? '520px' : '380px' }}
      aria-label="AETHERION AI Assistant"
    >
      {/* Header */}
      <div className="ai-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-logo-container" style={{ width: 32, height: 32, borderRadius: 7 }}>
            <img 
              src={aetherionLogo} 
              alt="AETHERION" 
              className="brand-logo-img" 
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.5px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>AETHERION</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Your autonomous debugging partner</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            className="icon-action-btn"
            style={{ width: 24, height: 24 }}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore Sidebar Size' : 'Expand Sidebar'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            className="icon-action-btn"
            style={{ width: 24, height: 24 }}
            onClick={toggleRightSidebar}
            title="Close AI Sidebar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Segmented Navigation Bar */}
      <div className="ai-nav-segmented">
        {tabs.map((tab) => {
          const isActive = rightSidebarTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`ai-seg-tab ${isActive ? 'active' : ''}`}
              onClick={() => setRightSidebarTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Panel Content */}
      <div className="ai-panel-content">
        {rightSidebarTab === 'chat' && <ChatPanel />}
        {rightSidebarTab === 'analysis' && <AnalysisPanel />}
        {rightSidebarTab === 'tests' && <TestsPanel />}
        {rightSidebarTab === 'fixes' && <FixesPanel />}
        {rightSidebarTab === 'report' && <ReportPreview />}
      </div>

      {/* Quick Prompt Bar at Bottom (matching reference images) */}
      {rightSidebarTab !== 'chat' && (
        <div className="ai-chat-input-bar">
          <form onSubmit={handleBottomSubmit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', padding: '0 8px', height: 32
            }}>
              <input
                type="text"
                placeholder="Ask anything about this code..."
                value={bottomInput}
                onChange={(e) => setBottomInput(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 11, outline: 'none' }}
              />
              <span className="kbd-badge" style={{ fontSize: 9 }}>Ctrl ↵</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary-gradient"
              style={{ width: 32, height: 32, padding: 0 }}
              title="Send to AI Assistant"
            >
              <Send size={13} />
            </button>
          </form>

          {/* Quick Action Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
            {[
              'Explain code',
              'Generate tests',
              'Refactor',
              'Optimize',
              'Add docs'
            ].map((chip, idx) => (
              <button
                key={idx}
                className="btn btn-secondary"
                style={{ height: 20, fontSize: 9, padding: '0 6px', whiteSpace: 'nowrap', borderRadius: 'var(--radius-full)' }}
                onClick={() => handleBottomPrompt(chip)}
              >
                {chip}
              </button>
            ))}
            <button className="icon-action-btn" style={{ width: 20, height: 20 }} title="More suggestions">
              <MoreHorizontal size={11} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
