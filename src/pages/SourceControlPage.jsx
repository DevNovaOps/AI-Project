import React, { useState, useMemo } from 'react';
import { 
  GitBranch, GitCommit, Check, RefreshCw, FileCode, ArrowUpRight, 
  FolderGit2, CheckCircle2, UploadCloud, GitPullRequest, ExternalLink, 
  Lock, Key, ShieldCheck, Sparkles, Clock, AlertCircle, Eye, EyeOff,
  History, ArrowRight, CornerDownRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function SourceControlPage() {
  const { 
    currentProject, 
    selectedBranch, 
    files, 
    appliedFixes, 
    issues, 
    commits = [], 
    isPushing, 
    recordCommit, 
    pushToGitHub, 
    openTab, 
    setConnectRepoModalOpen, 
    addNotification 
  } = useAppStore();

  const [commitMsg, setCommitMsg] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  
  // Push Modal State
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [patToken, setPatToken] = useState(() => localStorage.getItem('aetherion_github_token') || '');
  const [showToken, setShowToken] = useState(false);
  const [targetBranch, setTargetBranch] = useState(selectedBranch || 'main');
  const [pushMode, setPushMode] = useState('direct'); // 'direct' | 'pr'
  const [prTitle, setPrTitle] = useState('');
  const [pushResult, setPushResult] = useState(null);
  const [pushError, setPushError] = useState(null);

  // 1. Detect all modified, patched, or unsaved files in working tree
  const changedPaths = useMemo(() => {
    const setPaths = new Set();

    // Check files in store
    Object.values(files || {}).forEach((f) => {
      if (!f || (!f.path && !f.name)) return;
      const path = f.path || f.name;

      if (f.isDirty) {
        setPaths.add(path);
      } else if (f.content !== undefined && f.baseContent !== undefined && f.content !== f.baseContent) {
        setPaths.add(path);
      } else if (f.content !== undefined && f.originalContent !== undefined && f.content !== f.originalContent) {
        setPaths.add(path);
      }
    });

    // Check applied fixes from issues
    if (appliedFixes && appliedFixes.length > 0 && issues) {
      issues.forEach((iss) => {
        if (appliedFixes.includes(iss.id)) {
          const p = iss.filePath || iss.file;
          if (p) setPaths.add(p);
        }
      });
    }

    return Array.from(setPaths);
  }, [files, appliedFixes, issues]);

  // Count unpushed commits
  const unpushedCount = useMemo(() => {
    return commits.filter((c) => !c.pushed).length;
  }, [commits]);

  // AI-assisted commit message generator
  const handleGenerateAiCommitMessage = () => {
    if (changedPaths.length === 0) return;

    const fixedIssues = (issues || []).filter((i) => appliedFixes?.includes(i.id));
    if (fixedIssues.length > 0) {
      const titles = fixedIssues.map((i) => i.title.toLowerCase().replace(/^(error|bug|issue):\s*/i, ''));
      const summary = titles.slice(0, 3).join(', ');
      setCommitMsg(`fix: resolve ${summary}${titles.length > 3 ? ` and ${titles.length - 3} more` : ''}`);
    } else {
      const fileNames = changedPaths.map((p) => p.split('/').pop()).slice(0, 2).join(', ');
      setCommitMsg(`fix: update and harden ${fileNames}${changedPaths.length > 2 ? ` and ${changedPaths.length - 2} files` : ''}`);
    }
  };

  // Handle local commit
  const handleCommit = async (e) => {
    e.preventDefault();
    if (!commitMsg.trim() || changedPaths.length === 0) return;

    setIsCommitting(true);
    try {
      await recordCommit(commitMsg.trim());
      setCommitMsg('');
    } catch (err) {
      console.error('Commit failed:', err);
    } finally {
      setIsCommitting(false);
    }
  };

  // Open push modal with intelligent default PR title
  const handleOpenPushModal = () => {
    setPushError(null);
    setPushResult(null);
    setTargetBranch(selectedBranch || 'main');
    if (!prTitle) {
      const latestCommit = commits[0];
      setPrTitle(latestCommit?.message || `AETHERION AI: Verified fixes for ${currentProject?.name || 'project'}`);
    }
    setIsPushModalOpen(true);
  };

  // Execute GitHub push
  const handleExecutePush = async () => {
    setPushError(null);
    setPushResult(null);

    try {
      const res = await pushToGitHub({
        branch: targetBranch.trim() || selectedBranch || 'main',
        commitMessage: commits[0]?.message || 'fix: apply verified AI repairs and workspace changes',
        token: patToken.trim(),
        createPr: pushMode === 'pr',
        prTitle: prTitle.trim(),
      });

      setPushResult(res);
    } catch (err) {
      setPushError(err.message || 'Push failed. Please verify your token and branch permissions.');
    }
  };

  // Check if project is linked to GitHub
  const isGitHubRepo = currentProject?.source_type === 'github' || currentProject?.name?.includes('/');

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="logo-badge" style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <GitBranch size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Source Control (Git &amp; Remote)</h1>
              <span className="badge badge-info" style={{ fontSize: 10, padding: '2px 8px' }}>
                Branch: {selectedBranch || 'main'}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Project: <strong style={{ color: 'var(--text-primary)' }}>{currentProject?.name || 'Workspace'}</strong>
              {isGitHubRepo && (
                <span> • <span style={{ color: '#38bdf8' }}>GitHub Linked</span></span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Push to GitHub Button */}
          <button 
            className="btn btn-primary-gradient" 
            onClick={handleOpenPushModal}
            style={{ height: 34, fontSize: 12, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px' }}
          >
            <UploadCloud size={15} />
            <span>Push Changes to GitHub</span>
            {unpushedCount > 0 && (
              <span style={{ 
                background: 'rgba(255, 255, 255, 0.25)', 
                color: '#fff', 
                borderRadius: '10px', 
                padding: '1px 6px', 
                fontSize: 10, 
                fontWeight: 700 
              }}>
                {unpushedCount}
              </span>
            )}
          </button>

          {!isGitHubRepo && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setConnectRepoModalOpen(true)}
              style={{ height: 34, fontSize: 12 }}
            >
              <FolderGit2 size={14} />
              <span>Connect GitHub Repository</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left is Commit & Working Tree, Right is Commit History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Left Column: Stage, Commit & Working Tree */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Commit Workspace Changes Card */}
          <div className="card" style={{ padding: '16px', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <GitCommit size={15} color="#38bdf8" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Stage &amp; Record Changes
                </span>
              </div>
              {changedPaths.length > 0 && (
                <button
                  type="button"
                  onClick={handleGenerateAiCommitMessage}
                  className="btn btn-secondary"
                  style={{ height: 24, fontSize: 10, padding: '0 8px', gap: 4, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                >
                  <Sparkles size={11} />
                  <span>AI Message</span>
                </button>
              )}
            </div>

            <form onSubmit={handleCommit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                rows={3}
                placeholder="Commit message (e.g. fix: patch runtime error and update calculation formula)..."
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                style={{ 
                  padding: '10px 12px', 
                  fontSize: 12, 
                  resize: 'none', 
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card-subtle)',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {changedPaths.length} file(s) staged for commit to <strong style={{ color: 'var(--text-primary)' }}>{selectedBranch}</strong>
                </span>

                <button 
                  type="submit" 
                  className="btn btn-primary-gradient" 
                  disabled={changedPaths.length === 0 || !commitMsg.trim() || isCommitting}
                  style={{ height: 32, fontSize: 11, padding: '0 14px' }}
                >
                  <GitCommit size={13} />
                  <span>{isCommitting ? 'Recording...' : 'Stage & Record Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Working Tree Changes Card */}
          <div className="card" style={{ padding: '16px', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Working Tree Changes</span>
                <span className="badge badge-info" style={{ fontSize: 10 }}>{changedPaths.length}</span>
              </div>
            </div>

            {changedPaths.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 16px',
                color: 'var(--text-muted)', fontSize: 12, justifyContent: 'center', textAlign: 'center'
              }}>
                <CheckCircle2 size={24} color="var(--color-success)" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Working tree clean</span>
                <span style={{ fontSize: 11 }}>All workspace modifications and patches are recorded. Ready to push to GitHub.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {changedPaths.map((path) => {
                  const fileObj = files[path] || Object.values(files).find(f => f.path === path || f.name === path);
                  const isDirty = fileObj?.isDirty;
                  const isPatched = appliedFixes && appliedFixes.length > 0 && issues.some(i => appliedFixes.includes(i.id) && (i.filePath === path || i.file === path));

                  return (
                    <div 
                      key={path} 
                      className="palette-item" 
                      style={{ 
                        padding: '10px 14px', 
                        background: 'var(--bg-card-subtle)', 
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                      onClick={() => openTab(path)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileCode size={15} color="#38bdf8" />
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
                            {path}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {fileObj?.language || 'source code'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isPatched ? (
                          <span className="badge badge-success" style={{ fontSize: 9 }}>AI Patched</span>
                        ) : isDirty ? (
                          <span className="badge badge-warning" style={{ fontSize: 9 }}>Modified</span>
                        ) : (
                          <span className="badge badge-info" style={{ fontSize: 9 }}>Changed</span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>View File &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Commit History & Remote Sync */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card" style={{ padding: '16px', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={16} color="#8b5cf6" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Commit History ({commits.length})
                </span>
              </div>
              {commits.length > 0 && unpushedCount > 0 && (
                <button
                  type="button"
                  onClick={handleOpenPushModal}
                  className="btn btn-primary-gradient"
                  style={{ height: 26, fontSize: 10, padding: '0 10px', gap: 4 }}
                >
                  <UploadCloud size={11} />
                  <span>Push {unpushedCount} Commit(s)</span>
                </button>
              )}
            </div>

            {commits.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '30px 16px',
                color: 'var(--text-muted)', fontSize: 12, textAlign: 'center'
              }}>
                <GitCommit size={24} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                <span>No local commits recorded yet</span>
                <span style={{ fontSize: 11 }}>Stage workspace changes above to record your first commit.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {commits.map((c, idx) => (
                  <div 
                    key={c.id || idx} 
                    style={{ 
                      padding: '12px 14px', 
                      background: 'var(--bg-card-subtle)', 
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: 11, 
                          color: '#38bdf8', 
                          background: 'rgba(56, 189, 248, 0.1)', 
                          padding: '2px 6px', 
                          borderRadius: 4,
                          fontWeight: 700 
                        }}>
                          {c.sha || c.id}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          branch: <strong style={{ color: 'var(--text-primary)' }}>{c.branch}</strong>
                        </span>
                      </div>

                      {c.pushed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="badge badge-success" style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={10} />
                            <span>Pushed to GitHub</span>
                          </span>
                          {c.commitUrl && (
                            <a 
                              href={c.commitUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}
                              title="View commit on GitHub"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {c.prUrl && (
                            <a 
                              href={c.prUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ color: '#a855f7', display: 'flex', alignItems: 'center', marginLeft: 4 }}
                              title="View Pull Request on GitHub"
                            >
                              <GitPullRequest size={12} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: 9 }}>
                          Local Commit (Unpushed)
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {c.message}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        <span>{c.timestamp || 'Recorded recently'}</span>
                      </div>
                      <span>{c.filesCount || (c.files ? c.files.length : 1)} file(s) changed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Push to GitHub Modal Dialog */}
      {isPushModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 540, padding: 24, gap: 16 }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="logo-badge" style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
                  <UploadCloud size={16} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Push Changes to GitHub</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Commit and push verified repairs directly to your remote repository</p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setIsPushModalOpen(false)}
                className="btn btn-secondary" 
                style={{ width: 28, height: 28, padding: 0, borderRadius: '50%' }}
              >
                &times;
              </button>
            </div>

            {/* Target Repository Info */}
            <div style={{ 
              padding: '12px 14px', 
              background: 'var(--bg-card-subtle)', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Remote Repository</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <FolderGit2 size={14} color="#38bdf8" />
                  <span>{currentProject?.name || 'GitHub Repository'}</span>
                </div>
              </div>
              <span className="badge badge-info" style={{ fontSize: 10 }}>Creator / Collaborator</span>
            </div>

            {/* GitHub Personal Access Token (PAT) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Key size={13} color="#f59e0b" />
                  <span>GitHub Personal Access Token (PAT)</span>
                </label>
                <a 
                  href="https://github.com/settings/tokens" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <span>Generate Token</span>
                  <ExternalLink size={11} />
                </a>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
                  value={patToken}
                  onChange={(e) => setPatToken(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 36px 8px 12px',
                    fontSize: 12,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card-subtle)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4
                  }}
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Requires <code>repo</code> write permission to commit changes or create pull requests. Token is saved securely in your local session.
              </span>
            </div>

            {/* Target Branch and Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Target Branch</label>
                <input
                  type="text"
                  placeholder="main"
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card-subtle)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Push Action</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn btn-secondary ${pushMode === 'direct' ? 'active' : ''}`}
                    onClick={() => setPushMode('direct')}
                    style={{ flex: 1, height: 34, fontSize: 11, borderColor: pushMode === 'direct' ? '#38bdf8' : undefined }}
                  >
                    <span>Direct Push</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-secondary ${pushMode === 'pr' ? 'active' : ''}`}
                    onClick={() => setPushMode('pr')}
                    style={{ flex: 1, height: 34, fontSize: 11, borderColor: pushMode === 'pr' ? '#a855f7' : undefined }}
                  >
                    <span>Create PR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Optional PR Title */}
            {pushMode === 'pr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Pull Request Title</label>
                <input
                  type="text"
                  placeholder="fix: resolve weather computation and cache bugs"
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}

            {/* Success Banner */}
            {pushResult && (
              <div style={{ 
                padding: '12px 14px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', 
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)', fontWeight: 600, fontSize: 12 }}>
                  <CheckCircle2 size={16} />
                  <span>{pushResult.message || 'Pushed to GitHub successfully!'}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, marginTop: 4 }}>
                  {pushResult.commit_url && (
                    <a 
                      href={pushResult.commit_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>View Commit on GitHub</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                  {pushResult.pr_url && (
                    <a 
                      href={pushResult.pr_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: '#a855f7', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span>View Pull Request #{pushResult.pr_number}</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Error Banner */}
            {pushError && (
              <div style={{ 
                padding: '12px 14px', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#f87171',
                fontSize: 12
              }}>
                <AlertCircle size={16} />
                <span>{pushError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button 
                type="button" 
                onClick={() => setIsPushModalOpen(false)}
                className="btn btn-secondary" 
                style={{ height: 34, fontSize: 12 }}
              >
                Close
              </button>
              <button 
                type="button" 
                onClick={handleExecutePush}
                disabled={isPushing || !patToken.trim()}
                className="btn btn-primary-gradient" 
                style={{ height: 34, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {isPushing ? (
                  <>
                    <RefreshCw size={13} className="spin" />
                    <span>Pushing to GitHub...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    <span>Push to {targetBranch || 'main'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
