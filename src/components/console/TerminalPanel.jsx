import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Trash2, Play, CornerDownLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function TerminalPanel() {
  const { appliedFixes, applyFix, runTests } = useAppStore();
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState([
    { type: 'output', text: 'AETHERION Sandbox Terminal v2.4 (Python 3.11.5 Virtualenv active)' },
    { type: 'cmd', text: 'python backend/main.py' },
    { type: 'output', text: 'Average: 30.0' },
    { type: 'error', text: 'Traceback (most recent call last):\n  File "backend/main.py", line 15, in <module>\n    print("Empty list average:", calculate_average(empty_list))\n  File "backend/main.py", line 6, in calculate_average\n    return sum(numbers) / len(numbers)\nZeroDivisionError: division by zero' },
    { type: 'info', text: '💡 Suggestion: Click "Run with AI Agents" or type "ai-fix" to patch this error automatically.' }
  ]);

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const newHistory = [...history, { type: 'cmd', text: cmd }];

    if (cmd === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    }

    if (cmd === 'help') {
      newHistory.push({
        type: 'output',
        text: 'Available Commands:\n  python backend/main.py  - Execute target file in sandbox\n  pytest                  - Run test suite in tests/test_main.py\n  ai-fix                  - Apply autonomous AI repair patch\n  status                  - Check workspace health and diagnostics\n  clear                   - Clear terminal screen'
      });
    } else if (cmd === 'python backend/main.py' || cmd === 'python main.py') {
      const isFixed = appliedFixes.includes('ISSUE-01');
      if (isFixed) {
        newHistory.push({
          type: 'output',
          text: 'Average: 30.0\nEmpty list average: 0\n\n[Process completed successfully with exit code 0]'
        });
      } else {
        newHistory.push(
          { type: 'output', text: 'Average: 30.0' },
          { 
            type: 'error', 
            text: 'Traceback (most recent call last):\n  File "backend/main.py", line 15, in <module>\n    print("Empty list average:", calculate_average(empty_list))\n  File "backend/main.py", line 6, in calculate_average\n    return sum(numbers) / len(numbers)\nZeroDivisionError: division by zero' 
          }
        );
      }
    } else if (cmd === 'pytest') {
      const isFixed = appliedFixes.includes('ISSUE-01');
      if (isFixed) {
        newHistory.push({
          type: 'output',
          text: '============================= test session starts =============================\nplatform win32 -- Python 3.11.5, pytest-8.0.0\ncollected 4 items\n\ntests/test_main.py ....                                                  [100%]\n\n============================== 4 passed in 0.08s =============================='
        });
      } else {
        newHistory.push({
          type: 'error',
          text: '============================= test session starts =============================\ncollected 4 items\n\ntests/test_main.py ..F.                                                 [100%]\n\n=================================== FAILURES ===================================\n_______________________ TestCalculateAverage.test_average_empty_list _______________________\nZeroDivisionError: division by zero at backend/main.py:6\n=========================== 1 failed, 3 passed in 0.09s ==========================='
        });
      }
    } else if (cmd === 'ai-fix') {
      applyFix('ISSUE-01');
      newHistory.push({
        type: 'info',
        text: '✓ Autonomous patch applied to backend/main.py.\n✓ Empty list guard deployed.\nRun "pytest" or "python backend/main.py" to verify.'
      });
    } else if (cmd === 'status') {
      newHistory.push({
        type: 'output',
        text: `Workspace: AegisVault\nBranch: main\nCritical Issues: ${appliedFixes.includes('ISSUE-01') ? 0 : 1}\nAgent Pipeline: Ready`
      });
    } else {
      newHistory.push({
        type: 'output',
        text: `zsh: command not found: ${cmd}. Type "help" for a list of sandbox commands.`
      });
    }

    setHistory(newHistory);
    setInputVal('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <button 
          className="btn btn-secondary" 
          style={{ height: 22, fontSize: 10, padding: '0 6px' }}
          onClick={() => setHistory([])}
          title="Clear Terminal"
        >
          <Trash2 size={11} />
          <span>Clear</span>
        </button>
      </div>

      {/* Terminal Output */}
      <div className="terminal-container" style={{ flex: 1, overflowY: 'auto' }}>
        {history.map((item, idx) => {
          if (item.type === 'cmd') {
            return (
              <div key={idx} className="terminal-line">
                <span className="terminal-prompt">aegis-vault:~/backend$</span>
                <span style={{ color: 'var(--text-primary)' }}>{item.text}</span>
              </div>
            );
          }
          if (item.type === 'error') {
            return (
              <div key={idx} className="terminal-line" style={{ color: 'var(--color-critical)', whiteSpace: 'pre-wrap' }}>
                {item.text}
              </div>
            );
          }
          if (item.type === 'info') {
            return (
              <div key={idx} className="terminal-line" style={{ color: '#38bdf8', whiteSpace: 'pre-wrap' }}>
                {item.text}
              </div>
            );
          }
          return (
            <div key={idx} className="terminal-line" style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
              {item.text}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleCommand} className="terminal-input-row">
        <span className="terminal-prompt">aegis-vault:~/backend$</span>
        <input
          type="text"
          className="terminal-input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type a command (try 'python main.py', 'pytest', 'ai-fix', 'help')..."
          autoFocus
        />
        <CornerDownLeft size={13} color="var(--text-muted)" />
      </form>
    </div>
  );
}
