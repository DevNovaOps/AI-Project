import React, { useState, useEffect } from 'react';
import { 
  Search, Play, Wrench, FlaskConical, BarChart2, Sun, Moon, 
  FileCode, Terminal, X, ArrowRight, Sparkles, FolderGit2, UploadCloud, FilePlus, Keyboard, Save
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette() {
  const navigate = useNavigate();
  const { 
    isCommandPaletteOpen, setCommandPalette, 
    toggleTheme, setActiveFile, setRightSidebarTab, setConsoleTab,
    setConnectRepoModalOpen, setUploadModalOpen, setActiveModal,
    files
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

  const baseCommands = [
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
      id: 'cmd-connect-github',
      title: 'Connect GitHub Repository',
      subtitle: 'Import a public GitHub repository into your workspace',
      icon: FolderGit2,
      color: '#a855f7',
      action: () => {
        setConnectRepoModalOpen(true);
        setCommandPalette(false);
      }
    },
    {
      id: 'cmd-upload-files',
      title: 'Upload Project Files or ZIP',
      subtitle: 'Upload local source files or extract an archive into the workspace',
      icon: UploadCloud,
      color: '#38bdf8',
      action: () => {
        setUploadModalOpen(true);
        setCommandPalette(false);
      }
    },
    {
      id: 'cmd-new-file',
      title: 'Create New File',
      subtitle: 'Add a new file to the current workspace',
      icon: FilePlus,
      color: '#10b981',
      action: () => {
        setActiveModal({ type: 'new_file' });
        setCommandPalette(false);
      }
    },
    {
      id: 'cmd-run-tests',
      title: 'Run Test Suite',
      subtitle: 'Execute test suite in isolated sandbox environment',
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
      title: 'Ask AETHERION in Chat',
      subtitle: 'Conversational coding assistant and prompt suggestions',
      icon: Terminal,
      color: '#6366f1',
      action: () => {
        setRightSidebarTab('chat');
        setCommandPalette(false);
      }
    },
    {
      id: 'cmd-open-shortcuts',
      title: 'Preferences: Open Keyboard Shortcuts (Ctrl+K Ctrl+S)',
      subtitle: 'View, search, and test all VS Code and AETHERION keybindings',
      icon: Keyboard,
      color: '#38bdf8',
      action: () => {
        navigate('/shortcuts');
        setCommandPalette(false);
      }
    }
  ];

  // Dynamic file commands from loaded workspace files
  const fileCommands = Object.values(files).map((f) => ({
    id: `file-${f.path}`,
    title: `Open ${f.name}`,
    subtitle: f.path,
    icon: FileCode,
    color: '#38bdf8',
    action: () => {
      setActiveFile(f.path);
      navigate('/');
      setCommandPalette(false);
    }
  }));

  const allCommands = [...baseCommands, ...fileCommands];

  const filtered = allCommands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={() => setCommandPalette(false)}>
      <div 
        className="palette-box"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 560 }}
      >
        {/* Search input field */}
        <div className="palette-input-box">
          <Search size={16} color="#38bdf8" />
          <input
            type="text"
            className="palette-input"
            placeholder="Type a command, file name, or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="kbd-badge">ESC</span>
        </div>

        {/* Results List */}
        <div className="palette-results">
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  className="palette-item"
                  onClick={cmd.action}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ 
                      width: 26, height: 26, borderRadius: 'var(--radius-sm)', 
                      backgroundColor: 'var(--bg-card-subtle)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <Icon size={14} color={cmd.color || 'var(--text-primary)'} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cmd.title}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {cmd.subtitle}
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={13} color="var(--text-muted)" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
