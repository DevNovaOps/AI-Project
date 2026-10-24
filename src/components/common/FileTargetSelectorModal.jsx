import React, { useState, useMemo } from 'react';
import { 
  X, CheckSquare, Square, Search, Globe, FileCode, Check, 
  Layers, Play, Filter, Sparkles 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';

export default function FileTargetSelectorModal() {
  const { currentProject, fileTree, activeFilePath, files } = useAppStore();
  const { 
    isTargetModalOpen, setTargetModalOpen,
    targetScope, setTargetScope,
    selectedTargetFiles, setSelectedTargetFiles,
    toggleTargetFile, selectAllTargetFiles, clearSelectedTargetFiles,
    startAutonomousWorkflow, workflowState
  } = useWorkflowStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Flatten the project fileTree to a list of file paths
  const allProjectFiles = useMemo(() => {
    const list = [];
    const nonCodeExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.zip'];

    const traverse = (nodes) => {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if (node.type === 'file') {
          const lower = node.id.toLowerCase();
          const isBinary = nonCodeExts.some(ext => lower.endsWith(ext));
          if (!isBinary) {
            list.push({
              path: node.id,
              name: node.name || node.id.split('/').pop(),
              extension: node.id.split('.').pop().toLowerCase(),
            });
          }
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    };

    if (fileTree && fileTree.length > 0) {
      traverse(fileTree);
    } else if (files && Object.keys(files).length > 0) {
      for (const [p, f] of Object.entries(files)) {
        list.push({
          path: p,
          name: f.name || p.split('/').pop(),
          extension: p.split('.').pop().toLowerCase(),
        });
      }
    }

    return list;
  }, [fileTree, files]);

  // Filtered files according to search
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return allProjectFiles;
    const q = searchQuery.toLowerCase();
    return allProjectFiles.filter(f => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q));
  }, [allProjectFiles, searchQuery]);

  if (!isTargetModalOpen) return null;

  const isRunning = ['planning', 'analyzing', 'diagnosing', 'generating_fix', 'running_tests', 'validating'].includes(workflowState);

  const getFileBadgeColor = (ext) => {
    switch (ext) {
      case 'js':
      case 'jsx':
        return '#facc15';
      case 'ts':
      case 'tsx':
        return '#38bdf8';
      case 'py':
        return '#3b82f6';
      case 'html':
      case 'htm':
        return '#f97316';
      case 'css':
      case 'scss':
        return '#a855f7';
      case 'json':
        return '#10b981';
      case 'sql':
        return '#ec4899';
      default:
        return 'var(--text-muted)';
    }
  };

  const handleSelectCodeOnly = () => {
    const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'html', 'htm', 'css', 'scss', 'json', 'sql'];
    const codePaths = allProjectFiles
      .filter(f => codeExts.includes(f.extension))
      .map(f => f.path);
    selectAllTargetFiles(codePaths);
  };

  const handleApplyAndRun = () => {
    setTargetModalOpen(false);
    startAutonomousWorkflow();
  };

  const effectiveCount = targetScope === 'project'
    ? allProjectFiles.length
    : targetScope === 'selected'
    ? selectedTargetFiles.length
    : 1;

  return (
    <div 
      className="modal-backdrop" 
      onClick={() => setTargetModalOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div 
        className="modal-content glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 24px rgba(56, 189, 248, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(168, 85, 247, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              <Layers size={18} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                Target Files for AI Analysis & Repair
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {currentProject?.name || 'Workspace'} • {allProjectFiles.length} file(s) indexed
              </div>
            </div>
          </div>
          <button
            onClick={() => setTargetModalOpen(false)}
            className="icon-action-btn"
            style={{ width: 28, height: 28, borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scope Mode Switcher Tabs */}
        <div style={{ padding: '16px 20px 8px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
            padding: 4,
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            {/* Scope 1: Entire Project */}
            <button
              type="button"
              onClick={() => setTargetScope('project')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                background: targetScope === 'project' 
                  ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.2))'
                  : 'transparent',
                boxShadow: targetScope === 'project' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                color: targetScope === 'project' ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: targetScope === 'project' ? 700 : 500,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={15} />
                <span style={{ fontSize: 12 }}>Entire Project</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                All {allProjectFiles.length} files
              </span>
            </button>

            {/* Scope 2: Custom Selection */}
            <button
              type="button"
              onClick={() => {
                setTargetScope('selected');
                if (selectedTargetFiles.length === 0 && allProjectFiles.length > 0) {
                  // Default selection to all code files if empty
                  handleSelectCodeOnly();
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                background: targetScope === 'selected' 
                  ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.2))'
                  : 'transparent',
                boxShadow: targetScope === 'selected' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                color: targetScope === 'selected' ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: targetScope === 'selected' ? 700 : 500,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckSquare size={15} />
                <span style={{ fontSize: 12 }}>Select Files</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {selectedTargetFiles.length} file(s) chosen
              </span>
            </button>

            {/* Scope 3: Active File Only */}
            <button
              type="button"
              onClick={() => setTargetScope('active')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                background: targetScope === 'active' 
                  ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.2))'
                  : 'transparent',
                boxShadow: targetScope === 'active' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                color: targetScope === 'active' ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: targetScope === 'active' ? 700 : 500,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileCode size={15} />
                <span style={{ fontSize: 12 }}>Active Tab Only</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                {activeFilePath ? activeFilePath.split('/').pop() : 'main.py'}
              </span>
            </button>
          </div>
        </div>

        {/* Content Body according to Scope */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px 20px', minHeight: 240 }}>
          {targetScope === 'project' && (
            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8' }}>
                <Globe size={18} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Entire Repository Codebase Analysis</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The AI 5-Agent pipeline will scan and analyze all <strong>{allProjectFiles.length} files</strong> across frontend and backend directories simultaneously.
                Cross-file method calls, DOM element queries, CSS rules, and API payload contracts will be verified end-to-end.
              </div>
              <div style={{
                maxHeight: 180,
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: '8px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)'
              }}>
                {allProjectFiles.map(f => (
                  <div key={f.path} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 11
                  }}>
                    <span style={{ color: getFileBadgeColor(f.extension), fontWeight: 700, fontSize: 10 }}>
                      {f.extension.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {f.path}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {targetScope === 'active' && (
            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8' }}>
                <FileCode size={18} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Single File Focus</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                The AI agents will focus strictly on the currently active file in your editor:
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                <FileCode size={16} color="#38bdf8" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {activeFilePath || 'main.py'}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                  Active in Editor
                </span>
              </div>
            </div>
          )}

          {targetScope === 'selected' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Filter and Quick Select Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search project files by name or path..."
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSelectCodeOnly}
                  className="btn btn-secondary"
                  style={{ height: 32, fontSize: 11, padding: '0 10px' }}
                  title="Select all JS, TS, HTML, CSS, PY files"
                >
                  Code Only
                </button>
                <button
                  type="button"
                  onClick={() => selectAllTargetFiles(allProjectFiles.map(f => f.path))}
                  className="btn btn-secondary"
                  style={{ height: 32, fontSize: 11, padding: '0 10px' }}
                >
                  All ({allProjectFiles.length})
                </button>
                <button
                  type="button"
                  onClick={clearSelectedTargetFiles}
                  className="btn btn-secondary"
                  style={{ height: 32, fontSize: 11, padding: '0 10px' }}
                >
                  Clear
                </button>
              </div>

              {/* Scrollable File Checklist */}
              <div style={{
                maxHeight: 280,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)'
              }}>
                {filteredFiles.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    No files found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredFiles.map((f) => {
                    const isSelected = selectedTargetFiles.includes(f.path);
                    const isActive = f.path === activeFilePath;

                    return (
                      <div
                        key={f.path}
                        onClick={() => toggleTargetFile(f.path)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                          border: isSelected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                      >
                        <div style={{ color: isSelected ? '#38bdf8' : 'var(--text-muted)', display: 'flex' }}>
                          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <span style={{ 
                          fontSize: 10, 
                          fontWeight: 700, 
                          color: getFileBadgeColor(f.extension),
                          width: 32,
                          textAlign: 'center'
                        }}>
                          {f.extension.toUpperCase()}
                        </span>
                        <span style={{
                          fontSize: 12,
                          fontFamily: 'var(--font-mono)',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          flex: 1
                        }}>
                          {f.path}
                        </span>
                        {isActive && (
                          <span style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: '#10b981',
                            background: 'rgba(16, 185, 129, 0.15)',
                            padding: '2px 5px',
                            borderRadius: 4
                          }}>
                            Active
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <Sparkles size={14} color="#38bdf8" />
            <span>Targeting: <strong style={{ color: '#38bdf8' }}>{effectiveCount} file(s)</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setTargetModalOpen(false)}
              style={{ height: 32, fontSize: 11 }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary-gradient"
              onClick={handleApplyAndRun}
              disabled={isRunning || effectiveCount === 0}
              style={{ height: 32, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Play size={12} fill="#ffffff" />
              <span>Apply & Run AI Pipeline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
