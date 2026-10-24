import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import ActivityBar from './ActivityBar';
import StatusBar from './StatusBar';
import CommandPalette from './CommandPalette';
import PlasmaCursor from '../common/PlasmaCursor';
import ConnectRepoModal from '../common/ConnectRepoModal';
import UploadProjectModal from '../common/UploadProjectModal';
import FileActionModal from '../common/FileActionModal';
import FileTargetSelectorModal from '../common/FileTargetSelectorModal';
import { useAppStore } from '../../store/useAppStore';
import { useGlobalShortcuts } from '../../hooks/useGlobalShortcuts';

export default function AppShell() {
  const { theme } = useAppStore();

  // Initialize global VS Code keyboard shortcut engine
  useGlobalShortcuts();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-shell" data-theme={theme}>
      {/* Top Application Toolbar */}
      <TopBar />

      {/* Main Workspace Body */}
      <div className="app-body">
        {/* Narrow Vertical Navigation Rail */}
        <ActivityBar />

        {/* Dynamic Route Content (IDEPage, ReportsPage, TestsPage, etc.) */}
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          <Outlet />
        </main>
      </div>

      {/* Persistent Bottom Status Bar */}
      <StatusBar />

      {/* Global Command & Search Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Modals */}
      <ConnectRepoModal />
      <UploadProjectModal />
      <FileActionModal />
      <FileTargetSelectorModal />

      {/* Animated Futuristic Plasma Orb Cursor */}
      <PlasmaCursor />
    </div>
  );
}
