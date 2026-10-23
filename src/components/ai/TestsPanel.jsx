import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, Play, RotateCw, Filter, Clock, 
  ChevronDown, ChevronRight, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function TestsPanel() {
  const { testCases, runTests, isTestingRunning } = useAppStore();
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState('test-3');

  const passed = testCases.filter(t => t.status === 'passed').length;
  const failed = testCases.filter(t => t.status === 'failed').length;
  const total = testCases.length;
  const passRate = Math.round((passed / total) * 100);

  const filteredTests = testCases.filter(t => {
    if (filter === 'passed') return t.status === 'passed';
    if (filter === 'failed') return t.status === 'failed';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        <div className="card" style={{ padding: '8px', textAlign: 'center', gap: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{total}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
        </div>
        <div className="card" style={{ padding: '8px', textAlign: 'center', gap: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>{passed}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passed</div>
        </div>
        <div className="card" style={{ padding: '8px', textAlign: 'center', gap: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: failed > 0 ? 'var(--color-critical)' : 'var(--text-muted)' }}>{failed}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Failed</div>
        </div>
        <div className="card" style={{ padding: '8px', textAlign: 'center', gap: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>84.6%</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Coverage</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ padding: '10px', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
          <span>Suite Health</span>
          <span style={{ color: passRate === 100 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {passRate}% Pass Rate
          </span>
        </div>
        <div style={{ width: '100%', height: 6, backgroundColor: 'var(--bg-card-subtle)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${passRate}%`, backgroundColor: 'var(--color-success)', transition: 'width 0.4s ease' }} />
          {failed > 0 && <div style={{ width: `${100 - passRate}%`, backgroundColor: 'var(--color-critical)' }} />}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button 
          className="btn btn-primary-gradient" 
          style={{ flex: 1, height: 28, fontSize: 11 }}
          onClick={runTests}
          disabled={isTestingRunning}
        >
          {isTestingRunning ? (
            <>
              <div className="animate-spin" style={{ width: 10, height: 10, border: '1.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
              <span>Executing Suite...</span>
            </>
          ) : (
            <>
              <Play size={12} fill="#fff" />
              <span>Run Tests</span>
            </>
          )}
        </button>

        {failed > 0 && (
          <button 
            className="btn btn-secondary" 
            style={{ height: 28, fontSize: 11 }}
            onClick={runTests}
          >
            <RotateCw size={11} />
            <span>Retry Failed</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
        {['all', 'passed', 'failed'].map((f) => (
          <button
            key={f}
            className={`btn btn-secondary ${filter === f ? 'active' : ''}`}
            style={{ 
              height: 22, fontSize: 10, textTransform: 'capitalize', padding: '0 8px',
              color: filter === f ? '#38bdf8' : undefined,
              borderColor: filter === f ? 'var(--border-focus)' : undefined
            }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Test Cases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filteredTests.map((test) => {
          const isExp = expandedId === test.id;
          const isPassed = test.status === 'passed';

          return (
            <div 
              key={test.id} 
              className="card" 
              style={{ 
                padding: '8px 10px', 
                borderLeft: `3px solid ${isPassed ? 'var(--color-success)' : 'var(--color-critical)'}`,
                gap: 4 
              }}
            >
              <div 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setExpandedId(isExp ? null : test.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isExp ? <ChevronDown size={12} color="var(--text-muted)" /> : <ChevronRight size={12} color="var(--text-muted)" />}
                  {isPassed ? <CheckCircle2 size={13} color="var(--color-success)" /> : <XCircle size={13} color="var(--color-critical)" />}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>
                    {test.name}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{test.duration}</span>
              </div>

              {isExp && (
                <div style={{ marginTop: 4, paddingLeft: 18, fontSize: 11 }}>
                  {test.error && (
                    <div style={{ 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid var(--color-critical-border)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '6px 8px', 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: 10, 
                      color: 'var(--color-critical)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {test.traceback}
                    </div>
                  )}
                  {test.stdout && (
                    <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                      {test.stdout}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
