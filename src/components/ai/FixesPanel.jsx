import React, { useState } from 'react';
import { 
  Sparkles, Wrench, CheckCircle, Undo2, Copy, Check, 
  ChevronRight, ArrowRight, ShieldCheck, FileCode, CheckCircle2 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import CodeDiff from '../editor/CodeDiff';

export default function FixesPanel() {
  const { issues, selectedIssueId, applyFix, undoFix, appliedFixes, files } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState('suggestions'); // 'suggestions' | 'autofix' | 'refactor' | 'optimize' | 'explain'
  const [copied, setCopied] = useState(false);

  const issue = issues.find(i => i.id === selectedIssueId) || issues[0];
  const isApplied = appliedFixes.includes(issue.id) || issue.status === 'Fixed';

  const subTabs = [
    { id: 'suggestions', label: 'Fix Suggestions' },
    { id: 'autofix', label: 'Auto Fix' },
    { id: 'refactor', label: 'Refactor' },
    { id: 'optimize', label: 'Optimize' },
    { id: 'explain', label: 'Explain' }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(issue.appliedFixSnippet || issue.suggestedFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Sub-navigation tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, borderBottom: '1px solid var(--border-subtle)' }}>
        {subTabs.map((st) => (
          <button
            key={st.id}
            className={`btn btn-secondary ${activeSubTab === st.id ? 'active' : ''}`}
            style={{ 
              height: 24, fontSize: 10, padding: '0 8px', whiteSpace: 'nowrap',
              color: activeSubTab === st.id ? '#38bdf8' : undefined,
              borderColor: activeSubTab === st.id ? 'var(--border-focus)' : undefined
            }}
            onClick={() => setActiveSubTab(st.id)}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Issue Summary Card */}
      <div className="card" style={{ gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
            <span>{issue.title}</span>
            <span className="badge badge-critical" style={{ fontSize: 9 }}>{issue.severity}</span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{issue.file}:{issue.line}</span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {issue.detail}
        </div>
      </div>

      {/* Code Diff Viewer */}
      <div style={{ marginTop: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
          Interactive Code Diff
        </div>
        <CodeDiff issueId={issue.id} originalSnippet={issue.codeSnippet} fixedSnippet={issue.suggestedFix} />
      </div>

      {/* Fix Preview Card */}
      <div className="card" style={{ gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
            Result Preview
          </div>
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22 }}
            onClick={handleCopy}
            title="Copy resulting code"
          >
            {copied ? <Check size={11} color="var(--color-success)" /> : <Copy size={11} />}
          </button>
        </div>

        <div style={{ 
          backgroundColor: 'var(--bg-code-block)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '8px 10px', 
          fontFamily: 'var(--font-mono)', 
          fontSize: 10,
          color: 'var(--text-secondary)',
          lineHeight: 1.5
        }}>
          <div><span className="token-keyword">def</span> <span className="token-function">calculate_average</span>(numbers):</div>
          <div>    <span className="token-comment"># Guard against empty list or invalid inputs</span></div>
          <div>    <span className="token-keyword">if not</span> numbers <span className="token-keyword">or</span> <span className="token-function">len</span>(numbers) == <span className="token-number">0</span>:</div>
          <div>        <span className="token-keyword">return</span> <span className="token-number">0</span></div>
          <div>    <span className="token-keyword">return</span> <span className="token-function">sum</span>(numbers) / <span className="token-function">len</span>(numbers)</div>
        </div>
      </div>

      {/* Primary Actions Bar */}
      <div style={{ display: 'flex', gap: 6 }}>
        {isApplied ? (
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, height: 32 }}
            onClick={() => undoFix(issue.id)}
          >
            <Undo2 size={13} />
            <span>Undo Applied Fix</span>
          </button>
        ) : (
          <button 
            className="btn btn-primary-gradient" 
            style={{ flex: 1, height: 32 }}
            onClick={() => applyFix(issue.id)}
          >
            <Sparkles size={13} />
            <span>Apply Fix to Workspace</span>
          </button>
        )}
      </div>

      {/* Additional Improvements */}
      <div className="card" style={{ gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
          Optional Improvements
        </div>
        {[
          { label: 'Add input type validation (list/tuple check)', tag: 'Recommended' },
          { label: 'Add Google-style docstrings (PEP 257)', tag: 'Best Practice' },
          { label: 'Add parameterized edge-case unit tests', tag: 'Testing' }
        ].map((opt, idx) => (
          <div key={idx} className="palette-item" style={{ padding: '6px 8px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>{opt.label}</span>
            <span className="badge badge-info" style={{ fontSize: 9 }}>{opt.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
