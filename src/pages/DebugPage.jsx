import React, { useState } from 'react';
import { 
  Bug, Play, Pause, RotateCcw, ArrowRight, ArrowDown, 
  CircleDot, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function DebugPage() {
  const { project } = useAppStore();
  const [isRunning, setIsRunning] = useState(false);

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
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Python PDB Sandbox Debugger for {project.name}</p>
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

      {/* Grid: Breakpoints and Variables Watch */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 16 }}>
        {/* Variables Watch */}
        <div className="card" style={{ padding: '14px', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Variable Inspector &amp; Watch
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="palette-item" style={{ padding: '8px 10px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#38bdf8' }}>numbers</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-critical)' }}>[] (empty list)</span>
            </div>
            <div className="palette-item" style={{ padding: '8px 10px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#38bdf8' }}>len(numbers)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-critical)', fontWeight: 700 }}>0 (Zero Divisor!)</span>
            </div>
            <div className="palette-item" style={{ padding: '8px 10px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#38bdf8' }}>sum(numbers)</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>0</span>
            </div>
          </div>
        </div>

        {/* Breakpoints & Call Stack */}
        <div className="card" style={{ padding: '14px', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Breakpoints
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="palette-item" style={{ padding: '8px 12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CircleDot size={14} color="var(--color-critical)" />
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>backend/main.py:6</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>return sum(numbers) / len(numbers)</div>
                </div>
              </div>
              <span className="badge badge-critical" style={{ fontSize: 9 }}>Hit 1x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
