import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileCode, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { normalizeError } from '../../api/client';

export default function UploadProjectModal() {
  const {
    isUploadModalOpen,
    setUploadModalOpen,
    uploadFiles,
  } = useAppStore();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isUploadModalOpen) return null;

  const handleClose = () => {
    if (isUploading) return;
    setUploadModalOpen(false);
    setSelectedFiles([]);
    setErrorMessage('');
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setErrorMessage('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select one or more files or a ZIP archive.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      await uploadFiles(formData);
      setIsUploading(false);
      handleClose();
    } catch (err) {
      setIsUploading(false);
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
        width: 480, maxWidth: '90vw', padding: 24, borderRadius: 12,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid var(--border-focus)',
        gap: 16
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-badge" style={{ width: 32, height: 32 }}>
              <UploadCloud size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Upload Project Files</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Upload source code files or a ZIP project archive</p>
            </div>
          </div>

          <button
            className="icon-action-btn"
            onClick={handleClose}
            disabled={isUploading}
            style={{ width: 28, height: 28 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-focus)',
              borderRadius: 'var(--radius-md)',
              padding: '24px 16px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-card-subtle)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <UploadCloud size={32} color="#38bdf8" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Click to browse files or ZIP
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Supports .py, .js, .jsx, .json, .md, .zip archives
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              style={{ display: 'none' }}
            />
          </div>

          {/* Selected Files preview */}
          {selectedFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {selectedFiles.length} file(s) selected:
              </span>
              {selectedFiles.slice(0, 5).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <FileCode size={12} color="#38bdf8" />
                  <span>{f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
              {selectedFiles.length > 5 && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  + {selectedFiles.length - 5} more file(s)...
                </span>
              )}
            </div>
          )}

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

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isUploading}
              style={{ height: 32, fontSize: 11 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary-gradient"
              disabled={isUploading || selectedFiles.length === 0}
              style={{ height: 32, fontSize: 11 }}
            >
              {isUploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Upload to Workspace</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
