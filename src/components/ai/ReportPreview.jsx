import React from 'react';
import { BarChart2, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export default function ReportPreview() {
  const navigate = useNavigate();
  const { issues, testCases, appliedFixes, project } = useAppStore();

  const totalIssues = issues.length;
  const fixedCount = appliedFixes.length;
  const remainingCount = totalIssues - fixedCount;
  const passedTests = testCases.filter(t => t.status === 'passed').length;
  const totalTests = testCases.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header card */}
      <div className="card" style={{ gap: 6, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
            <BarChart2 size={16} color="#38bdf8" />
            <span>Telemetry Summary</span>
          </div>
          <span className="badge badge-success" style={{ fontSize: 9 }}>AutonomusAI</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {project?.name || 'Workspace'} telemetry and analysis findings.
        </div>
      </div>

      {/* Metrics 2x2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        <div className="card" style={{ padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8' }}>{totalIssues}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Issues Detected</div>
        </div>
        <div className="card" style={{ padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-success)' }}>{fixedCount}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Issues Patched</div>
        </div>
        <div className="card" style={{ padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: remainingCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {remainingCount}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Remaining</div>
        </div>
        <div className="card" style={{ padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#a855f7' }}>
            {passedTests}/{totalTests}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Tests Passing</div>
        </div>
      </div>

      {/* Code Quality Card */}
      <div className="card" style={{ gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
          <span>Code Quality Index</span>
          <span style={{ color: '#10b981' }}>{fixedCount > 0 ? '94/100 (A)' : '86/100 (B+)'}</span>
        </div>
        <div style={{ width: '100%', height: 6, backgroundColor: 'var(--bg-card-subtle)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: fixedCount > 0 ? '94%' : '86%', height: '100%', background: 'var(--grad-primary)' }} />
        </div>
      </div>

      {/* CTA Button to Full Reports Page */}
      <button 
        className="btn btn-primary-gradient" 
        style={{ height: 34, fontSize: 12, marginTop: 4 }}
        onClick={() => navigate('/reports')}
      >
        <span>Open Full Reports & Analytics</span>
        <ArrowRight size={13} />
      </button>
    </div>
  );
}
