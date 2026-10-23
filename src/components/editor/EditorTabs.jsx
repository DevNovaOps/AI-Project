import React from 'react';
import { X, Plus, SplitSquareVertical, MoreHorizontal } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function EditorTabs() {
  const { openTabs, activeFilePath, setActiveFile, closeTab, files, openTab } = useAppStore();

  const getFileIcon = (filePath) => {
    if (filePath.endsWith('.py')) return <span style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700 }}>🐍</span>;
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) return <span style={{ color: '#06b6d4', fontSize: 11 }}>⚛</span>;
    if (filePath.endsWith('.css')) return <span style={{ color: '#38bdf8', fontSize: 11 }}>🎨</span>;
    if (filePath.endsWith('.md')) return <span style={{ color: '#94a3b8', fontSize: 11 }}>📄</span>;
    return <span style={{ color: '#94a3b8', fontSize: 11 }}>📄</span>;
  };

  const getFileName = (path) => path.split('/').pop();

  return (
    <div className="editor-tabs-bar">
      <div className="editor-tabs-list">
        {openTabs.map((tabPath) => {
          const isActive = tabPath === activeFilePath;
          const fileName = getFileName(tabPath);
          const hasError = tabPath === 'backend/main.py';

          return (
            <div
              key={tabPath}
              className={`editor-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveFile(tabPath)}
            >
              {getFileIcon(tabPath)}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {fileName}
                {hasError && <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--color-critical)' }} />}
              </span>
              <button
                className="editor-tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tabPath);
                }}
                title="Close Tab"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        <button 
          className="icon-action-btn" 
          style={{ width: 28, height: 28, marginLeft: 4 }}
          onClick={() => openTab('backend/models.py')}
          title="New Tab / Open models.py"
        >
          <Plus size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 6 }}>
        <button className="icon-action-btn" style={{ width: 26, height: 26 }} title="Split Editor Right">
          <SplitSquareVertical size={14} />
        </button>
        <button className="icon-action-btn" style={{ width: 26, height: 26 }} title="More Editor Actions">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
