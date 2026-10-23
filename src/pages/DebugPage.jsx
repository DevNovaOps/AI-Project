import React, { useState } from 'react';
import { 
  Bug, Play, Pause, RotateCcw, ArrowRight, ArrowDown, 
  CircleDot, CheckCircle2, AlertCircle, Sparkles 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export default function DebugPage() {
  const navigate = useNavigate();
  const { currentProject, issues, selectIssue } = useAppStore();
  const [isRunning, setIsRunning] = useState(false);

  const activeBreakpoints = issues.map((iss) => ({
    id: iss.id,
    file: iss.file || iss.filePath,
    line: iss.line,
    title: iss.title,
    detail: iss.detail,
    severity: iss.severity,
    status: iss.status,
  }));

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-badge" style={{ width: 32, height: 32 }}>
            <Bug size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Debug Session &amp; Breakpoints</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Interactive Diagnostic Breakpoints for {currentProject?.name || 'Workspace'}
            </p>
          </div>
        </div>

        {/* Debug Controls */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            className="btn btn-primary-gradient" 
            onClick={() => setIsRunning(!isRunning)}
            style={{ height: 32, fontSize: 11 }}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} fill="#fff" />}
            <span>{isRunning ? 'Pause' : 'Start Debugging'}</span>
          </button>
          <button className="btn btn-secondary" style={{ height: 32, fontSize: 11 }}>
            <ArrowRight size={13} />
            <span>Step Over</span>
          </button>
          <button className="btn btn-secondary" style={{ height: 32, fontSize: 11 }}>
            <ArrowDown size={13} />
            <span>Step Into</span>
          </button>
          <button className="btn btn-secondary" style={{ height: 32, fontSize: 11 }}>
            <RotateCcw size={13} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Grid or Empty State */}
      {activeBreakpoints.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}>
          <Bug size={36} color="var(--border-focus)" />
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              No Active Breakpoints or Findings
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 460, margin: '6px auto 0', lineHeight: 1.5 }}>
              Start an autonomous analysis session to automatically set diagnostic breakpoints on detected defect locations.
            </p>
          </div>
          <button
            className="btn btn-primary-gradient"
            onClick={() => navigate('/')}
            style={{ height: 34, padding: '0 20px', fontSize: 12, marginTop: 4 }}
          >
            Go to Editor &amp; Run Analysis
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 16 }}>
          {/* Variables Watch */}
          <div className="card" style={{ padding: '14px', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Detected Defect Signals ({activeBreakpoints.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeBreakpoints.map((bp) => (
                <div 
                  key={bp.id} 
                  className="palette-item" 
                  style={{ padding: '8px 10px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', flexDirection: 'column', alignItems: 'flex-start', gap: 2, cursor: 'pointer' }}
                  onClick={() => {
                    selectIssue(bp.id);
                    navigate('/');
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#38bdf8' }}>{bp.file}:{bp.line}</span>
                    <span className={`badge badge-${(bp.severity || 'medium').toLowerCase()}`} style={{ fontSize: 9 }}>{bp.severity}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{bp.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakpoints & Call Stack */}
          <div className="card" style={{ padding: '14px', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Breakpoints
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeBreakpoints.map((bp) => (
                <div 
                  key={bp.id} 
                  className="palette-item" 
                  style={{ padding: '8px 12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                  onClick={() => {
                    selectIssue(bp.id);
                    navigate('/');
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CircleDot size={14} color="var(--color-critical)" />
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{bp.file}:{bp.line}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{bp.detail || bp.title}</div>
                    </div>
                  </div>
                  <span className="badge badge-critical" style={{ fontSize: 9 }}>Pending</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
