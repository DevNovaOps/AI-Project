import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../../store/useAppStore';
import DiagnosticPopup from './DiagnosticPopup';
import { Play, Save, Check, FileCode } from 'lucide-react';

export default function CodeEditor() {
  const { 
    theme, activeFilePath, files, updateFileContent,
    cursorPosition, setCursorPosition,
    issues, saveActiveFile, isSavingFile,
    isDiagnosticPopupOpen, closeDiagnosticPopup
  } = useAppStore();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const currentFile = activeFilePath ? files[activeFilePath] : null;

  // Filter issues for current active file
  const activeFileIssues = issues.filter(
    (i) => i.filePath === activeFilePath || i.file === activeFilePath
  );

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen to cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({ line: e.position.lineNumber, col: e.position.column });
    });

    // Add Save command (Ctrl+S or Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveActiveFile();
    });

    applyDecorations();
  };

  const applyDecorations = () => {
    if (!editorRef.current || !monacoRef.current || !activeFilePath) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const newDecorations = activeFileIssues.map((issue) => {
      const line = issue.line || 1;
      const isFixed = issue.status === 'Fixed';

      return {
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
      };
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  };

  useEffect(() => {
    applyDecorations();
  }, [activeFilePath, issues]);

  // Jump to line when cursorPosition changes from external actions (like clicking Problems table)
  useEffect(() => {
    if (editorRef.current && cursorPosition) {
      editorRef.current.revealLineInCenter(cursorPosition.line);
      editorRef.current.setPosition({ lineNumber: cursorPosition.line, column: cursorPosition.col || 1 });
    }
  }, [cursorPosition]);

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

  return (
    <div className="editor-canvas-container">
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
          padding: { top: 12, bottom: 12 }
        }}
      />

      {/* Floating Diagnostic Card */}
      {isDiagnosticPopupOpen && activeFileIssues.length > 0 && (
        <DiagnosticPopup 
          style={{ top: '80px', right: '40px' }}
          onClose={closeDiagnosticPopup}
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
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
