import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useWorkflowStore } from '../store/useWorkflowStore';

/**
 * Global Keyboard Shortcut Engine for AETHERION
 * Handles all VS Code-standard shortcuts (Ctrl+C, Ctrl+V, Ctrl+S, Ctrl+P, Ctrl+B, etc.)
 * across the application so commands work reliably instead of triggering browser defaults.
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    saveActiveFile, activeFilePath, closeTab, openTabs,
    toggleLeftSidebar, toggleRightSidebar, setRightSidebarTab,
    toggleConsole, setConsoleTab, isConsoleOpen,
    setCommandPalette, isCommandPaletteOpen,
    runTests, addNotification
  } = useAppStore();

  const { startAutonomousWorkflow, workflowState } = useWorkflowStore();

  const lastKeyRef = useRef({ key: null, time: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const now = Date.now();

      // Check for two-step sequence like Ctrl+K Ctrl+S (Open Shortcuts)
      if (lastKeyRef.current.key === 'k' && (now - lastKeyRef.current.time < 1200)) {
        if (key === 's') {
          e.preventDefault();
          lastKeyRef.current = { key: null, time: 0 };
          navigate('/shortcuts');
          return;
        }
      }

      // Handle standalone Ctrl/Cmd commands
      if (isCtrlOrCmd) {
        // Record Ctrl+K sequence start
        if (key === 'k' && !e.shiftKey && !e.altKey) {
          lastKeyRef.current = { key: 'k', time: now };
          // If in an input, don't prevent unless it's the global command palette trigger
          if (!e.target.matches('input, textarea')) {
            e.preventDefault();
            setCommandPalette(!isCommandPaletteOpen);
          }
          return;
        }

        // 1. SAVE: Ctrl+S -> Save File
        if (key === 's' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          if (saveActiveFile) {
            saveActiveFile();
            addNotification({
              title: 'Saved',
              message: `Saved ${activeFilePath || 'file'} (Ctrl+S)`,
              type: 'info'
            });
          }
          return;
        }

        // 2. QUICK OPEN / PALETTE: Ctrl+P or Ctrl+Shift+P
        if (key === 'p') {
          e.preventDefault();
          setCommandPalette(true);
          return;
        }

        // 3. TOGGLE SIDEBAR: Ctrl+B
        if (key === 'b' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          toggleLeftSidebar();
          return;
        }

        // 4. TOGGLE TERMINAL / CONSOLE: Ctrl+` or Ctrl+J
        if ((e.key === '`' || key === 'j') && !e.shiftKey) {
          e.preventDefault();
          toggleConsole();
          return;
        }

        // 5. VIEW EXPLORER: Ctrl+Shift+E
        if (e.shiftKey && key === 'e') {
          e.preventDefault();
          navigate('/');
          return;
        }

        // 6. VIEW GLOBAL SEARCH: Ctrl+Shift+F
        if (e.shiftKey && key === 'f') {
          e.preventDefault();
          navigate('/search');
          return;
        }

        // 7. VIEW SOURCE CONTROL: Ctrl+Shift+G
        if (e.shiftKey && key === 'g') {
          e.preventDefault();
          navigate('/source-control');
          return;
        }

        // 8. VIEW DEBUGGER: Ctrl+Shift+D
        if (e.shiftKey && key === 'd') {
          e.preventDefault();
          navigate('/debug');
          return;
        }

        // 9. VIEW PROBLEMS DIAGNOSTICS: Ctrl+Shift+M
        if (e.shiftKey && key === 'm') {
          e.preventDefault();
          setConsoleTab('problems');
          if (!isConsoleOpen) toggleConsole();
          return;
        }

        // 10. PREFERENCES / SETTINGS: Ctrl+,
        if (key === ',' && !e.shiftKey) {
          e.preventDefault();
          navigate('/settings');
          return;
        }

        // 11. CLOSE EDITOR TAB: Ctrl+W
        if (key === 'w' && !e.shiftKey && !e.altKey) {
          // If an editor tab is open and user isn't in another application window
          if (activeFilePath && openTabs.length > 0) {
            e.preventDefault();
            closeTab(activeFilePath);
            return;
          }
        }

        // 12. RUN AUTONOMOUS AI PIPELINE: Ctrl+Shift+A
        if (e.shiftKey && key === 'a') {
          e.preventDefault();
          if (workflowState === 'idle' || workflowState === 'completed' || workflowState === 'failed') {
            startAutonomousWorkflow();
          }
          return;
        }

        // 13. AI FIXES PANEL: Ctrl+I
        if (key === 'i' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          setRightSidebarTab('fixes');
          return;
        }

        // 14. AI CHAT PANEL: Ctrl+L
        if (key === 'l' && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          setRightSidebarTab('chat');
          return;
        }

        // 15. COPY ASSIST: Ctrl+C
        if (key === 'c' && !e.shiftKey && !e.altKey) {
          const selectedText = window.getSelection()?.toString();
          if (selectedText && !e.target.matches('input, textarea, .monaco-mouse-cursor-text')) {
            navigator.clipboard.writeText(selectedText).catch(() => {});
          }
        }
      }

      // Standalone F5: Run Sandbox Tests
      if (e.key === 'F5' && !e.ctrlKey) {
        e.preventDefault();
        runTests();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    navigate, location, saveActiveFile, activeFilePath, closeTab, openTabs,
    toggleLeftSidebar, toggleRightSidebar, setRightSidebarTab,
    toggleConsole, setConsoleTab, isConsoleOpen,
    setCommandPalette, isCommandPaletteOpen,
    runTests, addNotification, startAutonomousWorkflow, workflowState
  ]);
}
