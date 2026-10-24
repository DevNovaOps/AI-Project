import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../../store/useAppStore';
import DiagnosticPopup from './DiagnosticPopup';
import { Play, Save, Check, FileCode } from 'lucide-react';
import { getLanguageInfo } from '../../utils/languages';

export default function CodeEditor() {
  const { 
    theme, activeFilePath, files, updateFileContent,
    cursorPosition, setCursorPosition,
    selectedIssueId, issues, runTests,
    saveActiveFile, isSavingFile,
    isDiagnosticPopupOpen, closeDiagnosticPopup,
    setCommandPalette, toggleLeftSidebar, toggleConsole, setRightSidebarTab
  } = useAppStore();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const hoverTimeoutRef = useRef(null);
  const isInternalCursorChange = useRef(false);

  const [isHoveringError, setIsHoveringError] = useState(false);
  const [isHoveringPopup, setIsHoveringPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 110, left: 450 });

  const isDismissedRef = useRef(false);
  const isHoveringPopupRef = useRef(false);
  isHoveringPopupRef.current = isHoveringPopup;

  const currentFile = activeFilePath ? files[activeFilePath] : null;

  // Filter issues for current active file
  const activeFileIssues = issues.filter((i) => {
    if (!activeFilePath) return false;
    const currentName = currentFile?.name || activeFilePath.split('/').pop();
    const issueFile = i.file || i.filePath;
    const issueBaseName = issueFile ? issueFile.split('/').pop() : '';
    return (
      i.filePath === activeFilePath ||
      i.fullPath === activeFilePath ||
      i.file === activeFilePath ||
      i.file === currentName ||
      issueBaseName === currentName
    );
  });

  const handlePopupClose = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    isDismissedRef.current = true;
    setIsHoveringError(false);
    setIsHoveringPopup(false);
    closeDiagnosticPopup();
  };

  // When diagnostic popup is explicitly opened from external action (e.g. Problems tab), reset dismissed state
  useEffect(() => {
    if (isDiagnosticPopupOpen) {
      isDismissedRef.current = false;
    }
  }, [isDiagnosticPopupOpen]);

  // Global listener: dismiss popup when clicking anywhere outside it (e.g. clicking in code, tabs, workspace)
  useEffect(() => {
    const handleDocumentMouseDown = (e) => {
      // Don't close if clicking inside the diagnostic popup itself
      if (e.target && e.target.closest && e.target.closest('.diagnostic-popup')) {
        return;
      }

      // Don't close if clicking inside the problems table/panel (which opens/selects an issue)
      if (e.target && e.target.closest && (
        e.target.closest('.ide-table') || 
        e.target.closest('.ide-table-wrapper') || 
        e.target.closest('.bottom-panel')
      )) {
        return;
      }

      // If popup is open and user clicked anywhere in code or outside
      if (isDiagnosticPopupOpen || isHoveringError || isHoveringPopup) {
        handlePopupClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handlePopupClose();
      }
    };

    window.addEventListener('mousedown', handleDocumentMouseDown, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleDocumentMouseDown, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDiagnosticPopupOpen, isHoveringError, isHoveringPopup]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    window.__AETHERION_EDITOR__ = editor;
    window.__AETHERION_MONACO__ = monaco;

    // Listen to cursor position
    editor.onDidChangeCursorPosition((e) => {
      isInternalCursorChange.current = true;
      setCursorPosition({ line: e.position.lineNumber, col: e.position.column });
      setTimeout(() => {
        isInternalCursorChange.current = false;
      }, 50);
    });

    // 1. SELECT ALL (Ctrl+A or Cmd+A) - Guarantee full document selection
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {
      const action = editor.getAction('editor.action.selectAll');
      if (action) {
        action.run();
      } else {
        const model = editor.getModel();
        if (model) {
          editor.setSelection(model.getFullModelRange());
        }
      }
      editor.focus();
    });

    // 2. Add Save command (Ctrl+S or Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (saveActiveFile) saveActiveFile();
    });

    // 3. Add Command Palette (Ctrl+P & Ctrl+Shift+P)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      setCommandPalette(true);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      setCommandPalette(true);
    });

    // 4. Find & Replace (Ctrl+F & Ctrl+H)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.getAction('actions.find')?.run();
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      editor.getAction('editor.action.startFindReplaceAction')?.run();
    });

    // 5. Add Selection to Next Find Match (Ctrl+D)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {
      editor.getAction('editor.action.addSelectionToNextFindMatch')?.run();
    });

    // 6. Toggle Line Comment (Ctrl+/)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.getAction('editor.action.commentLine')?.run();
    });

    // 7. Undo / Redo (Ctrl+Z & Ctrl+Y / Ctrl+Shift+Z)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', null);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {
      editor.trigger('keyboard', 'redo', null);
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'redo', null);
    });

    // 8. Format Document (Shift+Alt+F)
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
      editor.getAction('editor.action.formatDocument')?.run();
    });

    // 9. Move Lines Up / Down (Alt+Up / Alt+Down)
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
      editor.getAction('editor.action.moveLinesUpAction')?.run();
    });
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.getAction('editor.action.moveLinesDownAction')?.run();
    });

    // 10. Copy Lines Up / Down (Shift+Alt+Up / Shift+Alt+Down)
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {
      editor.getAction('editor.action.copyLinesUpAction')?.run();
    });
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {
      editor.getAction('editor.action.copyLinesDownAction')?.run();
    });

    // 11. Delete Line (Ctrl+Shift+K)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {
      editor.getAction('editor.action.deleteLines')?.run();
    });

    // 12. Toggle Left Sidebar (Ctrl+B)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      toggleLeftSidebar();
    });

    // 13. Toggle Bottom Terminal / Panel (Ctrl+J)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
      toggleConsole();
    });

    // 14. Focus AI Fixes (Ctrl+I)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      setRightSidebarTab('fixes');
    });

    // 15. Focus AI Chat (Ctrl+L)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {
      setRightSidebarTab('chat');
    });

    // If an initial line or cursor position was requested, reveal and position
    if (cursorPosition?.line) {
      setTimeout(() => {
        editor.revealLineInCenter(cursorPosition.line);
        editor.setPosition({ lineNumber: cursorPosition.line, column: cursorPosition.col || 1 });
        const lineTop = editor.getTopForLineNumber(cursorPosition.line) - editor.getScrollTop();
        const layout = editor.getLayoutInfo();
        const leftPos = Math.max(380, Math.min((layout?.contentLeft || 60) + 360, window.innerWidth - 680));
        setPopupPosition({
          top: Math.max(30, lineTop - 15),
          left: leftPos
        });
      }, 60);
    }

    // Clicking anywhere in the code or editor dismisses the diagnostic popup
    editor.onMouseDown((e) => {
      const targetLine = e.target.position?.lineNumber || e.target.detail?.lineNumber;
      const isGlyphElem = e.target.element && e.target.element.classList && (
        e.target.element.classList.contains('monaco-error-glyph') || 
        e.target.element.classList.contains('monaco-error-line-highlight')
      );
      const isGutterIssue = (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN || 
                             e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) && 
                             activeFileIssues.some(i => i.line === targetLine);

      if (isGlyphElem || isGutterIssue) {
        // Clicking specifically on the gutter error glyph toggles the popup
        if (isDiagnosticPopupOpen || isHoveringError) {
          handlePopupClose();
        } else {
          isDismissedRef.current = false;
          setIsHoveringError(true);
        }
      } else {
        // User clicked inside code: dismiss popup immediately!
        handlePopupClose();
      }
    });

    // Detect mouse move over issue line or error glyph: show error popup when hovering on it
    editor.onMouseMove((e) => {
      const targetLine = e.target.position?.lineNumber || e.target.detail?.lineNumber;
      const matchingIssue = activeFileIssues.find(i => i.line === targetLine);
      const isTargetIssue = !!matchingIssue && matchingIssue.status !== 'Fixed';
      const isGutterIssue = (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN || 
                             e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) && isTargetIssue;
      const isGlyphElem = e.target.element && e.target.element.classList && e.target.element.classList.contains('monaco-error-glyph');

      // If user recently dismissed the popup by clicking in code, don't re-trigger while mouse is still on issue line
      if (isDismissedRef.current) {
        if (!isTargetIssue && !isGutterIssue && !isGlyphElem) {
          isDismissedRef.current = false;
        }
        return;
      }

      if (isTargetIssue || isGutterIssue || isGlyphElem) {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }

        const effectiveLine = targetLine || cursorPosition?.line || 1;
        const lineTop = editor.getTopForLineNumber(effectiveLine) - editor.getScrollTop();
        const layout = editor.getLayoutInfo();
        const leftPos = Math.max(380, Math.min((layout?.contentLeft || 60) + 360, window.innerWidth - 680));

        setPopupPosition({
          top: Math.max(30, lineTop - 15),
          left: leftPos
        });
        setIsHoveringError(true);
      } else {
        // Moved off issue line: brief grace timeout (500ms) so user can comfortably move mouse into popup
        if (!isHoveringPopupRef.current) {
          if (!hoverTimeoutRef.current) {
            hoverTimeoutRef.current = setTimeout(() => {
              if (!isHoveringPopupRef.current) {
                setIsHoveringError(false);
              }
              hoverTimeoutRef.current = null;
            }, 500);
          }
        }
      }
    });

    editor.onMouseLeave(() => {
      if (!isHoveringPopupRef.current) {
        hoverTimeoutRef.current = setTimeout(() => {
          if (!isHoveringPopupRef.current) {
            setIsHoveringError(false);
          }
          hoverTimeoutRef.current = null;
        }, 500);
      }
    });

    applyDecorations();
  };

  const applyDecorations = () => {
    if (!editorRef.current || !monacoRef.current || !activeFilePath) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Combine active file issues and line 6 decoration for backend/main.py
    const decorationsList = [];

    if (activeFileIssues.length > 0) {
      activeFileIssues.forEach((issue) => {
        const line = issue.line || 1;
        const isFixed = issue.status === 'Fixed';

        decorationsList.push({
          range: new monaco.Range(line, 1, line, 100),
          options: {
            isWholeLine: true,
            className: isFixed ? 'monaco-success-line-highlight' : 'monaco-error-line-highlight',
            glyphMarginClassName: isFixed ? 'monaco-success-glyph' : 'monaco-error-glyph',
            hoverMessage: {
              value: `**${issue.severity || 'Issue'}**: ${issue.title}\n\n${issue.detail || ''}`,
            },
            inlineClassName: isFixed ? undefined : 'monaco-error-inline-squiggly',
          },
        });
      });
    } else if (activeFilePath === 'backend/main.py') {
      const issue = issues.find(i => i.id === 'ISSUE-01');
      const isFixed = issue && issue.status === 'Fixed';

      if (!isFixed) {
        decorationsList.push({
          range: new monaco.Range(6, 1, 6, 45),
          options: {
            isWholeLine: true,
            className: 'monaco-error-line-highlight',
            glyphMarginClassName: 'monaco-error-glyph',
            hoverMessage: { value: '**Runtime Error**: Division by zero. len(numbers) could be 0.' },
            inlineClassName: 'monaco-error-inline-squiggly'
          }
        });
      } else {
        decorationsList.push({
          range: new monaco.Range(3, 1, 4, 20),
          options: {
            isWholeLine: true,
            className: 'monaco-success-line-highlight',
            glyphMarginClassName: 'monaco-success-glyph',
            hoverMessage: { value: '**Fix Validated**: Defensive boundary guard in place.' }
          }
        });
      }
    }

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorationsList);
  };

  useEffect(() => {
    applyDecorations();
  }, [activeFilePath, issues]);

  // Jump to line when cursorPosition changes from external actions (like clicking Problems table)
  useEffect(() => {
    if (!editorRef.current || !cursorPosition) return;
    
    // If cursor change was triggered internally by user typing, clicking, or selecting in the editor, do not reset position
    if (isInternalCursorChange.current) return;

    // If editor has an active selection (e.g. from Ctrl+A or dragging), never collapse it!
    const selection = editorRef.current.getSelection();
    if (selection && !selection.isEmpty()) return;

    const currentPos = editorRef.current.getPosition();
    if (currentPos && currentPos.lineNumber === cursorPosition.line && currentPos.column === (cursorPosition.col || 1)) {
      return;
    }

    editorRef.current.revealLineInCenter(cursorPosition.line);
    editorRef.current.setPosition({ lineNumber: cursorPosition.line, column: cursorPosition.col || 1 });
    if (cursorPosition.line) {
      const lineTop = editorRef.current.getTopForLineNumber(cursorPosition.line) - editorRef.current.getScrollTop();
      const layout = editorRef.current.getLayoutInfo();
      const leftPos = Math.max(380, Math.min((layout?.contentLeft || 60) + 360, window.innerWidth - 680));
      setPopupPosition({
        top: Math.max(30, lineTop - 15),
        left: leftPos
      });
    }
  }, [cursorPosition, activeFilePath]);

  // Clean up global reference when editor unmounts
  useEffect(() => {
    return () => {
      if (window.__AETHERION_EDITOR__ === editorRef.current) {
        window.__AETHERION_EDITOR__ = null;
        window.__AETHERION_MONACO__ = null;
      }
    };
  }, []);

  if (!activeFilePath || !currentFile) {
    return (
      <div className="editor-canvas-container" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, backgroundColor: 'var(--bg-editor)', color: 'var(--text-muted)'
      }}>
        <FileCode size={48} strokeWidth={1.2} color="var(--border-focus)" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>No File Open</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Select a file from the Project Explorer or press Ctrl+K</div>
        </div>
      </div>
    );
  }

  // The popup is shown when hovered over error or opened via Problems panel, as long as the issue isn't fixed
  const currentIssue = issues.find(i => i.id === selectedIssueId);
  const isSelectedFixed = currentIssue && currentIssue.status === 'Fixed';
  const shouldShowPopup = (isHoveringError || isHoveringPopup || isDiagnosticPopupOpen) && !isSelectedFixed;

  return (
    <div 
      className="editor-canvas-container"
      onClick={() => {
        if (editorRef.current && !editorRef.current.hasTextFocus()) {
          editorRef.current.focus();
        }
      }}
    >
      {/* Monaco Editor */}
      <Editor
        height="calc(100% - 24px)"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        path={activeFilePath}
        language={currentFile.language || 'plaintext'}
        value={currentFile.content || ''}
        onChange={(val) => updateFileContent(activeFilePath, val || '')}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          lineHeight: 20,
          minimap: { enabled: true, renderCharacters: false, maxColumn: 80 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          automaticLayout: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          glyphMargin: true,
          wordWrap: 'on',
          tabSize: 4,
          padding: { top: 12, bottom: 12 },
          copyWithSyntaxHighlighting: true,
          contextmenu: true,
          multiCursorModifier: 'alt',
          formatOnPaste: true,
          quickSuggestions: true,
          selectOnLineNumbers: true
        }}
      />

      {/* Floating Diagnostic Card */}
      {shouldShowPopup && (
        <DiagnosticPopup 
          style={{ 
            top: `${popupPosition.top}px`, 
            left: `${popupPosition.left}px` 
          }}
          onMouseEnter={() => {
            setIsHoveringPopup(true);
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }
          }}
          onMouseLeave={() => {
            setIsHoveringPopup(false);
            hoverTimeoutRef.current = setTimeout(() => {
              setIsHoveringError(false);
              hoverTimeoutRef.current = null;
            }, 250);
          }}
          onClose={handlePopupClose}
        />
      )}

      {/* Editor Status Bar Footer */}
      <div className="editor-status-bar">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{currentFile.name}</span>
          {currentFile.isDirty && <span style={{ color: '#fbbf24', fontSize: 11 }}>● Unsaved</span>}
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ textTransform: 'capitalize' }}>{currentFile.language || 'plaintext'}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>UTF-8</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>{getLanguageInfo(currentFile.language || 'plaintext').runtime}</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22, color: 'var(--color-success)' }}
            onClick={runTests}
            title="Run File in Sandbox"
          >
            <Play size={12} fill="currentColor" />
          </button>
          
          <button 
            className="icon-action-btn" 
            style={{ width: 22, height: 22, color: currentFile.isDirty ? '#38bdf8' : 'var(--text-muted)' }}
            onClick={saveActiveFile}
            disabled={isSavingFile || !currentFile.isDirty}
            title="Save file (Ctrl+S)"
          >
            <Save size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
