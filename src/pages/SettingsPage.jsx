import React, { useState } from 'react';
import { 
  Settings, Sun, Moon, Sparkles, Sliders, Shield, Database, Check, 
  Key, Eye, EyeOff, ExternalLink, GitBranch, Trash2, CheckCircle2 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function SettingsPage() {
  const { 
    theme, 
    setTheme, 
    project, 
    selectedModel, 
    setSelectedModel, 
    githubToken, 
    setGithubToken, 
    addNotification 
  } = useAppStore();

  const [activeModel, setActiveModel] = useState(selectedModel || 'qwen/qwen3.8-27b');
  const [tokenInput, setTokenInput] = useState(githubToken || '');
  const [showToken, setShowToken] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [tabWidth, setTabWidth] = useState(4);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSelectedModel(activeModel);
    setGithubToken(tokenInput);
    setSaved(true);
    if (addNotification) {
      addNotification({
        title: 'Settings Saved',
        message: `Preferences and credentials updated successfully.`,
        type: 'success'
      });
    }
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveTokenOnly = () => {
    setGithubToken(tokenInput);
    setTokenSaved(true);
    if (addNotification) {
      addNotification({
        title: 'GitHub Token Saved',
        message: 'Personal Access Token saved locally for autonomous push & sync.',
        type: 'success'
      });
    }
    setTimeout(() => setTokenSaved(false), 2000);
  };

  const handleClearToken = () => {
    setTokenInput('');
    setGithubToken('');
    if (addNotification) {
      addNotification({
        title: 'GitHub Token Removed',
        message: 'Cleared saved GitHub personal access token.',
        type: 'info'
      });
    }
  };

  const isTokenConfigured = Boolean(githubToken && githubToken.trim());

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 840 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-badge" style={{ width: 32, height: 32 }}>
            <Settings size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Preferences &amp; Model Settings</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Configure AI reasoning agents, GitHub cloud integration, and workspace runtime</p>
          </div>
        </div>

        <button 
          className="btn btn-primary-gradient" 
          onClick={handleSave}
          style={{ height: 32, fontSize: 11 }}
        >
          {saved ? <Check size={13} /> : <Sparkles size={13} />}
          <span>{saved ? 'Saved Successfully' : 'Save Changes'}</span>
        </button>
      </div>

      {/* GitHub Integration Section */}
      <div className="card" style={{ padding: '16px', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={15} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>GitHub Cloud Integration (PAT)</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Enables the autonomous 5-Agent pipeline to directly commit &amp; push verified fixes</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isTokenConfigured ? (
              <span className="badge badge-success" style={{ fontSize: 10, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={11} /> Token Configured
              </span>
            ) : (
              <span className="badge badge-warning" style={{ fontSize: 10, padding: '3px 8px' }}>
                Not Configured
              </span>
            )}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span>Get Token (Classic)</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Tokens classic with 'repo' scope)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 38px 0 12px',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono, monospace)',
                  backgroundColor: 'var(--bg-input, #090d16)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4
                }}
                title={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary-gradient"
              onClick={handleSaveTokenOnly}
              style={{ height: 36, padding: '0 14px', fontSize: 11, fontWeight: 600 }}
            >
              {tokenSaved ? <Check size={12} /> : <Key size={12} />}
              <span>{tokenSaved ? 'Saved' : 'Save Token'}</span>
            </button>

            {isTokenConfigured && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearToken}
                style={{ height: 36, padding: '0 10px', fontSize: 11, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                title="Clear saved token"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
            <strong>Note for Collaborators:</strong> To push to repositories owned by another user (like <code>Karnik007/fitness-tracker-ai-testing</code>), use a <strong>Tokens (classic)</strong> with the <code>[✓] repo</code> scope checked. Fine-grained tokens are restricted by GitHub to personal repositories only.
          </div>
        </div>
      </div>

      {/* AI Model Architecture Section */}
      <div className="card" style={{ padding: '16px', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AI Agent Model Pipeline</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>High-throughput inference provided by Groq Cloud LPUs</div>
          </div>
          <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 8px' }}>
            ● Groq API Connected
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            {
              id: 'qwen/qwen3.8-27b',
              name: 'Qwen 3.8 27B (High-Precision Code Synthesis & AST Diagnosis)',
              tag: 'Recommended for Coding',
              desc: 'Specialized 27B coding LLM on Groq. Sub-second AST syntax repairs, deterministic patch generation, and logic bug detection.'
            },
            {
              id: 'openai/gpt-oss-120b',
              name: 'GPT-OSS 120B (Deep Architectural Reasoning & Cross-File Logic)',
              tag: 'Flagship Intelligence',
              desc: 'High-parameter 120B reasoning model on Groq. Multi-file dependency graph analysis, deep root-cause debugging, and security boundary guards.'
            },
            {
              id: 'openai/gpt-oss-20b',
              name: 'GPT-OSS 20B (Ultra-Fast Instant Triage & Sub-Second Latency)',
              tag: 'Sub-Second Speed',
              desc: 'Ultra-fast lightweight reasoning engine on Groq. Real-time typing analysis, instant linting, and high-throughput micro-patches.'
            }
          ].map((m) => (
            <label 
              key={m.id} 
              className="palette-item"
              style={{ 
                padding: '12px 14px', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)',
                background: activeModel === m.id ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card-subtle)',
                borderColor: activeModel === m.id ? 'var(--border-focus)' : undefined,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input
                  type="radio"
                  name="ai-model"
                  checked={activeModel === m.id}
                  onChange={() => setActiveModel(m.id)}
                  style={{ marginTop: 3 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                    <span style={{ fontSize: 10, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '1px 6px', borderRadius: 4 }}>
                      {m.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.desc}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Appearance Section */}
      <div className="card" style={{ padding: '16px', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Appearance &amp; Theme</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn btn-secondary ${theme === 'dark' ? 'active' : ''}`}
            style={{ 
              flex: 1, height: 42, 
              borderColor: theme === 'dark' ? 'var(--border-focus)' : undefined,
              color: theme === 'dark' ? '#38bdf8' : undefined 
            }}
            onClick={() => setTheme('dark')}
          >
            <Moon size={16} />
            <span>Dark Navy (Reference 1)</span>
          </button>

          <button
            className={`btn btn-secondary ${theme === 'light' ? 'active' : ''}`}
            style={{ 
              flex: 1, height: 42, 
              borderColor: theme === 'light' ? 'var(--border-focus)' : undefined,
              color: theme === 'light' ? '#0284c7' : undefined 
            }}
            onClick={() => setTheme('light')}
          >
            <Sun size={16} />
            <span>Clean Light (Reference 2)</span>
          </button>
        </div>
      </div>

      {/* Editor Preferences */}
      <div className="card" style={{ padding: '16px', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Monaco Editor Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Font Size (px)</label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min={10}
              max={24}
              style={{ width: '100%', height: 32, padding: '0 8px', marginTop: 4 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Tab Width (Spaces)</label>
            <input
              type="number"
              value={tabWidth}
              onChange={(e) => setTabWidth(Number(e.target.value))}
              min={2}
              max={8}
              style={{ width: '100%', height: 32, padding: '0 8px', marginTop: 4 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
