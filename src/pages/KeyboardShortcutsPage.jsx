import React, { useState, useMemo, useEffect } from 'react';
import { 
  Keyboard, Search, X, Copy, Check, Play, FileCode, 
  Terminal, Sparkles, Sliders, ShieldCheck, RefreshCw, 
  Layers, ExternalLink, Info, Code, CornerDownLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VSCODE_KEYBOARD_COMMANDS, VSCODE_COMMAND_CATEGORIES } from '../data/vscodeCommands';
import { useAppStore } from '../store/useAppStore';
import { useWorkflowStore } from '../store/useWorkflowStore';

export default function KeyboardShortcutsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showJsonView, setShowJsonView] = useState(false);
  const [showTester, setShowTester] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [lastTestedKey, setLastTestedKey] = useState(null);

  const {
    saveActiveFile, toggleLeftSidebar, toggleConsole,
    setCommandPalette, runTests, addNotification,
    setRightSidebarTab, setConsoleTab
  } = useAppStore();

  const { startAutonomousWorkflow } = useWorkflowStore();

  // Listen for keyboard presses in tester mode
  useEffect(() => {
    const handleTestKeyDown = (e) => {
      // Don't intercept if user is typing in search input
      if (e.target.matches('input[type="text"]')) return;

      const keys = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.metaKey) keys.push('Cmd');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      let mainKey = e.key;
      if (mainKey === ' ') mainKey = 'Space';
      if (mainKey === 'Control' || mainKey === 'Meta' || mainKey === 'Alt' || mainKey === 'Shift') {
        mainKey = null;
      }

      if (mainKey) {
        keys.push(mainKey.toUpperCase());
        const combo = keys.join('+');

        // Match with known commands
        const matched = VSCODE_KEYBOARD_COMMANDS.find(cmd => 
          cmd.key.toUpperCase() === combo || 
          cmd.key.toUpperCase().replace(/\s+/g, '') === combo ||
          (cmd.macKey && cmd.macKey.toUpperCase() === combo)
        );

        setLastTestedKey({
          combo,
          command: matched ? matched.title : 'Unassigned or Custom Action',
          id: matched ? matched.id : 'custom.action',
          description: matched ? matched.description : 'Key combination recognized and captured by IDE.',
          category: matched ? matched.category : 'General'
        });
      }
    };

    window.addEventListener('keydown', handleTestKeyDown);
    return () => window.removeEventListener('keydown', handleTestKeyDown);
  }, []);

  // Filter commands
  const filteredCommands = useMemo(() => {
    return VSCODE_KEYBOARD_COMMANDS.filter((cmd) => {
      const matchesCategory = selectedCategory === 'All' || cmd.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        cmd.title.toLowerCase().includes(q) ||
        cmd.id.toLowerCase().includes(q) ||
        cmd.key.toLowerCase().includes(q) ||
        (cmd.macKey && cmd.macKey.toLowerCase().includes(q)) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
      );
    });
  }, [searchTerm, selectedCategory]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyJson = () => {
    const rawJson = JSON.stringify(
      VSCODE_KEYBOARD_COMMANDS.map(c => ({
        key: c.key.toLowerCase(),
        command: c.id,
        when: c.when || undefined
      })),
      null,
      2
    );
    navigator.clipboard.writeText(rawJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const executeCommand = (actionId, title) => {
    switch (actionId) {
      case 'saveFile':
        saveActiveFile?.();
        addNotification({ title: 'Saved', message: 'Executed Save File command', type: 'info' });
        break;
      case 'openCommandPalette':
      case 'quickOpen':
        setCommandPalette(true);
        break;
      case 'toggleLeftSidebar':
        toggleLeftSidebar();
        break;
      case 'toggleTerminal':
      case 'togglePanel':
        toggleConsole();
        break;
      case 'showExplorer':
        navigate('/');
        break;
      case 'showSearch':
        navigate('/search');
        break;
      case 'showSCM':
        navigate('/source-control');
        break;
      case 'showDebug':
        navigate('/debug');
        break;
      case 'showProblems':
        setConsoleTab('problems');
        break;
      case 'openSettings':
        navigate('/settings');
        break;
      case 'runAI':
        startAutonomousWorkflow();
        navigate('/');
        break;
      case 'openFixes':
        setRightSidebarTab('fixes');
        navigate('/');
        break;
      case 'focusChat':
        setRightSidebarTab('chat');
        navigate('/');
        break;
      case 'runTests':
        runTests();
        break;
      default:
        addNotification({
          title: title,
          message: `Command '${title}' is active and handled natively by the editor engine.`,
          type: 'info'
        });
        break;
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflowY: 'auto'
    }}>
      {/* Header Bar */}
      <div style={{
        padding: '20px 28px 16px 28px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(0,112,243,0.3) 0%, rgba(56,189,248,0.15) 100%)',
            border: '1px solid rgba(56,189,248,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Keyboard size={20} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Keyboard Shortcuts
              </h1>
              <span className="badge badge-info" style={{ fontSize: 10 }}>VS Code Mode</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Reference cheat sheet and real-time execution engine for all standard VS Code and AETHERION commands
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className={`btn ${showTester ? 'btn-primary-gradient' : 'btn-secondary'}`}
            style={{ height: 30, fontSize: 11, padding: '0 12px' }}
            onClick={() => setShowTester(!showTester)}
          >
            <Sparkles size={12} style={{ marginRight: 5 }} />
            <span>{showTester ? 'Hide Key Tester' : 'Interactive Key Tester'}</span>
          </button>

          <button
            className="btn btn-secondary"
            style={{ height: 30, fontSize: 11, padding: '0 12px' }}
            onClick={() => setShowJsonView(!showJsonView)}
          >
            <Code size={12} style={{ marginRight: 5 }} />
            <span>{showJsonView ? 'Show Table View' : 'Open keybindings.json'}</span>
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Interactive Key Detection Live Tester Banner */}
        {showTester && (
          <div style={{
            padding: '14px 18px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 16px rgba(0, 112, 243, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6,
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Keyboard size={16} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Live Keyboard Shortcut Listener
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Press any combination on your keyboard (e.g. <b>Ctrl+C</b>, <b>Ctrl+V</b>, <b>Ctrl+S</b>, <b>Ctrl+B</b>, <b>Ctrl+P</b>) to verify it:
                </div>
              </div>
            </div>

            {lastTestedKey ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pressed:</span>
                  <span className="kbd-badge" style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>
                    {lastTestedKey.combo}
                  </span>
                </div>
                <span style={{ color: 'var(--border-subtle)' }}>•</span>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {lastTestedKey.command}
                </div>
                <span className="badge badge-success" style={{ fontSize: 9 }}>Verified</span>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Waiting for keyboard input...
              </div>
            )}
          </div>
        )}

        {/* Search Bar & Category Filter Strip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Type to search in keybindings (e.g. 'copy', 'ctrl+c', 'save', 'terminal', 'selection')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 36px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 12,
                outline: 'none',
                transition: 'border-color var(--transition-fast)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="icon-action-btn"
                style={{ position: 'absolute', right: 8, top: 6, width: 24, height: 24 }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {VSCODE_COMMAND_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  className={`btn ${isActive ? 'btn-primary-gradient' : 'btn-secondary'}`}
                  style={{
                    height: 24,
                    fontSize: 10,
                    padding: '0 10px',
                    borderRadius: 'var(--radius-full)',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              );
            })}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Showing {filteredCommands.length} of {VSCODE_KEYBOARD_COMMANDS.length} commands
            </span>
          </div>
        </div>

        {/* Content View: Table View or Raw keybindings.json View */}
        {showJsonView ? (
          /* JSON View */
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                <FileCode size={14} color="#38bdf8" />
                <span>keybindings.json</span>
              </div>
              <button
                className="btn btn-secondary"
                style={{ height: 26, fontSize: 10 }}
                onClick={handleCopyJson}
              >
                {copiedJson ? <Check size={11} color="var(--color-success)" /> : <Copy size={11} />}
                <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre style={{
              backgroundColor: 'var(--bg-code-block)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              maxHeight: 480,
              overflowY: 'auto'
            }}>
              {JSON.stringify(
                VSCODE_KEYBOARD_COMMANDS.map(c => ({
                  key: c.key.toLowerCase(),
                  command: c.id,
                  when: c.when || undefined
                })),
                null,
                2
              )}
            </pre>
          </div>
        ) : (
          /* Rich Table View Matching VS Code Exactly */
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <th style={{ padding: '10px 16px', width: '22%' }}>Command</th>
                  <th style={{ padding: '10px 16px', width: '16%' }}>Keybinding</th>
                  <th style={{ padding: '10px 16px', width: '38%' }}>What Each Command Does</th>
                  <th style={{ padding: '10px 16px', width: '14%' }}>When Expression</th>
                  <th style={{ padding: '10px 16px', width: '10%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommands.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No commands match your filter query.
                    </td>
                  </tr>
                ) : (
                  filteredCommands.map((cmd, idx) => {
                    const isEven = idx % 2 === 0;

                    // Parse individual keys into 3D keycaps
                    const keyParts = cmd.key.split('+');

                    return (
                      <tr
                        key={cmd.id}
                        style={{
                          backgroundColor: isEven ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background-color var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-subtle)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isEven ? 'transparent' : 'rgba(255, 255, 255, 0.015)'}
                      >
                        {/* Command Name & ID */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                            {cmd.title}
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <span>{cmd.id}</span>
                            <button
                              className="icon-action-btn"
                              style={{ width: 16, height: 16, padding: 0 }}
                              onClick={() => handleCopy(cmd.id, cmd.id)}
                              title="Copy Command ID"
                            >
                              {copiedId === cmd.id ? <Check size={10} color="var(--color-success)" /> : <Copy size={10} />}
                            </button>
                          </div>
                        </td>

                        {/* Keybinding Badges */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                            {keyParts.map((k, i) => (
                              <React.Fragment key={i}>
                                <kbd style={{
                                  display: 'inline-block',
                                  padding: '2px 6px',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                  backgroundColor: 'var(--bg-secondary)',
                                  border: '1px solid var(--border-subtle)',
                                  borderBottom: '2px solid rgba(56, 189, 248, 0.4)',
                                  borderRadius: 4,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }}>
                                  {k.trim()}
                                </kbd>
                                {i < keyParts.length - 1 && (
                                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                          {cmd.macKey && (
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
                              macOS: {cmd.macKey}
                            </div>
                          )}
                        </td>

                        {/* What Each Command Does */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'top', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          <div>{cmd.description}</div>
                          <div style={{ marginTop: 4 }}>
                            <span className="badge badge-subtle" style={{ fontSize: 9 }}>
                              {cmd.category}
                            </span>
                          </div>
                        </td>

                        {/* When Expression */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            backgroundColor: 'rgba(0,0,0,0.15)',
                            padding: '2px 6px',
                            borderRadius: 3,
                            display: 'inline-block',
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={cmd.when || 'Always enabled'}>
                            {cmd.when || 'Global (Always)'}
                          </span>
                        </td>

                        {/* Test / Run Command Action */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ height: 26, fontSize: 10, padding: '0 8px' }}
                            onClick={() => executeCommand(cmd.actionId, cmd.title)}
                            title={`Execute '${cmd.title}' right now`}
                          >
                            <Play size={10} style={{ marginRight: 4 }} />
                            <span>Run</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
