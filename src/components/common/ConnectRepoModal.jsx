import React, { useState } from 'react';
import { GitBranch, X, Sparkles, CheckCircle2, AlertCircle, Loader2, FolderGit2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { githubApi } from '../../api/github';
import { normalizeError } from '../../api/client';

export default function ConnectRepoModal() {
  const {
    isConnectRepoModalOpen,
    setConnectRepoModalOpen,
    loadProjects,
    selectProject,
    addNotification
  } = useAppStore();

  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isConnectRepoModalOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    setConnectRepoModalOpen(false);
    setRepoUrl('');
    setBranch('');
    setErrorMessage('');
    setSuccessInfo(null);
    setImportProgress(0);
    setStatusMessage('');
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setErrorMessage('Please enter a valid GitHub repository URL.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessInfo(null);
    setImportProgress(10);
    setStatusMessage('Validating repository and querying GitHub API...');

    try {
      const response = await githubApi.importRepo({
        url: repoUrl.trim(),
        branch: branch.trim() || undefined,
      });

      const jobId = response.job_id;
      const projectId = response.project_id;

      // Poll import job status
      const pollJob = setInterval(async () => {
        try {
          const job = await githubApi.getImportStatus(jobId);
          setImportProgress(job.progress || 30);
          setStatusMessage(`Processing files (${job.files_processed || 0}/${job.total_files || '...'})`);

          if (job.status === 'completed') {
            clearInterval(pollJob);
            setIsLoading(false);
            setImportProgress(100);
            setStatusMessage('Repository imported successfully!');
            setSuccessInfo({
              filesCount: job.files_processed,
              projectId,
            });

            // Reload projects and switch to this newly imported project
            await loadProjects();
            if (projectId) {
              await selectProject(projectId);
            }

            addNotification({
              title: 'Repository Connected',
              message: `Imported ${job.files_processed} file(s) into workspace`,
              type: 'success',
            });
          } else if (job.status === 'failed') {
            clearInterval(pollJob);
            setIsLoading(false);
            setErrorMessage(job.error_summary || 'Repository import failed.');
          }
        } catch (pollErr) {
          clearInterval(pollJob);
          setIsLoading(false);
          setErrorMessage(normalizeError(pollErr));
        }
      }, 800);

    } catch (err) {
      setIsLoading(false);
      setErrorMessage(normalizeError(err));
    }
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div className="card" style={{
        width: 500, maxWidth: '90vw', padding: 24, borderRadius: 12,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid var(--border-focus)',
        gap: 16
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-badge" style={{ width: 32, height: 32, backgroundColor: '#24292e' }}>
              <FolderGit2 size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Connect GitHub Repository</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Import any public repository to analyze, debug, and test</p>
            </div>
          </div>

          <button
            className="icon-action-btn"
            onClick={handleClose}
            disabled={isLoading}
            style={{ width: 28, height: 28 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content / Form */}
        {!successInfo ? (
          <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Repository URL <span style={{ color: 'var(--color-critical)' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%', padding: '8px 12px', fontSize: 12,
                  backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none'
                }}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Example: https://github.com/pallets/flask or https://github.com/psf/requests
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Branch (Optional)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <GitBranch size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="main, master, or dev (defaults to default branch)"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={isLoading}
                  style={{
                    flex: 1, padding: '7px 10px', fontSize: 12,
                    backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--color-critical)', borderRadius: 'var(--radius-sm)',
                fontSize: 11, color: 'var(--color-critical)'
              }}>
                <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Progress Bar while loading */}
            {isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>{statusMessage}</span>
                  <span style={{ fontWeight: 700 }}>{importProgress}%</span>
                </div>
                <div style={{ height: 6, backgroundColor: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${importProgress}%`,
                    backgroundColor: '#38bdf8', transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isLoading}
                style={{ height: 32, fontSize: 11 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-gradient"
                disabled={isLoading || !repoUrl.trim()}
                style={{ height: 32, fontSize: 11 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Import Repository</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, padding: '16px 0' }}>
            <CheckCircle2 size={42} color="var(--color-success)" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Repository Ready!</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Imported <strong>{successInfo.filesCount}</strong> files into your AutonomusAI project workspace.
              </p>
            </div>
            <button
              className="btn btn-primary-gradient"
              onClick={handleClose}
              style={{ marginTop: 8, height: 34, padding: '0 20px', fontSize: 12 }}
            >
              Open in Editor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
