import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../../store/useAppStore';
import DiagnosticPopup from './DiagnosticPopup';
import { Play, Check, AlertCircle } from 'lucide-react';

export default function CodeEditor() {
  const { 
    theme, activeFilePath, files, updateFileContent,
    cursorPosition, setCursorPosition, openDiagnosticPopup,
    selectedIssueId, issues, runTests
  } = useAppStore();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const currentFile = files[activeFilePath] || {
    name: 'untitled',
    language: 'plaintext',
    content: ''
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen to cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({ line: e.position.lineNumber, col: e.position.column });
      if (activeFilePath === 'backend/main.py' && e.position.lineNumber === 6) {
        openDiagnosticPopup('ISSUE-01');
      }
    });

    applyErrorDecorations();
  };

  const applyErrorDecorations = () => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (activeFilePath === 'backend/main.py') {
      const issue = issues.find(i => i.id === 'ISSUE-01');
      const isFixed = issue && issue.status === 'Fixed';

      if (!isFixed) {
        // Red squiggly underline & line highlight on line 6
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
          {
            range: new monaco.Range(6, 1, 6, 45),
            options: {
              isWholeLine: true,
              className: 'monaco-error-line-highlight',
              glyphMarginClassName: 'monaco-error-glyph',
              hoverMessage: { value: '**Runtime Error**: Division by zero. len(numbers) could be 0.' },
              inlineClassName: 'monaco-error-inline-squiggly'
            }
          }
        ]);
      } else {
        // Green validated decoration
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
          {
            range: new monaco.Range(3, 1, 4, 20),
            options: {
              isWholeLine: true,
              className: 'monaco-success-line-highlight',
              glyphMarginClassName: 'monaco-success-glyph',
              hoverMessage: { value: '**Fix Validated**: Defensive boundary guard in place.' }
            }
          }
        ]);
      }
    } else {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  };

  useEffect(() => {
    applyErrorDecorations();
  }, [activeFilePath, issues]);

  // Jump to line when cursorPosition changes from external actions (like clicking Problems table)
  useEffect(() => {
    if (editorRef.current && cursorPosition) {
      editorRef.current.revealLineInCenter(cursorPosition.line);
      editorRef.current.setPosition({ lineNumber: cursorPosition.line, column: cursorPosition.col || 1 });
    }
  }, [cursorPosition]);

  return (
    <div className="editor-canvas-container">
      {/* Monaco Editor */}
      <Editor
        height="calc(100% - 24px)"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        path={activeFilePath}
        language={currentFile.language || 'python'}
        value={currentFile.content}
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

      {/* Floating Diagnostic Card when main.py is active */}
      {activeFilePath === 'backend/main.py' && <DiagnosticPopup />}

      {/* Editor Status Bar Footer */}
      <div className="editor-status-bar">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{currentFile.name}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>Spaces: 4</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>UTF-8</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>Python 3.11.5</span>
        </span>

        <button 
          className="icon-action-btn" 
          style={{ width: 22, height: 22, color: 'var(--color-success)' }}
          onClick={runTests}
          title="Run File in Sandbox"
        >
          <Play size={12} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
