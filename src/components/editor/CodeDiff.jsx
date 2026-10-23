import React, { useState, useMemo } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Sparkles, Undo2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

function computeSimpleDiff(original = '', modified = '') {
  const origLines = (original || '').split('\n');
  const modLines = (modified || '').split('\n');
  const result = [];

  // If identical
  if (original === modified && original) {
    return origLines.map((line, idx) => ({
      type: 'neutral',
      oldNo: idx + 1,
      newNo: idx + 1,
      text: line,
    }));
  }

  // Generate unified style lines
  let oldIdx = 1;
  let newIdx = 1;

  origLines.forEach((line) => {
    if (!modLines.includes(line)) {
      result.push({
        type: 'removed',
        oldNo: oldIdx++,
        newNo: null,
        text: `- ${line}`,
      });
    } else {
      result.push({
        type: 'neutral',
        oldNo: oldIdx++,
        newNo: newIdx++,
        text: `  ${line}`,
      });
    }
  });

  modLines.forEach((line) => {
    if (!origLines.includes(line)) {
      result.push({
        type: 'added',
        oldNo: null,
        newNo: newIdx++,
        text: `+ ${line}`,
      });
    }
  });

  return result.length > 0 ? result : [
    { type: 'neutral', oldNo: 1, newNo: 1, text: 'No differences detected.' }
  ];
}

export default function CodeDiff({ originalSnippet, fixedSnippet, issueId }) {
  const { applyFix, undoFix, appliedFixes } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const isApplied = appliedFixes.includes(issueId);

  const diffLines = useMemo(() => {
    return computeSimpleDiff(originalSnippet, fixedSnippet);
  }, [originalSnippet, fixedSnippet]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fixedSnippet || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Diff Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '8px 12px', background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-subtle)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}>
          <span style={{ color: 'var(--color-critical)' }}>- Original</span>
          <span>vs</span>
          <span style={{ color: 'var(--color-success)' }}>+ Proposed AI Patch</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button 
            className="btn btn-secondary" 
            style={{ height: 24, padding: '0 6px', fontSize: 10 }}
            onClick={handleCopy}
            title="Copy patch to clipboard"
          >
            {copied ? <Check size={11} color="var(--color-success)" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22 }}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse Diff' : 'Expand Diff'}
          >
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Diff Body */}
      {isExpanded && (
        <div className="code-diff-container" style={{ border: 'none', borderRadius: 0, maxHeight: 220, overflowY: 'auto' }}>
          {diffLines.map((line, idx) => (
            <div key={idx} className={`diff-line ${line.type}`}>
              <div className="diff-gutter">
                {line.oldNo ? line.oldNo : ' '}
              </div>
              <div className="diff-gutter" style={{ color: line.type === 'added' ? '#10b981' : undefined }}>
                {line.newNo ? line.newNo : ' '}
              </div>
              <div style={{ flex: 1, whiteSpace: 'pre', overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {line.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diff Footer Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {isApplied ? 'Patch applied to workspace file' : 'Click Apply Fix to patch workspace file'}
        </span>

        <div style={{ display: 'flex', gap: 6 }}>
          {isApplied ? (
            <button 
              className="btn btn-secondary" 
              style={{ height: 26, fontSize: 11 }}
              onClick={() => undoFix(issueId)}
            >
              <Undo2 size={12} />
              <span>Undo Fix</span>
            </button>
          ) : (
            <button 
              className="btn btn-primary-gradient" 
              style={{ height: 26, fontSize: 11 }}
              onClick={() => applyFix(issueId)}
            >
              <Sparkles size={12} />
              <span>Apply Fix</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
