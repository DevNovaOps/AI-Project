import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Play, RotateCw, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function TestResultsPanel() {
  const { testCases, runTests, isTestingRunning } = useAppStore();
  const [expandedTests, setExpandedTests] = useState({ 'test-3': true });

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
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
              <Clock size={11} /> 89ms
            </span>
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

      {/* Tests List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {testCases.map((test) => {
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
                    {test.name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{test.file}</span>
                  <span>{test.duration}</span>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 4, paddingLeft: 22 }}>
                  {test.error && (
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
                      {test.traceback || test.error}
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
        })}
      </div>
    </div>
  );
}
