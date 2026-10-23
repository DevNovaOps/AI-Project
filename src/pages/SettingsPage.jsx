import React, { useState } from 'react';
import { Settings, Sun, Moon, Sparkles, Sliders, Shield, Database, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function SettingsPage() {
  const { theme, setTheme, project } = useAppStore();
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [fontSize, setFontSize] = useState(13);
  const [tabWidth, setTabWidth] = useState(4);
  const [autoApplyHighConfidence, setAutoApplyHighConfidence] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-badge" style={{ width: 32, height: 32 }}>
            <Settings size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Preferences &amp; Model Settings</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Configure AI reasoning agents, editor layout, and workspace runtime</p>
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

      {/* AI Model Architecture Section */}
      <div className="card" style={{ padding: '16px', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AI Agent Model Pipeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High Speed & Code Diagnosis)', desc: 'Optimized for sub-second AST analysis and deterministic patch generation' },
            { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (Extended Reasoning)', desc: 'Comprehensive reasoning across multi-file architectures' },
            { id: 'gpt-4o', name: 'GPT-4o Omnichannel', desc: 'General coding and test synthesis' }
          ].map((m) => (
            <label 
              key={m.id} 
              className="palette-item"
              style={{ 
                padding: '10px 14px', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)',
                background: selectedModel === m.id ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card-subtle)',
                borderColor: selectedModel === m.id ? 'var(--border-focus)' : undefined,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input
                  type="radio"
                  name="ai-model"
                  checked={selectedModel === m.id}
                  onChange={() => setSelectedModel(m.id)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</div>
                </div>
              </div>
            </label>
          ))}
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
