import React, { useState, useMemo } from 'react';
import { Keyboard, Search, X, Copy, Check } from 'lucide-react';
import { VSCODE_KEYBOARD_COMMANDS, VSCODE_COMMAND_CATEGORIES } from '../data/vscodeCommands';

export default function KeyboardShortcutsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState(null);

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
              Reference cheat sheet of all keyboard commands and shortcuts
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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

        {/* Clean Table View */}
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
                <th style={{ padding: '10px 16px', width: '30%' }}>Command</th>
                <th style={{ padding: '10px 16px', width: '25%' }}>Keybinding</th>
                <th style={{ padding: '10px 16px', width: '45%' }}>What Each Command Does</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommands.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No commands match your filter query.
                  </td>
                </tr>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const isEven = idx % 2 === 0;
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
