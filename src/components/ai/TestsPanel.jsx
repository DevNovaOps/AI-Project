import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, Play, RotateCw, Filter, Clock, 
  ChevronDown, ChevronRight, ShieldCheck, AlertCircle, ShieldAlert 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function TestsPanel() {
  const { testCases, runTests, isTestingRunning, lastTestOutput } = useAppStore();
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const passed = testCases.filter(t => t.status === 'passed').length;
  const failed = testCases.filter(t => t.status === 'failed').length;
  const total = testCases.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

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
          <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>{total > 0 ? `${passRate}%` : '—'}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pass Rate</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="btn btn-primary-gradient"
          style={{ flex: 1, height: 32, fontSize: 11 }}
          onClick={runTests}
          disabled={isTestingRunning}
        >
          {isTestingRunning ? (
            <>
              <div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
              <span>Running Suite...</span>
            </>
          ) : (
            <>
              <Play size={12} fill="#ffffff" />
              <span>Run Tests</span>
            </>
          )}
        </button>
      </div>

      {/* Tests List or Empty State */}
      {total === 0 ? (
        <div style={{
          padding: '30px 16px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10
        }}>
          {lastTestOutput?.reason ? (
            <>
              <ShieldAlert size={26} color="#f59e0b" />
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {lastTestOutput.reason}
              </div>
            </>
          ) : (
            <>
              <Clock size={26} color="var(--border-focus)" />
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                No tests have been run yet.
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
          {filteredTests.map((test) => {
            const isPassed = test.status === 'passed';
            const isExpanded = expandedId === test.id;

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
                  onClick={() => setExpandedId(isExpanded ? null : test.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isPassed ? <CheckCircle2 size={13} color="var(--color-success)" /> : <XCircle size={13} color="var(--color-critical)" />}
                    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {test.name || test.test_name}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {test.duration_ms ? `${test.duration_ms}ms` : '—'}
                  </span>
                </div>

                {isExpanded && (test.error || test.stderr || test.stdout) && (
                  <div style={{
                    marginTop: 4,
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-code-block)',
                    borderRadius: 4,
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    color: test.error ? 'var(--color-critical)' : 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {test.traceback || test.stderr || test.error || test.stdout}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
