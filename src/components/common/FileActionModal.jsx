import React, { useState } from 'react';
import { FilePlus, FolderPlus, Edit2, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { normalizeError } from '../../api/client';

export default function FileActionModal() {
  const { activeModal, setActiveModal, createFile, createFolder, renameFile, deleteFile } = useAppStore();
  const [inputValue, setInputValue] = useState(
    activeModal?.type === 'rename' ? activeModal?.targetItem?.id || '' : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!activeModal) return null;

  const { type, targetItem } = activeModal;

  const handleClose = () => {
    if (isLoading) return;
    setActiveModal(null);
    setInputValue('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (type === 'new_file') {
        const path = targetItem?.type === 'folder'
          ? `${targetItem.id}/${inputValue.trim()}`
          : inputValue.trim();
        await createFile(path);
      } else if (type === 'new_folder') {
        const path = targetItem?.type === 'folder'
          ? `${targetItem.id}/${inputValue.trim()}`
          : inputValue.trim();
        await createFolder(path);
      } else if (type === 'rename') {
        await renameFile(targetItem.id, inputValue.trim());
      } else if (type === 'delete') {
        await deleteFile(targetItem.id);
      }

      setIsLoading(false);
      handleClose();
    } catch (err) {
      setIsLoading(false);
      setError(normalizeError(err));
    }
  };

  const getTitle = () => {
    if (type === 'new_file') return 'Create New File';
    if (type === 'new_folder') return 'Create New Folder';
    if (type === 'rename') return 'Rename Item';
    if (type === 'delete') return 'Delete Item';
    return '';
  };

  const getIcon = () => {
    if (type === 'new_file') return <FilePlus size={16} color="#38bdf8" />;
    if (type === 'new_folder') return <FolderPlus size={16} color="#eab308" />;
    if (type === 'rename') return <Edit2 size={16} color="#a855f7" />;
    return <Trash2 size={16} color="var(--color-critical)" />;
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div className="card" style={{
        width: 420, maxWidth: '90vw', padding: 20, borderRadius: 10,
        boxShadow: '0 16px 36px rgba(0,0,0,0.5)', border: '1px solid var(--border-focus)',
        gap: 14
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {getIcon()}
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{getTitle()}</span>
          </div>
          <button className="icon-action-btn" onClick={handleClose} disabled={isLoading} style={{ width: 26, height: 26 }}>
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {type === 'delete' ? (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{targetItem?.name || targetItem?.id}</strong>?
              This action permanently removes the file from the workspace.
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {type === 'rename' ? 'New Name / Path' : type === 'new_folder' ? 'Folder Name' : 'File Name'}
              </label>
              <input
                type="text"
                autoFocus
                placeholder={type === 'new_folder' ? 'e.g. utils' : 'e.g. helper.py'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%', padding: '7px 10px', fontSize: 12,
                  backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none'
                }}
              />
              {targetItem?.type === 'folder' && type !== 'rename' && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Creating inside: {targetItem.id}/
                </span>
              )}
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--color-critical)', borderRadius: 'var(--radius-sm)',
              fontSize: 11, color: 'var(--color-critical)'
            }}>
              <AlertTriangle size={13} />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
              style={{ height: 30, fontSize: 11 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${type === 'delete' ? 'btn-critical' : 'btn-primary-gradient'}`}
              disabled={isLoading || (type !== 'delete' && !inputValue.trim())}
              style={{ height: 30, fontSize: 11, backgroundColor: type === 'delete' ? 'var(--color-critical)' : undefined }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{type === 'delete' ? 'Delete' : 'Confirm'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
