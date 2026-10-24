import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import IDEPage from '../pages/IDEPage';
import SearchPage from '../pages/SearchPage';
import SourceControlPage from '../pages/SourceControlPage';
import DebugPage from '../pages/DebugPage';
import TestsPage from '../pages/TestsPage';
import FixesPage from '../pages/FixesPage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';
import KeyboardShortcutsPage from '../pages/KeyboardShortcutsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <IDEPage />
      },
      {
        path: 'editor',
        element: <IDEPage />
      },
      {
        path: 'search',
        element: <SearchPage />
      },
      {
        path: 'source-control',
        element: <SourceControlPage />
      },
      {
        path: 'debug',
        element: <DebugPage />
      },
      {
        path: 'tests',
        element: <TestsPage />
      },
      {
        path: 'fixes',
        element: <FixesPage />
      },
      {
        path: 'reports',
        element: <ReportsPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
      {
        path: 'shortcuts',
        element: <KeyboardShortcutsPage />
      },
      {
        path: 'keyboard-shortcuts',
        element: <KeyboardShortcutsPage />
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
]);
