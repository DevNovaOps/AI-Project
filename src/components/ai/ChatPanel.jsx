import React, { useState } from 'react';
import { Send, Bot, User, Copy, Check, Sparkles, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function ChatPanel() {
  const { activeFilePath, applyFix, issues } = useAppStore();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I'm AETHERION, your autonomous debugging partner. I've analyzed `backend/main.py` and detected an unchecked `ZeroDivisionError` on line 6. Would you like me to explain the root cause or generate a unit test?",
      time: '13:28'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = (textToSend) => {
    const query = textToSend || inputVal.trim();
    if (!query) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toTimeString().slice(0, 5)
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = query.toLowerCase();

      if (lower.includes('explain') || lower.includes('bug')) {
        reply = `In **backend/main.py**, line 6 evaluates \`sum(numbers) / len(numbers)\`. When \`numbers\` is an empty list \`[]\`, \`len(numbers)\` returns \`0\`, triggering a Python \`ZeroDivisionError\`. The fix requires a defensive guard before division:
\`\`\`python
if not numbers or len(numbers) == 0:
    return 0
\`\`\``;
      } else if (lower.includes('test') || lower.includes('unit')) {
        reply = `Here is the edge-case unit test for the empty list scenario:
\`\`\`python
def test_average_empty_list(self):
    """Empty list should evaluate safely to 0."""
    self.assertEqual(calculate_average([]), 0)
\`\`\`
This test is registered in **tests/test_main.py**.`;
      } else if (lower.includes('fix') || lower.includes('patch')) {
        reply = `I have generated an autonomous patch! Click below or in the **Fixes** tab to apply:
\`\`\`python
def calculate_average(numbers):
    if not numbers or len(numbers) == 0:
        return 0
    return sum(numbers) / len(numbers)
\`\`\``;
      } else {
        reply = `Based on the active file **${activeFilePath.split('/').pop()}**, I've verified AST structure and type safety. Everything is indexed in the AegisVault knowledge model. You can trigger the autonomous pipeline anytime using **Run with AI Agents**.`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: reply,
          time: new Date().toTimeString().slice(0, 5)
        }
      ]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 10 }}>
        {messages.map((m) => {
          const isBot = m.sender === 'assistant';

          return (
            <div 
              key={m.id} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: isBot ? 'flex-start' : 'flex-end',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                {isBot ? (
                  <>
                    <Bot size={12} color="#38bdf8" />
                    <span>AETHERION</span>
                  </>
                ) : (
                  <>
                    <span>You</span>
                    <User size={12} color="#a855f7" />
                  </>
                )}
                <span>{m.time}</span>
              </div>

              <div 
                style={{ 
                  maxWidth: '92%', 
                  padding: '8px 12px', 
                  borderRadius: isBot ? 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 2px' : 'var(--radius-lg) var(--radius-lg) 2px var(--radius-lg)',
                  backgroundColor: isBot ? 'var(--bg-card)' : 'rgba(59, 130, 246, 0.15)',
                  border: `1px solid ${isBot ? 'var(--border-subtle)' : 'rgba(59, 130, 246, 0.3)'}`,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', padding: '6px 8px' }}>
            <span className="animate-spin" style={{ width: 10, height: 10, border: '1.5px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <span>AETHERION is thinking...</span>
          </div>
        )}
      </div>

      {/* Suggested prompts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 0', borderTop: '1px solid var(--border-subtle)' }}>
        {[
          'Explain this function',
          'Find potential bugs',
          'Generate unit tests',
          'Refactor code'
        ].map((prompt, i) => (
          <button 
            key={i} 
            className="btn btn-secondary" 
            style={{ height: 22, fontSize: 10, padding: '0 6px', borderRadius: 'var(--radius-full)' }}
            onClick={() => handleSend(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
        style={{ display: 'flex', gap: 6, marginTop: 4 }}
      >
        <input
          type="text"
          placeholder="Ask a question about this file or error..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          style={{ flex: 1, height: 32, padding: '0 10px', fontSize: 11 }}
        />
        <button 
          type="submit" 
          className="btn btn-primary-gradient" 
          style={{ width: 34, height: 32, padding: 0 }}
          disabled={!inputVal.trim() || isTyping}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
