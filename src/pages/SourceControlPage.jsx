import React, { useState } from 'react';
import { GitBranch, GitCommit, Check, RefreshCw, FileCode, ArrowUpRight, FolderGit2, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function SourceControlPage() {
  const { currentProject, selectedBranch, files, appliedFixes, issues, setConnectRepoModalOpen, saveActiveFile } = useAppStore();
  const [commitMsg, setCommitMsg] = useState('');
  const [committed, setCommitted] = useState(false);

  // Find all dirty files or files with applied fixes
  const modifiedFiles = Object.values(files).filter(f => f.isDirty);
  const fixedFilePaths = issues.filter(i => appliedFixes.includes(i.id)).map(i => i.filePath || i.file);
  const changedPaths = Array.from(new Set([...modifiedFiles.map(f => f.path), ...fixedFilePaths]));

  const handleCommit = (e) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;
    setCommitted(true);
    setTimeout(() => {
      setCommitted(false);
      setCommitMsg('');
    }, 2500);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-badge" style={{ width: 32, height: 32 }}>
            <GitBranch size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Source Control (Git)</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Project: <strong style={{ color: 'var(--text-primary)' }}>{currentProject?.name || 'Workspace'}</strong> • Branch: <strong style={{ color: '#a855f7' }}>{selectedBranch}</strong>
            </p>
          </div>
        </div>

        {currentProject?.source_type !== 'github' && (
          <button 
            className="btn btn-secondary" 
            onClick={() => setConnectRepoModalOpen(true)}
            style={{ height: 30, fontSize: 11 }}
          >
            <FolderGit2 size={13} />
            <span>Connect GitHub Repository</span>
          </button>
        )}
      </div>

      {/* Commit Box */}
      <div className="card" style={{ padding: '14px', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Commit Workspace Changes
        </div>

        <form onSubmit={handleCommit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            rows={2}
            placeholder="Commit message (e.g. fix: patch runtime error)..."
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            style={{ padding: '8px 10px', fontSize: 12, resize: 'none' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Changes saved to managed workspace</span>
            <button 
              type="submit" 
              className="btn btn-primary-gradient" 
              disabled={changedPaths.length === 0 || !commitMsg.trim()}
              style={{ height: 30, fontSize: 11 }}
            >
              <GitCommit size={13} />
              <span>{committed ? 'Changes Staged to ' + selectedBranch : 'Stage & Record Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Changes list */}
      <div className="card" style={{ padding: '14px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Working Tree Changes ({changedPaths.length})
          </div>
        </div>

        {changedPaths.length === 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '16px',
            color: 'var(--text-muted)', fontSize: 12, justifyContent: 'center'
          }}>
            <CheckCircle2 size={16} color="var(--color-success)" />
            <span>Working tree clean. No unsaved changes in workspace.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {changedPaths.map((path) => {
              const fileObj = files[path];
              const isDirty = fileObj?.isDirty;

              return (
                <div key={path} className="palette-item" style={{ padding: '8px 12px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCode size={14} color="#38bdf8" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{path}</span>
                  </div>
                  {isDirty ? (
                    <span className="badge badge-warning" style={{ fontSize: 9 }}>Unsaved Changes</span>
                  ) : (
                    <span className="badge badge-success" style={{ fontSize: 9 }}>Patched</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
