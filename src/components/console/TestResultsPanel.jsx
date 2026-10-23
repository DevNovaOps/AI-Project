import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Play, RotateCw, ChevronDown, ChevronRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function TestResultsPanel() {
  const { testCases, runTests, isTestingRunning, lastTestOutput } = useAppStore();
  const [expandedTests, setExpandedTests] = useState({});

  const passedCount = testCases.filter(t => t.status === 'passed').length;
  const failedCount = testCases.filter(t => t.status === 'failed').length;
  const totalCount = testCases.length;

  const toggleExpand = (id) => {
    setExpandedTests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* Top Summary & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <span>Total: {totalCount}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <CheckCircle2 size={12} /> {passedCount} Passed
            </span>
            {failedCount > 0 && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span style={{ color: 'var(--color-critical)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <XCircle size={12} /> {failedCount} Failed
                </span>
              </>
            )}
          </div>
        </div>

        <button 
          className="btn btn-secondary" 
          style={{ height: 26, fontSize: 11 }}
          onClick={runTests}
          disabled={isTestingRunning}
        >
          {isTestingRunning ? (
            <>
              <div className="animate-spin" style={{ width: 11, height: 11, border: '1.5px solid var(--text-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
              <span>Testing...</span>
            </>
          ) : (
            <>
              <Play size={11} fill="currentColor" />
              <span>Run Tests</span>
            </>
          )}
        </button>
      </div>

      {/* Tests Content or Empty State */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {totalCount === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 8, color: 'var(--text-muted)', padding: '24px', textAlign: 'center'
          }}>
            {lastTestOutput?.reason ? (
              <>
                <ShieldAlert size={28} color="#f59e0b" />
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {lastTestOutput.reason}
                </div>
                <div style={{ fontSize: 11 }}>
                  Tests run only inside isolated Docker/gVisor sandboxes to protect host system security.
                </div>
              </>
            ) : (
              <>
                <Clock size={28} color="var(--border-focus)" />
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  No tests have been run yet.
                </div>
                <div style={{ fontSize: 11 }}>
                  Click "Run Tests" to execute the test suite in the secure sandbox boundary.
                </div>
              </>
            )}
          </div>
        ) : (
          testCases.map((test) => {
            const isExpanded = expandedTests[test.id] || false;
            const isPassed = test.status === 'passed';

            return (
              <div 
                key={test.id} 
                className="card" 
                style={{ 
                  padding: '6px 10px', 
                  borderLeft: `3px solid ${isPassed ? 'var(--color-success)' : 'var(--color-critical)'}`,
                  gap: 4
                }}
              >
                <div 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => toggleExpand(test.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isExpanded ? <ChevronDown size={13} color="var(--text-muted)" /> : <ChevronRight size={13} color="var(--text-muted)" />}
                    {isPassed ? (
                      <CheckCircle2 size={14} color="var(--color-success)" />
                    ) : (
                      <XCircle size={14} color="var(--color-critical)" />
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {test.name || test.test_name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{test.file || test.test_file}</span>
                    <span>{test.duration_ms ? `${test.duration_ms}ms` : '—'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 4, paddingLeft: 22 }}>
                    {(test.error || test.stderr) && (
                      <div style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid var(--color-critical-border)', 
                        borderRadius: 'var(--radius-sm)', 
                        padding: '6px 10px', 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: 11, 
                        color: 'var(--color-critical)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {test.traceback || test.stderr || test.error}
                      </div>
                    )}
                    {test.stdout && (
                      <div style={{ 
                        fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: 2 
                      }}>
                        {test.stdout}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
