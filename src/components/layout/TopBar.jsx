import React, { useState } from 'react';
import {
  Sparkles, Search, Sun, Moon, Bell, Settings, Play,
  ChevronDown, Check, Terminal, ExternalLink, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useNavigate } from 'react-router-dom';
import aetherionLogo from '../../assets/images/aetherion-logo.png';

export default function TopBar() {
  const navigate = useNavigate();
  const {
    theme, toggleTheme,
    activeLanguage, setLanguage,
    project, selectedBranch,
    notifications, isNotificationsOpen, toggleNotifications, markNotificationsAsRead,
    setCommandPalette
  } = useAppStore();

  const { workflowState, startAutonomousWorkflow, activeAgent, progress } = useWorkflowStore();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isRunning = workflowState !== 'idle' && workflowState !== 'completed' && workflowState !== 'failed';

  const languages = [
    { id: 'python', label: 'Python 3.11', icon: '🐍' },
    { id: 'javascript', label: 'JavaScript (Node 20)', icon: '⚡' },
    { id: 'typescript', label: 'TypeScript 5.3', icon: '🔷' },
    { id: 'rust', label: 'Rust 1.76', icon: '🦀' },
    { id: 'go', label: 'Go 1.22', icon: '🐹' }
  ];

  return (
    <header className="topbar">
      {/* Left: Brand Identity */}
      <div className="topbar-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="brand-logo-container" title="AETHERION — Autonomous AI Debugging IDE">
          <img 
            src={aetherionLogo} 
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
        {/* Language Selector */}
        <div style={{ position: 'relative' }}>
          <button
            className="lang-select-btn"
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
          >
            <span>{languages.find(l => l.id === activeLanguage)?.icon || '🐍'}</span>
            <span>{languages.find(l => l.id === activeLanguage)?.label?.split(' ')[0] || 'Python'}</span>
            <ChevronDown size={13} />
          </button>

          {isLangMenuOpen && (
            <div className="popover-menu" style={{ width: 180 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
                Active Runtime
              </div>
              {languages.map((l) => (
                <div
                  key={l.id}
                  className="palette-item"
                  onClick={() => {
                    setLanguage(l.id);
                    setIsLangMenuOpen(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{l.icon}</span>
                    <span>{l.label}</span>
                  </span>
                  {activeLanguage === l.id && <Check size={13} color="var(--color-success)" />}
                </div>
              ))}
            </div>
          )}
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
