import { create } from 'zustand';
import { initialFiles } from '../data/fileData';
import { initialFileTree, currentProject } from '../data/projectData';
import { initialIssues } from '../data/issueData';
import { initialTestCases } from '../data/testData';

const getInitialTheme = () => {
  const saved = localStorage.getItem('autonomusai_theme');
  return saved || 'dark';
};

export const useAppStore = create((set, get) => ({
  // Theme
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem('autonomusai_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  // Project & Navigation
  project: currentProject,
  activeLanguage: 'python',
  setLanguage: (lang) => set({ activeLanguage: lang }),
  selectedBranch: 'main',
  setSelectedBranch: (branch) => set({ selectedBranch: branch }),

  // Explorer & Files
  fileTree: initialFileTree,
  files: initialFiles,
  activeFilePath: 'backend/main.py',
  openTabs: ['backend/main.py', 'backend/utils.py', 'tests/test_main.py', 'backend/app/agents/planner.py'],
  
  // Sidebar & Layout Toggles
  isLeftSidebarOpen: true,
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
  isRightSidebarOpen: true,
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  rightSidebarTab: 'analysis', // 'chat' | 'analysis' | 'tests' | 'fixes' | 'report'
  setRightSidebarTab: (tab) => set({ rightSidebarTab: tab, isRightSidebarOpen: true }),
  
  // Console Panels
  isConsoleOpen: true,
  toggleConsole: () => set((state) => ({ isConsoleOpen: !state.isConsoleOpen })),
  consoleTab: 'problems', // 'problems' | 'terminal' | 'testResults' | 'output' | 'debugConsole' | 'agentLogs'
  setConsoleTab: (tab) => set({ consoleTab: tab, isConsoleOpen: true }),

  // Editor State
  cursorPosition: { line: 6, col: 32 },
  setCursorPosition: (pos) => set({ cursorPosition: pos }),
  isDiagnosticPopupOpen: false,
  toggleDiagnosticPopup: () => set((state) => ({ isDiagnosticPopupOpen: !state.isDiagnosticPopupOpen })),
  openDiagnosticPopup: (issueId) => {
    const issue = get().issues.find(i => i.id === issueId);
    if (issue) {
      set({
        selectedIssueId: issueId,
        cursorPosition: { line: issue.line, col: issue.col || 1 },
        isDiagnosticPopupOpen: true,
        activeFilePath: issue.fullPath || 'backend/main.py'
      });
    }
  },
  closeDiagnosticPopup: () => set({ isDiagnosticPopupOpen: false }),

  // Issues & Diagnostics
  issues: initialIssues,
  selectedIssueId: 'ISSUE-01',
  selectIssue: (id) => {
    const issue = get().issues.find(i => i.id === id);
    if (issue) {
      set({
        selectedIssueId: id,
        cursorPosition: { line: issue.line, col: issue.col || 1 },
        isDiagnosticPopupOpen: true,
        activeFilePath: issue.fullPath || get().activeFilePath,
        rightSidebarTab: 'analysis'
      });
    }
  },

  // Applied Fixes tracking
  appliedFixes: [],
  applyFix: (issueId) => {
    const state = get();
    const issue = state.issues.find(i => i.id === issueId);
    if (!issue) return;

    // Update file content with the fixed version
    const currentFile = state.files['backend/main.py'];
    const updatedContent = currentFile.fixedContent || currentFile.content;

    // Update issues status
    const updatedIssues = state.issues.map(iss => 
      iss.id === issueId ? { ...iss, status: 'Fixed' } : iss
    );

    // Update tests so test_average_empty_list passes
    const updatedTests = state.testCases.map(t => 
      t.id === 'test-3' ? { ...t, status: 'passed', error: null, stdout: 'Fixed: empty list returns 0 safely.' } : t
    );

    set((s) => ({
      files: {
        ...s.files,
        'backend/main.py': {
          ...s.files['backend/main.py'],
          content: updatedContent
        }
      },
      issues: updatedIssues,
      testCases: updatedTests,
      appliedFixes: [...s.appliedFixes, issueId],
      isDiagnosticPopupOpen: false
    }));

    // Add notification
    get().addNotification({
      id: Date.now(),
      title: 'Fix Applied',
      message: `Applied fix for ${issue.title} in main.py`,
      type: 'success',
      timestamp: 'Just now'
    });
  },

  undoFix: (issueId) => {
    const state = get();
    const currentFile = state.files['backend/main.py'];
    
    // Revert issues
    const updatedIssues = state.issues.map(iss => 
      iss.id === issueId ? { ...iss, status: 'Open' } : iss
    );

    // Revert tests
    const updatedTests = state.testCases.map(t => 
      t.id === 'test-3' ? {
        ...t,
        status: 'failed',
        error: 'ZeroDivisionError: division by zero',
        traceback: `Traceback (most recent call last):\n  File "tests/test_main.py", line 14, in test_average_empty_list\n    self.assertEqual(calculate_average([]), 0)\n  File "backend/main.py", line 6, in calculate_average\n    return sum(numbers) / len(numbers)\nZeroDivisionError: division by zero`
      } : t
    );

    set((s) => ({
      files: {
        ...s.files,
        'backend/main.py': {
          ...s.files['backend/main.py'],
          content: initialFiles['backend/main.py'].content
        }
      },
      issues: updatedIssues,
      testCases: updatedTests,
      appliedFixes: s.appliedFixes.filter(id => id !== issueId),
      isDiagnosticPopupOpen: true
    }));

    get().addNotification({
      id: Date.now(),
      title: 'Fix Reverted',
      message: `Reverted fix for ${issueId}`,
      type: 'info',
      timestamp: 'Just now'
    });
  },

  // Test Runner
  testCases: initialTestCases,
  isTestingRunning: false,
  runTests: async () => {
    set({ isTestingRunning: true });
    // Simulate test execution delay
    await new Promise(resolve => setTimeout(resolve, 800));
    set({ isTestingRunning: false });
  },

  // Open/Close tabs
  openTab: (filePath) => {
    const { openTabs } = get();
    if (!openTabs.includes(filePath)) {
      set({ openTabs: [...openTabs, filePath], activeFilePath: filePath });
    } else {
      set({ activeFilePath: filePath });
    }
  },
  closeTab: (filePath) => {
    const { openTabs, activeFilePath } = get();
    const nextTabs = openTabs.filter(p => p !== filePath);
    let nextActive = activeFilePath;
    if (activeFilePath === filePath) {
      nextActive = nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : null;
    }
    set({ openTabs: nextTabs, activeFilePath: nextActive });
  },
  setActiveFile: (filePath) => {
    get().openTab(filePath);
  },
  updateFileContent: (path, newContent) => {
    set((state) => ({
      files: {
        ...state.files,
        [path]: {
          ...(state.files[path] || { name: path.split('/').pop(), path, language: 'plaintext' }),
          content: newContent
        }
      }
    }));
  },

  // Notifications
  notifications: [
    { id: 1, title: 'Analysis Completed', message: 'Planner identified 1 critical error in main.py', type: 'warning', timestamp: '2m ago', read: false },
    { id: 2, title: 'Test Failed', message: 'test_average_empty_list failed with ZeroDivisionError', type: 'critical', timestamp: '3m ago', read: false },
    { id: 3, title: 'Workspace Ready', message: 'AegisVault repository indexed (24 files scanned)', type: 'info', timestamp: '10m ago', read: true }
  ],
  isNotificationsOpen: false,
  toggleNotifications: () => set((s) => ({ isNotificationsOpen: !s.isNotificationsOpen })),
  markNotificationsAsRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, read: true }))
  })),
  addNotification: (item) => set((s) => ({ notifications: [item, ...s.notifications] })),

  // Command Palette
  isCommandPaletteOpen: false,
  setCommandPalette: (open) => set({ isCommandPaletteOpen: open })
}));
