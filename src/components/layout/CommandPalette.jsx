import React, { useState, useEffect } from 'react';
import { 
  Search, Play, Wrench, FlaskConical, BarChart2, Sun, Moon, 
  FileCode, Terminal, X, ArrowRight, Sparkles 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette() {
  const navigate = useNavigate();
  const { 
    isCommandPaletteOpen, setCommandPalette, 
    toggleTheme, setActiveFile, setRightSidebarTab, setConsoleTab,
    applyFix, issues
  } = useAppStore();
  const { startAutonomousWorkflow } = useWorkflowStore();

  const [query, setQuery] = useState('');

  // Keyboard shortcut listener for Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPalette(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPalette]);

  if (!isCommandPaletteOpen) return null;

  const commands = [
    {
      id: 'cmd-run-ai',
      title: 'Run with AI Agents',
      subtitle: 'Execute full 5-agent autonomous debugging and testing pipeline',
      icon: Sparkles,
      color: '#38bdf8',
      action: () => {
        startAutonomousWorkflow();
        setCommandPalette(false);
      }
    },
    {
      id: 'cmd-apply-fix',
      title: 'Apply AI Fix: Division by zero',
      subtitle: 'Patch main.py line 6 with zero-guard validation',
      icon: Wrench,
      color: '#10b981',
      action: () => {
        applyFix('ISSUE-01');
        setCommandPalette(false);
      }
    },
    {
      id: 'cmd-run-tests',
      title: 'Run Pytest Unit Suite',
      subtitle: 'Execute test_main.py against current workspace',
      icon: FlaskConical,
      color: '#f97316',
      action: () => {
        setConsoleTab('testResults');
        setCommandPalette(false);
      }
    },
    {
      id: 'cmd-open-reports',
      title: 'View Analytics & Diagnostics Report',
      subtitle: 'Full charts, trends, issue distribution, and CSV export',
      icon: BarChart2,
      color: '#a855f7',
      action: () => {
        navigate('/reports');
        setCommandPalette(false);
      }
    },
    {
      id: 'cmd-file-main',
      title: 'Open backend/main.py',
      subtitle: 'Target file containing runtime division by zero',
      icon: FileCode,
      color: '#38bdf8',
      action: () => {
        setActiveFile('backend/main.py');
        navigate('/');
        setCommandPalette(false);
      }
    },
    {
      id: 'cmd-toggle-theme',
      title: 'Toggle Light / Dark Mode',
      subtitle: 'Switch application color palette',
      icon: Sun,
      color: '#eab308',
      action: () => {
        toggleTheme();
        setCommandPalette(false);
      }
    },
    {
      id: 'cmd-open-chat',
      title: 'Ask AutonomusAI in Chat',
      subtitle: 'Conversational coding assistant and prompt suggestions',
      icon: Terminal,
      color: '#6366f1',
      action: () => {
        setRightSidebarTab('chat');
        setCommandPalette(false);
      }
    }
  ];

  const filtered = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={() => setCommandPalette(false)}>
      <div className="palette-box" onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="palette-input-row">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="palette-input"
            placeholder="Type a command or search files, symbols, issues..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button 
            className="icon-action-btn" 
            style={{ width: 24, height: 24 }}
            onClick={() => setCommandPalette(false)}
          >
            <X size={15} />
          </button>
        </div>

        {/* List */}
        <div className="palette-list">
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No matching commands found for "{query}"
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id} 
                  className="palette-item"
                  onClick={item.action}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: 'var(--radius-sm)', 
                      backgroundColor: 'rgba(255,255,255,0.06)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <Icon size={16} color={item.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight size={13} color="var(--text-muted)" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '6px 14px', background: 'var(--bg-card-subtle)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>Navigation: <kbd className="kbd-badge">↑</kbd> <kbd className="kbd-badge">↓</kbd></span>
          <span>Select: <kbd className="kbd-badge">Enter</kbd></span>
          <span>Dismiss: <kbd className="kbd-badge">Esc</kbd></span>
        </div>
      </div>
    </div>
  );
}
