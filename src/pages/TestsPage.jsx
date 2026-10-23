import React, { useState } from 'react';
import { 
  FlaskConical, Play, CheckCircle2, XCircle, RotateCw, 
  Clock, ShieldAlert, FileText, Check, ChevronRight, ChevronDown 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function TestsPage() {
  const { testCases, runTests, isTestingRunning, currentProject, lastTestOutput } = useAppStore();
  const [activeTestId, setActiveTestId] = useState(null);

  const passed = testCases.filter(t => t.status === 'passed').length;
  const failed = testCases.filter(t => t.status === 'failed').length;
  const total = testCases.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const activeTest = testCases.find(t => t.id === activeTestId) || testCases[0] || null;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-badge" style={{ width: 32, height: 32 }}>
            <FlaskConical size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Test Suite Management</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Sandbox Pytest execution, automated regression guards, and test tracebacks for {currentProject?.name || 'Workspace'}
            </p>
          </div>
        </div>

        <button 
          className="btn btn-primary-gradient" 
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
              <Play size={13} fill="#fff" />
              <span>Run All Unit Tests</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div className="card" style={{ padding: '12px', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Test Cases</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{total}</div>
        </div>
        <div className="card" style={{ padding: '12px', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passing</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-success)' }}>{passed}</div>
        </div>
        <div className="card" style={{ padding: '12px', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Failing</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: failed > 0 ? 'var(--color-critical)' : 'var(--color-success)' }}>{failed}</div>
        </div>
        <div className="card" style={{ padding: '12px', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pass Rate</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8' }}>{total > 0 ? `${passRate}%` : '—'}</div>
        </div>
      </div>

      {/* Content or Empty State */}
      {total === 0 ? (
        <div style={{
          padding: '48px 20px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}>
          {lastTestOutput?.reason ? (
            <>
              <ShieldAlert size={36} color="#f59e0b" />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {lastTestOutput.reason}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 440, margin: 0, lineHeight: 1.5 }}>
                Tests are isolated and will not execute arbitrary repository code directly on the host system without a configured sandbox.
              </p>
            </>
          ) : (
            <>
              <Clock size={36} color="var(--border-focus)" />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                No tests have been run yet.
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 440, margin: 0, lineHeight: 1.5 }}>
                Click "Run All Unit Tests" to verify syntax, assertions, and defensive boundary guards across your project.
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 16, flex: 1, minHeight: 340 }}>
          {/* Left: Test Cases List */}
          <div className="card" style={{ padding: '12px', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Execution Results
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              {testCases.map((t) => {
                const isSelected = activeTestId === t.id;
                const isPassed = t.status === 'passed';

                return (
                  <div
                    key={t.id}
                    className={`palette-item ${isSelected ? 'active' : ''}`}
                    style={{ 
                      padding: '8px 12px', 
                      border: '1px solid var(--border-subtle)',
                      borderLeft: `4px solid ${isPassed ? 'var(--color-success)' : 'var(--color-critical)'}`,
                      borderRadius: 'var(--radius-sm)'
                    }}
                    onClick={() => setActiveTestId(t.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isPassed ? <CheckCircle2 size={15} color="var(--color-success)" /> : <XCircle size={15} color="var(--color-critical)" />}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>
                        {t.name || t.test_name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>{t.duration_ms ? `${t.duration_ms}ms` : '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Test Output / Traceback */}
          <div className="card" style={{ padding: '14px', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Diagnostic Output &amp; Traceback
            </div>

            {activeTest ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>
                  {activeTest.name || activeTest.test_name}
                </div>
                {(activeTest.error || activeTest.stderr) && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--color-critical-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-critical)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {activeTest.traceback || activeTest.stderr || activeTest.error}
                  </div>
                )}
                {activeTest.stdout && (
                  <div style={{
                    backgroundColor: 'var(--bg-code-block)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {activeTest.stdout}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Select a test on the left to view output and tracebacks.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
