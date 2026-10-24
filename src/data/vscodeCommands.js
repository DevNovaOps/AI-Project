/**
 * Comprehensive VS Code & AETHERION Keyboard Shortcuts Dataset
 * Contains official command IDs, keybindings, detailed explanations, and 'when' contexts.
 */

export const VSCODE_COMMAND_CATEGORIES = [
  'All',
  'Basic Editing',
  'Navigation',
  'Search & Replace',
  'Multi-Cursor',
  'General',
  'File Management',
  'Terminal',
  'AI & Autonomous Debugging'
];

export const VSCODE_KEYBOARD_COMMANDS = [
  // ==================== BASIC EDITING ====================
  {
    id: 'editor.action.clipboardCopyAction',
    title: 'Copy',
    key: 'Ctrl+C',
    macKey: 'Cmd+C',
    category: 'Basic Editing',
    description: 'Copies the selected text to the clipboard. If no text is selected, copies the entire current line without needing to select it first.',
    when: 'editorTextFocus',
    source: 'Default',
    actionId: 'copy'
  },
  {
    id: 'editor.action.clipboardPasteAction',
    title: 'Paste',
    key: 'Ctrl+V',
    macKey: 'Cmd+V',
    category: 'Basic Editing',
    description: 'Pastes text or code from the system clipboard into the editor at the active cursor position or over the current selection.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'paste'
  },
  {
    id: 'editor.action.clipboardCutAction',
    title: 'Cut',
    key: 'Ctrl+X',
    macKey: 'Cmd+X',
    category: 'Basic Editing',
    description: 'Cuts the selected text and stores it in the clipboard. If no selection exists, cuts the current line entirely.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'cut'
  },
  {
    id: 'undo',
    title: 'Undo',
    key: 'Ctrl+Z',
    macKey: 'Cmd+Z',
    category: 'Basic Editing',
    description: 'Reverts the most recent text modification, cursor move, or formatting action in the editor stack.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'undo'
  },
  {
    id: 'redo',
    title: 'Redo',
    key: 'Ctrl+Y',
    macKey: 'Cmd+Shift+Z',
    category: 'Basic Editing',
    description: 'Reapplies previously undone changes forward along the active editor history branch.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'redo'
  },
  {
    id: 'editor.action.selectAll',
    title: 'Select All',
    key: 'Ctrl+A',
    macKey: 'Cmd+A',
    category: 'Basic Editing',
    description: 'Selects all characters and lines across the active document from start to end.',
    when: 'editorTextFocus',
    source: 'Default',
    actionId: 'selectAll'
  },
  {
    id: 'editor.action.commentLine',
    title: 'Toggle Line Comment',
    key: 'Ctrl+/',
    macKey: 'Cmd+/',
    category: 'Basic Editing',
    description: 'Comments out or uncomments the current line or selected lines using the active language comment syntax (e.g., // or #).',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'commentLine'
  },
  {
    id: 'editor.action.blockComment',
    title: 'Toggle Block Comment',
    key: 'Shift+Alt+A',
    macKey: 'Shift+Option+A',
    category: 'Basic Editing',
    description: 'Wraps the selected code block in multi-line block comments (e.g., /* ... */ in JS/CSS or """ in Python).',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'blockComment'
  },
  {
    id: 'editor.action.moveLinesUpAction',
    title: 'Move Line Up',
    key: 'Alt+Up',
    macKey: 'Option+Up',
    category: 'Basic Editing',
    description: 'Swaps the active line or selection with the line directly above it without cutting or pasting.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'moveLineUp'
  },
  {
    id: 'editor.action.moveLinesDownAction',
    title: 'Move Line Down',
    key: 'Alt+Down',
    macKey: 'Option+Down',
    category: 'Basic Editing',
    description: 'Swaps the active line or selection with the line directly below it smoothly.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'moveLineDown'
  },
  {
    id: 'editor.action.copyLinesUpAction',
    title: 'Copy Line Up',
    key: 'Shift+Alt+Up',
    macKey: 'Shift+Option+Up',
    category: 'Basic Editing',
    description: 'Duplicates the current line or selected lines directly above the current position.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'copyLineUp'
  },
  {
    id: 'editor.action.copyLinesDownAction',
    title: 'Copy Line Down',
    key: 'Shift+Alt+Down',
    macKey: 'Shift+Option+Down',
    category: 'Basic Editing',
    description: 'Duplicates the current line or selected lines directly below the current position.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'copyLineDown'
  },
  {
    id: 'editor.action.deleteLines',
    title: 'Delete Line',
    key: 'Ctrl+Shift+K',
    macKey: 'Cmd+Shift+K',
    category: 'Basic Editing',
    description: 'Instantly deletes the entire current line without affecting the system clipboard.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'deleteLine'
  },
  {
    id: 'editor.action.insertLineAfter',
    title: 'Insert Line Below',
    key: 'Ctrl+Enter',
    macKey: 'Cmd+Enter',
    category: 'Basic Editing',
    description: 'Inserts a new empty line below the current cursor line and moves cursor there, regardless of column position.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'insertLineBelow'
  },
  {
    id: 'editor.action.insertLineBefore',
    title: 'Insert Line Above',
    key: 'Ctrl+Shift+Enter',
    macKey: 'Cmd+Shift+Enter',
    category: 'Basic Editing',
    description: 'Inserts a new blank line above the current line and focuses cursor at the start of that line.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'insertLineAbove'
  },
  {
    id: 'editor.action.indentLines',
    title: 'Indent Line',
    key: 'Ctrl+]',
    macKey: 'Cmd+]',
    category: 'Basic Editing',
    description: 'Indents the current line or selected block by one tab stop or spaces setting.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'indent'
  },
  {
    id: 'editor.action.outdentLines',
    title: 'Outdent Line',
    key: 'Ctrl+[',
    macKey: 'Cmd+[',
    category: 'Basic Editing',
    description: 'Decreases the indentation level of the current line or selected block by one indentation stop.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'outdent'
  },
  {
    id: 'editor.action.formatDocument',
    title: 'Format Document',
    key: 'Shift+Alt+F',
    macKey: 'Shift+Option+F',
    category: 'Basic Editing',
    description: 'Auto-formats the entire document according to configured indentation, bracket spacing, and linter rules.',
    when: 'editorHasDocumentFormattingProvider && editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'formatDocument'
  },

  // ==================== GENERAL WORKBENCH ====================
  {
    id: 'workbench.action.showCommands',
    title: 'Show All Commands (Command Palette)',
    key: 'Ctrl+Shift+P',
    macKey: 'Cmd+Shift+P',
    category: 'General',
    description: 'Opens the full command palette to search and trigger any IDE feature, extension action, or debugging tool.',
    when: '',
    source: 'Default',
    actionId: 'openCommandPalette'
  },
  {
    id: 'workbench.action.quickOpen',
    title: 'Quick Open, Go to File',
    key: 'Ctrl+P',
    macKey: 'Cmd+P',
    category: 'General',
    description: 'Instantly search and switch to any file across workspace repositories with fuzzy matching.',
    when: '',
    source: 'Default',
    actionId: 'quickOpen'
  },
  {
    id: 'workbench.action.openGlobalKeybindings',
    title: 'Open Keyboard Shortcuts',
    key: 'Ctrl+K Ctrl+S',
    macKey: 'Cmd+K Cmd+S',
    category: 'General',
    description: 'Opens the interactive Keyboard Shortcuts cheat sheet, search index, and keybinding manager.',
    when: '',
    source: 'Default',
    actionId: 'openKeybindings'
  },
  {
    id: 'workbench.action.openSettings',
    title: 'Open Settings (Preferences)',
    key: 'Ctrl+,',
    macKey: 'Cmd+,',
    category: 'General',
    description: 'Opens IDE Preferences to customize themes, font sizes, telemetry, AI models, and editor behavior.',
    when: '',
    source: 'Default',
    actionId: 'openSettings'
  },
  {
    id: 'workbench.action.toggleSidebarVisibility',
    title: 'Toggle Primary Sidebar',
    key: 'Ctrl+B',
    macKey: 'Cmd+B',
    category: 'General',
    description: 'Toggles visibility of the primary left navigation sidebar (Project Explorer, Search, Source Control).',
    when: '',
    source: 'Default',
    actionId: 'toggleLeftSidebar'
  },
  {
    id: 'workbench.action.terminal.toggleTerminal',
    title: 'Toggle Integrated Terminal / Console',
    key: 'Ctrl+`',
    macKey: 'Ctrl+`',
    category: 'General',
    description: 'Shows or hides the bottom console containing Sandbox Terminal, Problems, Output, and Test Results.',
    when: '',
    source: 'Default',
    actionId: 'toggleTerminal'
  },
  {
    id: 'workbench.action.togglePanel',
    title: 'Toggle Bottom Panel',
    key: 'Ctrl+J',
    macKey: 'Cmd+J',
    category: 'General',
    description: 'Collapses or restores the bottom dock panel containing problems diagnostics and terminal.',
    when: '',
    source: 'Default',
    actionId: 'togglePanel'
  },

  // ==================== FILE MANAGEMENT ====================
  {
    id: 'workbench.action.files.save',
    title: 'Save File',
    key: 'Ctrl+S',
    macKey: 'Cmd+S',
    category: 'File Management',
    description: 'Persists changes in the active file to local workspace storage and backend file server immediately.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'saveFile'
  },
  {
    id: 'workbench.action.files.saveAll',
    title: 'Save All Files',
    key: 'Ctrl+K S',
    macKey: 'Cmd+Alt+S',
    category: 'File Management',
    description: 'Flushes and saves all currently open modified/dirty editor tabs at once.',
    when: '',
    source: 'Default',
    actionId: 'saveAll'
  },
  {
    id: 'workbench.action.files.newUntitledFile',
    title: 'New File',
    key: 'Ctrl+N',
    macKey: 'Cmd+N',
    category: 'File Management',
    description: 'Creates a new empty scratch file in the workspace ready for editing.',
    when: '',
    source: 'Default',
    actionId: 'newFile'
  },
  {
    id: 'workbench.action.closeActiveEditor',
    title: 'Close Active Editor Tab',
    key: 'Ctrl+W',
    macKey: 'Cmd+W',
    category: 'File Management',
    description: 'Closes the currently active editor tab. If unsaved changes exist, prompts for confirmation.',
    when: '',
    source: 'Default',
    actionId: 'closeTab'
  },
  {
    id: 'workbench.action.reopenClosedEditor',
    title: 'Reopen Closed Editor Tab',
    key: 'Ctrl+Shift+T',
    macKey: 'Cmd+Shift+T',
    category: 'File Management',
    description: 'Re-opens the most recently closed file tab in the editor history stack.',
    when: '',
    source: 'Default',
    actionId: 'reopenTab'
  },
  {
    id: 'workbench.action.nextEditor',
    title: 'Next Editor Tab',
    key: 'Ctrl+PageDown',
    macKey: 'Cmd+Alt+Right',
    category: 'File Management',
    description: 'Cycles focus forward to the next tab in the open editor tab strip.',
    when: '',
    source: 'Default',
    actionId: 'nextTab'
  },
  {
    id: 'workbench.action.previousEditor',
    title: 'Previous Editor Tab',
    key: 'Ctrl+PageUp',
    macKey: 'Cmd+Alt+Left',
    category: 'File Management',
    description: 'Cycles focus backward to the previous tab in the open editor tab strip.',
    when: '',
    source: 'Default',
    actionId: 'prevTab'
  },

  // ==================== NAVIGATION & VIEWS ====================
  {
    id: 'workbench.view.explorer',
    title: 'View: Show Explorer',
    key: 'Ctrl+Shift+E',
    macKey: 'Cmd+Shift+E',
    category: 'Navigation',
    description: 'Focuses and opens the Project File Explorer tree on the left panel.',
    when: '',
    source: 'Default',
    actionId: 'showExplorer'
  },
  {
    id: 'workbench.view.search',
    title: 'View: Show Search',
    key: 'Ctrl+Shift+F',
    macKey: 'Cmd+Shift+F',
    category: 'Navigation',
    description: 'Switches view to the global search page to locate text across all repository files.',
    when: '',
    source: 'Default',
    actionId: 'showSearch'
  },
  {
    id: 'workbench.view.scm',
    title: 'View: Show Source Control (Git)',
    key: 'Ctrl+Shift+G',
    macKey: 'Ctrl+Shift+G',
    category: 'Navigation',
    description: 'Navigates to Git Source Control to review unstaged diffs, branch status, and commits.',
    when: '',
    source: 'Default',
    actionId: 'showSCM'
  },
  {
    id: 'workbench.view.debug',
    title: 'View: Show Run & Debug',
    key: 'Ctrl+Shift+D',
    macKey: 'Cmd+Shift+D',
    category: 'Navigation',
    description: 'Navigates to the interactive Debugger panel with call stack, variables, and breakpoints.',
    when: '',
    source: 'Default',
    actionId: 'showDebug'
  },
  {
    id: 'workbench.actions.view.problems',
    title: 'View: Show Problems Diagnostics',
    key: 'Ctrl+Shift+M',
    macKey: 'Cmd+Shift+M',
    category: 'Navigation',
    description: 'Opens bottom panel to the Problems diagnostic table showing active linter and AST findings.',
    when: '',
    source: 'Default',
    actionId: 'showProblems'
  },
  {
    id: 'workbench.action.gotoLine',
    title: 'Go to Line / Column',
    key: 'Ctrl+G',
    macKey: 'Ctrl+G',
    category: 'Navigation',
    description: 'Prompts for a line number and jumps cursor directly to that line in active editor.',
    when: 'editorTextFocus',
    source: 'Default',
    actionId: 'gotoLine'
  },

  // ==================== SEARCH & REPLACE ====================
  {
    id: 'actions.find',
    title: 'Find in File',
    key: 'Ctrl+F',
    macKey: 'Cmd+F',
    category: 'Search & Replace',
    description: 'Opens the search bar within the active editor with regex, whole word, and case match support.',
    when: 'editorTextFocus',
    source: 'Default',
    actionId: 'find'
  },
  {
    id: 'editor.action.startFindReplaceAction',
    title: 'Find and Replace',
    key: 'Ctrl+H',
    macKey: 'Cmd+Alt+F',
    category: 'Search & Replace',
    description: 'Opens the Find and Replace overlay in the active editor to replace single or all matches.',
    when: 'editorTextFocus && !editorReadonly',
    source: 'Default',
    actionId: 'replace'
  },
  {
    id: 'workbench.action.findInFiles',
    title: 'Find in Project Files',
    key: 'Ctrl+Shift+F',
    macKey: 'Cmd+Shift+F',
    category: 'Search & Replace',
    description: 'Performs multi-file project search across all workspace files with preview snippets.',
    when: '',
    source: 'Default',
    actionId: 'findInFiles'
  },

  // ==================== MULTI-CURSOR & SELECTION ====================
  {
    id: 'editor.action.addSelectionToNextFindMatch',
    title: 'Add Selection to Next Find Match',
    key: 'Ctrl+D',
    macKey: 'Cmd+D',
    category: 'Multi-Cursor',
    description: 'Selects the next matching occurrence of the current word or selection, adding an extra cursor for simultaneous editing.',
    when: 'editorTextFocus',
    source: 'Default',
    actionId: 'selectNextMatch'
  },
  {
    id: 'editor.action.selectHighlights',
    title: 'Select All Occurrences of Current Find',
    key: 'Ctrl+Shift+L',
    macKey: 'Cmd+Shift+L',
    category: 'Multi-Cursor',
    description: 'Adds a cursor at every single occurrence of the currently selected string across the entire file.',
    when: 'editorTextFocus',
    source: 'Default',
    actionId: 'selectAllOccurrences'
  },
  {
    id: 'editor.action.cursorUndo',
    title: 'Cursor Undo',
    key: 'Ctrl+U',
    macKey: 'Cmd+U',
    category: 'Multi-Cursor',
    description: 'Undoes the last cursor placement or multi-cursor selection operation.',
    when: 'editorTextFocus',
    source: 'Default',
    actionId: 'cursorUndo'
  },

  // ==================== TERMINAL ====================
  {
    id: 'workbench.action.terminal.new',
    title: 'Terminal: Create New Sandbox Terminal',
    key: 'Ctrl+Shift+`',
    macKey: 'Ctrl+Shift+`',
    category: 'Terminal',
    description: 'Spawns a new isolated Sandbox shell terminal instance in the bottom panel.',
    when: '',
    source: 'Default',
    actionId: 'newTerminal'
  },
  {
    id: 'workbench.action.terminal.clear',
    title: 'Terminal: Clear Terminal Buffer',
    key: 'Ctrl+K',
    macKey: 'Cmd+K',
    category: 'Terminal',
    description: 'Clears the scrollback history and display buffer of the active terminal instance.',
    when: 'terminalFocus',
    source: 'Default',
    actionId: 'clearTerminal'
  },

  // ==================== AETHERION AI & AUTONOMOUS DEBUGGING ====================
  {
    id: 'aetherion.runWorkflow',
    title: 'Run with AI Agents (Autonomous Pipeline)',
    key: 'Ctrl+Shift+A',
    macKey: 'Cmd+Shift+A',
    category: 'AI & Autonomous Debugging',
    description: 'Executes the full 5-Agent pipeline (Planner, Code Analysis, Diagnosis, Fix & Test, Validation) to detect, diagnose, and repair bugs.',
    when: '',
    source: 'AETHERION',
    actionId: 'runAI'
  },
  {
    id: 'aetherion.openFixes',
    title: 'AI Fixes: Propose Patch for Code',
    key: 'Ctrl+I',
    macKey: 'Cmd+I',
    category: 'AI & Autonomous Debugging',
    description: 'Focuses the AI Fixes panel and immediately triggers automated patch synthesis for the active code.',
    when: '',
    source: 'AETHERION',
    actionId: 'openFixes'
  },
  {
    id: 'aetherion.focusChat',
    title: 'Ask AETHERION in Chat',
    key: 'Ctrl+L',
    macKey: 'Cmd+L',
    category: 'AI & Autonomous Debugging',
    description: 'Opens and focuses the AI Chat sidebar to explain code, brainstorm architectures, or ask questions.',
    when: '',
    source: 'AETHERION',
    actionId: 'focusChat'
  },
  {
    id: 'aetherion.runSandboxTests',
    title: 'Run Test Suite in Sandbox',
    key: 'F5',
    macKey: 'F5',
    category: 'AI & Autonomous Debugging',
    description: 'Executes unit tests and regression assertions against the active workspace files in the sandboxed boundary.',
    when: '',
    source: 'AETHERION',
    actionId: 'runTests'
  }
];
