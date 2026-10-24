import React, { useState, useMemo } from 'react';
import {
  Sparkles, Search, Sun, Moon, Bell, Settings, Play,
  ChevronDown, Check, Terminal, ExternalLink, ShieldCheck, CheckCircle2,
  Globe, CheckSquare, FileCode
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useNavigate } from 'react-router-dom';
import aetherionLogo from '../../assets/images/aetherion-logo.png';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';
import { LANGUAGE_REGISTRY, getLanguageInfo, detectLanguageFromFilename } from '../../utils/languages';

export default function TopBar() {
  const navigate = useNavigate();
  const {
    theme, toggleTheme,
    activeLanguage, setLanguage,
    activeFilePath,
    project, selectedBranch,
    notifications, isNotificationsOpen, toggleNotifications, markNotificationsAsRead,
    setCommandPalette
  } = useAppStore();

  const { 
    workflowState, startAutonomousWorkflow, activeAgent, progress,
    targetScope, setTargetScope, setTargetModalOpen, selectedTargetFiles
  } = useWorkflowStore();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;
  const isRunning = workflowState !== 'idle' && workflowState !== 'completed' && workflowState !== 'failed';

  const currentLang = getLanguageInfo(activeLanguage);

  const allLanguages = useMemo(() => Object.values(LANGUAGE_REGISTRY), []);

  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return allLanguages;
    const q = langSearch.toLowerCase();
    return allLanguages.filter(
      l => l.label.toLowerCase().includes(q) || 
           l.id.toLowerCase().includes(q) || 
           l.category.toLowerCase().includes(q) ||
           (l.extensions && l.extensions.some(ext => ext.includes(q)))
    );
  }, [allLanguages, langSearch]);

  const logoSrc = theme === 'light' ? (logoLight || aetherionLogo) : (logoDark || aetherionLogo);

  return (
    <header className="topbar">
      {/* Left: Brand Identity */}
      <div className="topbar-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="brand-logo-container" title="AETHERION — Autonomous AI Debugging IDE">
          <img 
            src={logoSrc} 
            alt="AETHERION" 
            className="brand-logo-img" 
          />
        </div>
        <div className="brand-info">
          <div className="brand-title">AETHERION</div>
          <div className="brand-subtitle">Autonomous Debugging, Testing &amp; Validation</div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="topbar-center">
        <button
          className="search-field-btn"
          onClick={() => setCommandPalette(true)}
          title="Search files, symbols, bugs, or ask AETHERION (Ctrl+K)"
        >
          <div className="search-field-content">
            <Search size={14} />
            <span>Search files, symbols, bugs, or ask AETHERION...</span>
          </div>
          <span className="kbd-badge">Ctrl K</span>
        </button>
      </div>

      {/* Right: Actions, Language, Workflow Trigger, Theme, Notifications, Profile */}
      <div className="topbar-right">
        {/* Universal Multi-Language & Framework Selector */}
        <div style={{ position: 'relative' }}>
          <button
            className="lang-select-btn"
            onClick={() => {
              setIsLangMenuOpen(!isLangMenuOpen);
              setLangSearch('');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px' }}
            title={`Language is automatically detected from the open file: ${currentLang.label} (${currentLang.runtime}). Click only if you wish to override.`}
          >
            <span style={{ 
              fontSize: 9, 
              background: 'rgba(56, 189, 248, 0.15)', 
              color: '#38bdf8', 
              borderRadius: 3, 
              padding: '1px 5px', 
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              AUTO
            </span>
            <span>{currentLang.icon}</span>
            <span style={{ fontWeight: 500 }}>{currentLang.label.split(' ')[0]}</span>
            <ChevronDown size={12} style={{ opacity: 0.6 }} />
          </button>

          {isLangMenuOpen && (
            <div className="popover-menu" style={{ width: 280, maxHeight: 380, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 10px 6px 10px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Language Mode
                  </span>
                  <span style={{ fontSize: 9, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                    100% AUTO-DETECT
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
                  Auto-detects HTML, CSS, JS, React, Python, SQL on file click. Manual override optional:
                </div>
                <input
                  type="text"
                  placeholder="Filter 25+ languages & frameworks..."
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 11,
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                <div
                  className="palette-item"
                  onClick={() => {
                    const detected = detectLanguageFromFilename(activeFilePath);
                    setLanguage(detected.id);
                    setIsLangMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    margin: '2px 6px 6px 6px',
                    borderRadius: 4,
                    background: 'rgba(56, 189, 248, 0.08)',
                    cursor: 'pointer'
                  }}
                  title="Reset to 100% automatic detection based on active file"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13 }}>⚡</span>
                    <span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8' }}>Auto-Detect (Active File)</span>
                      <span style={{ display: 'block', fontSize: 9, color: 'var(--text-muted)' }}>
                        {activeFilePath ? `Matches ${activeFilePath.split('/').pop()}` : 'Default auto mode'}
                      </span>
                    </span>
                  </span>
                </div>

                {filteredLanguages.length === 0 ? (
                  <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
                    No matching language found
                  </div>
                ) : (
                  filteredLanguages.map((l) => (
                    <div
                      key={l.id}
                      className="palette-item"
                      onClick={() => {
                        setLanguage(l.id);
                        setIsLangMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{l.icon}</span>
                        <span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{l.label}</span>
                          <span style={{ display: 'block', fontSize: 9, color: 'var(--text-muted)' }}>{l.category}</span>
                        </span>
                      </span>
                      {activeLanguage === l.id && <Check size={13} color="var(--color-success)" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Target Scope Selector Pill */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setTargetModalOpen(true)}
            className="btn btn-secondary"
            style={{
              height: 28,
              fontSize: 11,
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-input)',
              border: targetScope === 'selected' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: targetScope === 'selected' ? '#38bdf8' : 'var(--text-secondary)'
            }}
            title="Configure Target Files for AI Analysis (Entire Project, Selected Files, or Active File)"
          >
            {targetScope === 'project' && <Globe size={12} color="#38bdf8" />}
            {targetScope === 'selected' && <CheckSquare size={12} color="#38bdf8" />}
            {targetScope === 'active' && <FileCode size={12} color="#38bdf8" />}
            <span>
              {targetScope === 'project'
                ? 'Entire Codebase'
                : targetScope === 'selected'
                ? `${selectedTargetFiles.length} Selected`
                : 'Active File'}
            </span>
            <ChevronDown size={11} color="var(--text-muted)" />
          </button>
        </div>

        {/* Primary CTA: Run with AI Agents */}
        <button
          className="btn btn-ai-primary"
          onClick={startAutonomousWorkflow}
          disabled={isRunning}
          style={{ opacity: isRunning ? 0.9 : 1 }}
          title="Execute 5-Agent Autonomous Debugging & Verification Pipeline"
        >
          {isRunning ? (
            <>
              <div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
              <span>{activeAgent ? activeAgent.split(' ')[0] : 'Running...'} ({progress}%)</span>
            </>
          ) : (
            <>
              <Play size={13} fill="#ffffff" />
              <span>Run with AI Agents</span>
            </>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          className="icon-action-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-action-btn"
            onClick={toggleNotifications}
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && <span className="notif-badge-dot" />}
          </button>

          {isNotificationsOpen && (
            <div className="popover-menu">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markNotificationsAsRead}
                    style={{ fontSize: 10, color: 'var(--text-accent)' }}
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div key={n.id} className="palette-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontWeight: 600, fontSize: 11, color: n.type === 'critical' ? 'var(--color-critical)' : 'var(--text-primary)' }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{n.timestamp}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{n.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          className="icon-action-btn"
          onClick={() => navigate('/settings')}
          title="IDE & Model Settings"
        >
          <Settings size={16} />
        </button>

        {/* User Avatar Menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="avatar-btn"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            title="Developer Profile"
          >
            A
          </button>

          {isProfileMenuOpen && (
            <div className="popover-menu" style={{ width: 220 }}>
              <div style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>Alex Chen</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Staff AI Engineer • Aegis Labs</div>
              </div>
              <div className="palette-item" onClick={() => { navigate('/settings'); setIsProfileMenuOpen(false); }}>
                <span>Preferences</span>
                <span className="kbd-badge">Ctrl ,</span>
              </div>
              <div className="palette-item" onClick={() => { navigate('/shortcuts'); setIsProfileMenuOpen(false); }}>
                <span>Keyboard Shortcuts</span>
                <span className="kbd-badge">Ctrl K S</span>
              </div>
              <div className="palette-item" onClick={() => { navigate('/reports'); setIsProfileMenuOpen(false); }}>
                <span>Team Diagnostics</span>
              </div>
              <div className="palette-item" onClick={() => { setIsProfileMenuOpen(false); }}>
                <span style={{ color: 'var(--text-muted)' }}>Version v2.4.0-stable</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
