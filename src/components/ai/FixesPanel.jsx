import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Wrench, CheckCircle, Undo2, Copy, Check, 
  ChevronRight, ChevronLeft, ArrowRight, ShieldCheck, FileCode, 
  CheckCircle2, AlertCircle, Lightbulb, Play, RotateCw, Send, Zap
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import CodeDiff from '../editor/CodeDiff';
import { generateCodeFix } from '../../utils/fixGenerator';
import { repairsApi } from '../../api/services';

export default function FixesPanel() {
  const { 
    issues, selectedIssueId, selectIssue, 
    applyFix, undoFix, appliedFixes, 
    files, activeFilePath, addIssue
  } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState('suggestions');
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const subTabs = [
    { id: 'suggestions', label: 'Fix Suggestions' },
    { id: 'autofix', label: 'Auto Fix' },
    { id: 'refactor', label: 'Refactor' },
    { id: 'optimize', label: 'Optimize' }
  ];

  // Active file content from workspace
  const currentFile = activeFilePath ? files[activeFilePath] : null;
  const currentCode = currentFile?.content || '';
  const currentFilename = currentFile?.name || activeFilePath || 'main.py';

  // Get selected issue or default to first issue
  const activeIssue = issues.find(i => i.id === selectedIssueId) || issues[0] || null;
  const isApplied = activeIssue ? (appliedFixes.includes(activeIssue.id) || activeIssue.status === 'Fixed') : false;

  // Handle generation of a patch on-demand for any given code
  const handleGenerateFix = async (overrideMode, promptText) => {
    const targetMode = overrideMode || activeSubTab;
    const targetCode = currentCode || (activeIssue ? activeIssue.originalSnippet || activeIssue.codeSnippet : '');
    
    if (!targetCode.trim()) {
      return;
    }

    setIsGenerating(true);

    try {
      // 1. First generate deterministic local fix immediately
      const localFix = generateCodeFix(
        targetCode,
        currentFilename,
        currentFile?.language || 'python',
        targetMode,
        promptText || customPrompt
      );

      // 2. Try backend generator if available
      try {
        const backendRes = await repairsApi.generate({
          code: targetCode,
          filename: currentFilename,
          language: currentFile?.language || 'python',
          mode: targetMode,
          instructions: promptText || customPrompt || undefined
        });

        if (backendRes && backendRes.fixed_code) {
          localFix.suggestedFix = backendRes.fixed_code;
          localFix.title = backendRes.title || localFix.title;
          localFix.detail = backendRes.detail || localFix.detail;
          localFix.explanation = backendRes.explanation || localFix.detail;
        }
      } catch (err) {
        // Backend offline or error; seamlessly use local engine
      }

      // Add to store issues
      addIssue(localFix);
      setCustomPrompt('');
    } catch (e) {
      console.error('Fix generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  // When user switches subtab, synthesize corresponding proposal for the current file
  const handleSubTabChange = (modeId) => {
    setActiveSubTab(modeId);
    if (currentCode) {
      handleGenerateFix(modeId);
    }
  };

  const handleCopy = () => {
    if (activeIssue?.suggestedFix) {
      navigator.clipboard.writeText(activeIssue.suggestedFix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrevIssue = () => {
    if (issues.length === 0) return;
    const currentIndex = issues.findIndex(i => i.id === activeIssue?.id);
    if (currentIndex > 0) {
      selectIssue(issues[currentIndex - 1].id);
    }
  };

  const handleNextIssue = () => {
    if (issues.length === 0) return;
    const currentIndex = issues.findIndex(i => i.id === activeIssue?.id);
    if (currentIndex < issues.length - 1) {
      selectIssue(issues[currentIndex + 1].id);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    handleGenerateFix(activeSubTab, customPrompt);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
      {/* Sub-navigation tabs: Suggestions | Auto Fix | Refactor | Optimize */}
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
            onClick={() => handleSubTabChange(st.id)}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Context Pill: Shows current active file */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border-subtle)', fontSize: 11 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <FileCode size={13} color="#38bdf8" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {currentFilename}
          </span>
          {activeIssue?.line && (
            <span style={{ color: 'var(--text-muted)' }}>Line {activeIssue.line}</span>
          )}
        </div>

        {issues.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {issues.findIndex(i => i.id === activeIssue?.id) + 1} of {issues.length}
            </span>
            <button 
              className="icon-action-btn" 
              style={{ width: 18, height: 18 }}
              onClick={handlePrevIssue}
              title="Previous Fix Proposal"
            >
              <ChevronLeft size={11} />
            </button>
            <button 
              className="icon-action-btn" 
              style={{ width: 18, height: 18 }}
              onClick={handleNextIssue}
              title="Next Fix Proposal"
            >
              <ChevronRight size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Main Proposal Card or Ready State */}
      {activeIssue ? (
        <>
          {/* Issue Summary Card */}
          <div className="card" style={{ gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                <span>{activeIssue.title}</span>
              </div>
              <span className={`badge badge-${(activeIssue.severity || 'medium').toLowerCase()}`} style={{ fontSize: 9 }}>
                {activeIssue.severity || 'Medium'}
              </span>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {activeIssue.detail || activeIssue.message || activeIssue.rootCause}
            </div>
          </div>

          {/* Interactive Code Diff */}
          <div style={{ marginTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Interactive Unified Diff
              </div>
              <span style={{ fontSize: 9, color: 'var(--border-focus)', fontWeight: 600 }}>
                {activeSubTab.toUpperCase()}
              </span>
            </div>
            <CodeDiff 
              issueId={activeIssue.id} 
              originalSnippet={activeIssue.codeSnippet || activeIssue.originalSnippet || currentCode} 
              fixedSnippet={activeIssue.suggestedFix} 
            />
          </div>

          {/* Result Preview Card */}
          {activeIssue.suggestedFix && (
            <div className="card" style={{ gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={13} color="var(--color-success)" />
                  <span>Proposed Patched Code</span>
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
                fontSize: 11,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                maxHeight: 130,
                overflowY: 'auto'
              }}>
                {activeIssue.suggestedFix}
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {isApplied ? (
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, height: 32 }}
                onClick={() => undoFix(activeIssue.id)}
              >
                <Undo2 size={13} />
                <span>Undo Applied Fix</span>
              </button>
            ) : (
              <button 
                className="btn btn-primary-gradient" 
                style={{ flex: 1, height: 32 }}
                onClick={() => applyFix(activeIssue.id)}
                disabled={!activeIssue.suggestedFix || isGenerating}
              >
                <Sparkles size={13} />
                <span>Apply Fix to Workspace</span>
              </button>
            )}

            <button
              className="btn btn-secondary"
              style={{ width: 34, height: 32, padding: 0 }}
              onClick={() => handleGenerateFix(activeSubTab)}
              disabled={isGenerating}
              title="Regenerate proposal"
            >
              <RotateCw size={13} className={isGenerating ? 'animate-spin' : ''} />
            </button>
          </div>
        </>
      ) : (
        /* Empty / Ready to Fix State */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px', textAlign: 'center', gap: 12, backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--bg-card-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)'
          }}>
            <Wrench size={22} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Ready to Fix &amp; Harden Code
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
              Synthesize deterministic AST patches, runtime error guards, and performance refactoring for <b>{currentFilename}</b>.
            </div>
          </div>

          <button
            className="btn btn-primary-gradient"
            onClick={() => handleGenerateFix('suggestions')}
            disabled={isGenerating}
            style={{ height: 32, fontSize: 11, padding: '0 16px', marginTop: 4 }}
          >
            {isGenerating ? (
              <>
                <RotateCw size={12} className="animate-spin" />
                <span>Generating Patch...</span>
              </>
            ) : (
              <>
                <Sparkles size={12} />
                <span>Generate Fix for Current Code</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Quick Action Recipe Chips */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Quick Patch Recipes
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {[
            { label: 'Defensive Guards', mode: 'autofix', prompt: 'Add defensive null and bounds guards' },
            { label: 'Type Annotations', mode: 'refactor', prompt: 'Add strict typing and docstring' },
            { label: 'Error Boundary', mode: 'autofix', prompt: 'Wrap in defensive try-except block' },
            { label: 'Optimize Loop', mode: 'optimize', prompt: 'Optimize loop and memory allocation' },
            { label: 'Strict Equality', mode: 'autofix', prompt: 'Use strict equality and null checks' }
          ].map((chip, idx) => (
            <button
              key={idx}
              className="btn btn-secondary"
              style={{ height: 22, fontSize: 10, padding: '0 8px', borderRadius: 'var(--radius-full)' }}
              onClick={() => handleGenerateFix(chip.mode, chip.prompt)}
              disabled={isGenerating}
            >
              <Zap size={10} color="#38bdf8" style={{ marginRight: 3 }} />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Instruction Input Bar */}
      <div style={{ marginTop: 4 }}>
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: '0 8px', height: 32
          }}>
            <input
              type="text"
              placeholder="Ask custom fix (e.g. Handle empty input, add try-except)..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 11, outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary-gradient"
            style={{ width: 32, height: 32, padding: 0 }}
            title="Generate custom fix"
            disabled={!customPrompt.trim() || isGenerating}
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    </div>
  );
}
