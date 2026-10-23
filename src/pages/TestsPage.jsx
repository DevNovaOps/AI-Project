import React, { useState } from 'react';
import { 
  FlaskConical, Play, CheckCircle2, XCircle, RotateCw, 
  Clock, ShieldAlert, FileText, Check, ChevronRight, ChevronDown 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function TestsPage() {
  const { testCases, runTests, isTestingRunning, project } = useAppStore();
  const [activeTestId, setActiveTestId] = useState('test-3');

  const passed = testCases.filter(t => t.status === 'passed').length;
  const failed = testCases.filter(t => t.status === 'failed').length;
  const total = testCases.length;
  const passRate = Math.round((passed / total) * 100);

  const activeTest = testCases.find(t => t.id === activeTestId) || testCases[0];

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
              Pytest execution, automated regression guards, and test tracebacks for {project.name}
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
          <div style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8' }}>{passRate}%</div>
        </div>
      </div>

      {/* Two-Column Workspace: Test List on Left, Output/Traceback on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 16, flex: 1, minHeight: 340 }}>
        {/* Left: Test Cases List */}
        <div className="card" style={{ padding: '12px', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Registered Tests in tests/test_main.py
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
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.file}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.duration}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Inspection & Traceback */}
        <div className="card" style={{ padding: '16px', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {activeTest.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Status: {activeTest.status.toUpperCase()} • Duration: {activeTest.duration}</div>
            </div>
            <span className={activeTest.status === 'passed' ? 'badge badge-success' : 'badge badge-critical'}>
              {activeTest.status === 'passed' ? 'Passed' : 'Failed'}
            </span>
          </div>

          {activeTest.error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-critical)', textTransform: 'uppercase' }}>
                Failure Traceback
              </div>
              <div style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                border: '1px solid var(--color-critical-border)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '10px 12px', 
                fontFamily: 'var(--font-mono)', 
                fontSize: 11, 
                color: 'var(--color-critical)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5
              }}>
                {activeTest.traceback}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Execution Stdout
            </div>
            <div style={{ 
              backgroundColor: 'var(--bg-code-block)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '10px 12px', 
              fontFamily: 'var(--font-mono)', 
              fontSize: 11, 
              color: 'var(--text-secondary)' 
            }}>
              {activeTest.stdout || 'Test executed in Python 3.11 pytest runner without stdout pollution.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
