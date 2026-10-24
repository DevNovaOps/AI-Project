import React, { useState, useEffect } from 'react';
import { 
  Folder, FolderOpen, FileCode, FileText, ChevronRight, ChevronDown, 
  RotateCw, Minimize2, Plus, GitBranch, Layers, Sparkles, MoreHorizontal,
  FilePlus, FolderPlus, Trash2, Edit2, Search, UploadCloud, FolderGit2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function ProjectExplorer() {
  const { 
    projects, currentProject, selectProject, loadProjects,
    selectedBranch, setSelectedBranch,
    fileTree, activeFilePath, setActiveFile,
    isLeftSidebarOpen, loadProjectFiles,
    setConnectRepoModalOpen, setUploadModalOpen,
    setActiveModal, issues,
    deleteProject, createLocalWorkspace
  } = useAppStore();

  const [expandedFolders, setExpandedFolders] = useState({});
  const [filterText, setFilterText] = useState('');
  const [contextMenu, setContextMenu] = useState(null); // { x, y, item }
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

  // Load projects on initial mount
  useEffect(() => {
    loadProjects();
  }, []);

  if (!isLeftSidebarOpen) return null;

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const collapseAll = () => {
    setExpandedFolders({});
  };

  const expandAll = () => {
    const all = {};
    const traverse = (nodes) => {
      nodes.forEach(n => {
        if (n.type === 'folder') {
          all[n.id] = true;
          if (n.children) traverse(n.children);
        }
      });
    };
    traverse(fileTree);
    setExpandedFolders(all);
  };

  const getFileIcon = (ext, fileName = '') => {
    const fLower = fileName.toLowerCase();
    if (fLower === 'dockerfile') return <span style={{ fontSize: 13 }} title="Dockerfile">🐳</span>;
    if (fLower === 'procfile') return <span style={{ fontSize: 13 }} title="Procfile">⚙️</span>;
    if (ext === 'html' || ext === 'htm') return <span style={{ color: '#f97316', fontSize: 13, fontWeight: 700 }} title="HTML5">🌐</span>;
    if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less') return <span style={{ color: '#38bdf8', fontSize: 13 }} title="CSS Stylesheet">🎨</span>;
    if (ext === 'jsx') return <span style={{ color: '#06b6d4', fontSize: 13, fontWeight: 700 }} title="React JSX">⚛</span>;
    if (ext === 'tsx') return <span style={{ color: '#3b82f6', fontSize: 13, fontWeight: 700 }} title="React TSX">⚛</span>;
    if (ext === 'js' || ext === 'mjs' || ext === 'cjs') return <span style={{ color: '#eab308', fontSize: 13, fontWeight: 700 }} title="JavaScript">⚡</span>;
    if (ext === 'ts') return <span style={{ color: '#3b82f6', fontSize: 13, fontWeight: 700 }} title="TypeScript">🔷</span>;
    if (ext === 'vue') return <span style={{ fontSize: 13 }} title="Vue.js">💚</span>;
    if (ext === 'svelte') return <span style={{ fontSize: 13 }} title="Svelte">🔥</span>;
    if (ext === 'py' || ext === 'pyw') return <span style={{ color: '#38bdf8', fontSize: 13, fontWeight: 700 }} title="Python">🐍</span>;
    if (ext === 'sql') return <span style={{ fontSize: 13 }} title="SQL Query / Schema">🗄️</span>;
    if (ext === 'json') return <span style={{ color: '#fbbf24', fontSize: 13 }} title="JSON">📋</span>;
    if (ext === 'yaml' || ext === 'yml') return <span style={{ color: '#ec4899', fontSize: 13 }} title="YAML">📝</span>;
    if (ext === 'md' || ext === 'markdown') return <FileText size={14} style={{ color: '#94a3b8' }} title="Markdown" />;
    if (ext === 'txt' || ext === 'text' || ext === 'log') return <span style={{ color: '#94a3b8', fontSize: 13 }} title="Text">📄</span>;
    if (ext === 'sh' || ext === 'bash') return <span style={{ fontSize: 13 }} title="Shell Script">🐚</span>;
    if (ext === 'env' || fLower.startsWith('.env')) return <span style={{ color: '#fbbf24', fontSize: 12 }}>⚙</span>;
    return <FileCode size={14} style={{ color: '#94a3b8' }} />;
  };

  const renderTree = (nodes, depth = 0) => {
    return nodes.map((node) => {
      if (filterText && !node.name.toLowerCase().includes(filterText.toLowerCase()) && node.type === 'file') {
        return null;
      }

      if (node.type === 'folder') {
        const isExpanded = expandedFolders[node.id] || false;
        return (
          <div key={node.id}>
            <div 
              className="tree-node"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
              onClick={() => toggleFolder(node.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, item: node });
              }}
            >
              {isExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
              {isExpanded ? <FolderOpen size={15} color="#eab308" /> : <Folder size={15} color="#eab308" />}
              <span style={{ fontWeight: 500, fontSize: 12 }}>{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div>{renderTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      const isActive = activeFilePath === node.id;
      const fileHasIssue = issues.some(iss => iss.filePath === node.id || iss.file === node.id);

      return (
        <div 
          key={node.id}
          className={`tree-node ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 14 + 18}px` }}
          onClick={() => setActiveFile(node.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, item: node });
          }}
        >
          {getFileIcon(node.ext, node.name)}
          <span>{node.name}</span>
          {fileHasIssue && <span className="tree-node-issue-dot" title="Code finding detected in this file" />}
        </div>
      );
    });
  };

  // Count total files recursively
  const countFiles = (nodes) => {
    let count = 0;
    nodes.forEach(n => {
      if (n.type === 'file') count += 1;
      if (n.children) count += countFiles(n.children);
    });
    return count;
  };
  const totalFilesCount = countFiles(fileTree);

  return (
    <aside className="project-explorer" aria-label="Project Explorer">
      {/* Header */}
      <div className="explorer-header">
        <span>Project Explorer</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22 }}
            onClick={() => setActiveModal({ type: 'new_file' })}
            title="New File"
          >
            <FilePlus size={13} />
          </button>
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22 }}
            onClick={() => setActiveModal({ type: 'new_folder' })}
            title="New Folder"
          >
            <FolderPlus size={13} />
          </button>
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22 }}
            onClick={expandAll}
            title="Expand All"
          >
            <FolderOpen size={13} />
          </button>
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22 }}
            onClick={collapseAll}
            title="Collapse All"
          >
            <Minimize2 size={13} />
          </button>
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22 }}
            onClick={() => loadProjectFiles()}
            title="Refresh Files"
          >
            <RotateCw size={13} />
          </button>
        </div>
      </div>

      {/* Selectors: Project & Branch */}
      <div className="explorer-selectors">
        {/* Project Selector */}
        <div style={{ position: 'relative', flex: 1.2 }}>
          <button 
            className="explorer-pill-btn" 
            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
            title="Select Project"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Layers size={12} color="#38bdf8" />
              <span>{currentProject?.name || 'No Project'}</span>
            </span>
            <ChevronDown size={11} color="var(--text-muted)" />
          </button>

          {isProjectMenuOpen && (
            <div className="popover-menu" style={{ width: 230, left: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
                Your Workspaces
              </div>
              {projects.map((p) => (
                <div 
                  key={p.id} 
                  className="palette-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' }}
                  onClick={() => {
                    selectProject(p.id);
                    setIsProjectMenuOpen(false);
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      {p.source_type === 'github' ? 'GitHub Repo' : 'Simple Workspace'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.id === currentProject?.id && <span style={{ color: 'var(--color-success)', fontSize: 10, fontWeight: 600 }}>Active</span>}
                    <button
                      className="icon-action-btn"
                      style={{ width: 20, height: 20, opacity: 0.7 }}
                      title="Disconnect / Remove Workspace"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Remove workspace "${p.name}"?`)) {
                          deleteProject(p.id);
                        }
                      }}
                    >
                      <Trash2 size={11} color="#ef4444" />
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
              <div
                className="palette-item"
                style={{ color: '#10b981', fontWeight: 600 }}
                onClick={() => {
                  setIsProjectMenuOpen(false);
                  createLocalWorkspace('Simple Workspace');
                }}
              >
                <Plus size={12} />
                <span>+ New Simple Workspace</span>
              </div>
              <div
                className="palette-item"
                style={{ color: '#38bdf8' }}
                onClick={() => {
                  setIsProjectMenuOpen(false);
                  setConnectRepoModalOpen(true);
                }}
              >
                <FolderGit2 size={12} />
                <span>Connect GitHub Repo...</span>
              </div>
              <div
                className="palette-item"
                onClick={() => {
                  setIsProjectMenuOpen(false);
                  setUploadModalOpen(true);
                }}
              >
                <UploadCloud size={12} />
                <span>Upload Project...</span>
              </div>
            </div>
          )}
        </div>

        {/* Branch Selector */}
        <div style={{ position: 'relative', flex: 1 }}>
          <button 
            className="explorer-pill-btn"
            onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
            title="Select Git Branch"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <GitBranch size={12} color="#a855f7" />
              <span>{selectedBranch}</span>
            </span>
            <ChevronDown size={11} color="var(--text-muted)" />
          </button>

          {isBranchMenuOpen && (
            <div className="popover-menu" style={{ width: 160, right: 0 }}>
              {['main', 'master', 'dev'].map((b) => (
                <div 
                  key={b} 
                  className="palette-item"
                  onClick={() => {
                    setSelectedBranch(b);
                    setIsBranchMenuOpen(false);
                  }}
                >
                  <span>{b}</span>
                  {b === selectedBranch && <span style={{ color: 'var(--color-success)', fontSize: 10 }}>Active</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Filter */}
      <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-input)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <Search size={12} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Filter files..." 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 11, outline: 'none', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* File Tree or Empty State */}
      <div className="file-tree-container">
        {fileTree.length > 0 ? (
          renderTree(fileTree)
        ) : (
          <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              No files in workspace yet.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button 
                className="btn btn-primary-gradient" 
                style={{ height: 28, fontSize: 11, justifyContent: 'center' }}
                onClick={() => setConnectRepoModalOpen(true)}
              >
                <FolderGit2 size={12} />
                <span>Connect GitHub</span>
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ height: 28, fontSize: 11, justifyContent: 'center' }}
                onClick={() => setUploadModalOpen(true)}
              >
                <UploadCloud size={12} />
                <span>Upload Files</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu Modal/Dropdown if right clicked */}
      {contextMenu && (
        <div 
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 120 }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div className="popover-menu" style={{ width: 160 }}>
            <div 
              className="palette-item" 
              onClick={() => {
                const item = contextMenu.item;
                setContextMenu(null);
                setActiveModal({ type: 'new_file', targetItem: item });
              }}
            >
              <FilePlus size={13} />
              <span>New File</span>
            </div>
            <div 
              className="palette-item" 
              onClick={() => {
                const item = contextMenu.item;
                setContextMenu(null);
                setActiveModal({ type: 'new_folder', targetItem: item });
              }}
            >
              <FolderPlus size={13} />
              <span>New Folder</span>
            </div>
            <div 
              className="palette-item" 
              onClick={() => {
                const item = contextMenu.item;
                setContextMenu(null);
                setActiveModal({ type: 'rename', targetItem: item });
              }}
            >
              <Edit2 size={13} />
              <span>Rename</span>
            </div>
            <div 
              className="palette-item" 
              style={{ color: 'var(--color-critical)' }} 
              onClick={() => {
                const item = contextMenu.item;
                setContextMenu(null);
                setActiveModal({ type: 'delete', targetItem: item });
              }}
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </div>
          </div>
        </div>
      )}

      {/* Project Overview Card at Bottom */}
      <div className="project-overview-card">
        <div className="overview-top">
          <div className="overview-brand">
            <div className="overview-icon-box">
              <Sparkles size={14} />
            </div>
            <div>
              <div className="overview-name">{currentProject?.name || 'Workspace'}</div>
              <div className="overview-sub">{currentProject?.source_type === 'github' ? 'GitHub Repository' : 'Simple Workspace'}</div>
            </div>
          </div>
          {currentProject?.source_type === 'github' ? (
            <button
              className="btn btn-secondary"
              style={{ height: 22, fontSize: 10, padding: '0 8px' }}
              onClick={() => createLocalWorkspace('Simple Workspace')}
              title="Switch from GitHub to clean simple files workspace"
            >
              Simple Files
            </button>
          ) : (
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
              <path d="M2 18C8 12 14 20 20 14C26 8 32 16 38 10C42 6 46 8 46 8" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 18C8 12 14 20 20 14C26 8 32 16 38 10C42 6 46 8 46 8" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            </svg>
          )}
        </div>

        <div className="overview-stats-grid">
          <div>
            <div className="stat-item-val">{totalFilesCount}</div>
            <div className="stat-item-lbl">Files</div>
          </div>
          <div>
            <div className="stat-item-val" style={{ color: '#a855f7' }}>5</div>
            <div className="stat-item-lbl">Agents</div>
          </div>
          <div>
            <div className="stat-item-val" style={{ color: '#10b981' }}>{issues.length}</div>
            <div className="stat-item-lbl">Issues</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
