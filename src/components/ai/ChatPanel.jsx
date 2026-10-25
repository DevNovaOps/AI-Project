import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, Check, Sparkles, Trash2, Cpu, FileCode, CornerDownLeft, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { chatApi } from '../../api/chat';

function FormattedMessage({ text }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by markdown triple backticks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          let lang = 'code';
          let codeContent = '';

          if (firstLineEnd !== -1) {
            lang = part.slice(3, firstLineEnd).trim() || 'code';
            codeContent = part.slice(firstLineEnd + 1, -3);
          } else {
            codeContent = part.slice(3, -3);
          }

          return (
            <div
              key={index}
              style={{
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-editor, #090d16)',
                margin: '4px 0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: 10,
                  color: 'var(--text-muted)'
                }}
              >
                <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#38bdf8' }}>{lang}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeContent, index)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedIndex === index ? '#10b981' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10
                  }}
                  title="Copy code to clipboard"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check size={11} color="#10b981" />
                      <span style={{ color: '#10b981' }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '8px 10px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  lineHeight: 1.45,
                  overflowX: 'auto',
                  color: '#e2e8f0',
                  whiteSpace: 'pre'
                }}
              >
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        // Render plain text and inline code blocks
        return (
          <div key={index} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
            {part.split(/(`[^`]+`)/g).map((subPart, subIdx) => {
              if (subPart.startsWith('`') && subPart.endsWith('`') && subPart.length > 2) {
                return (
                  <code
                    key={subIdx}
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontSize: '0.9em',
                      fontFamily: 'var(--font-mono, monospace)'
                    }}
                  >
                    {subPart.slice(1, -1)}
                  </code>
                );
              }
              // Render bold formatting
              return subPart.split(/(\*\*[^*]+\*\*)/g).map((bPart, bIdx) => {
                if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
                  return <strong key={bIdx} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{bPart.slice(2, -2)}</strong>;
                }
                return bPart;
              });
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function ChatPanel() {
  const {
    activeFilePath,
    files,
    liveEditorContent,
    activeLanguage,
    currentProject,
    issues,
    selectedModel
  } = useAppStore();

  const activeFileName = activeFilePath ? activeFilePath.split('/').pop() : '';

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: `Hello! I'm AETHERION, your AI autonomous debugging and coding partner powered by **${selectedModel || 'Groq Qwen 27B'}**. I'm ready to answer any questions, explain architecture, diagnose bugs, or write unit tests for your project. Ask me anything!`,
      time: new Date().toTimeString().slice(0, 5)
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputVal).trim();
    if (!query || isTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toTimeString().slice(0, 5)
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputVal('');
    setIsTyping(true);

    try {
      // Gather active code context
      const fileData = files ? files[activeFilePath] : null;
      const fileContent = liveEditorContent !== null ? liveEditorContent : (fileData?.content || '');

      // Format payload for backend chat API
      const apiMessages = newMessages
        .slice(-10)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const context = {
        active_file_path: activeFilePath || undefined,
        active_file_content: fileContent ? fileContent.slice(0, 8000) : undefined,
        language: activeLanguage || undefined,
        project_name: currentProject?.name || undefined,
        issues: Array.isArray(issues) ? issues.slice(0, 10) : undefined
      };

      const response = await chatApi.sendMessage({
        messages: apiMessages,
        context,
        model: selectedModel || 'qwen/qwen3.8-27b'
      });

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: response.content || 'I have analyzed your request.',
          time: new Date().toTimeString().slice(0, 5),
          model: response.model
        }
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `I encountered a communication issue while contacting the LLM backend. Please ensure the backend is running, or try asking your question again.`,
          time: new Date().toTimeString().slice(0, 5),
          isError: true
        }
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: `Conversation reset. How can I help you with **${activeFileName || 'your workspace'}**?`,
        time: new Date().toTimeString().slice(0, 5)
      }
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Top Model & Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          fontSize: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            {selectedModel ? selectedModel.split('/').pop() : 'Qwen 27B'}
          </span>
          {activeFileName && (
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              • <FileCode size={10} color="#38bdf8" /> {activeFileName}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClearHistory}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10
          }}
          title="Clear chat history and start fresh conversation"
        >
          <Trash2 size={11} />
          <span>Clear</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '10px 4px 10px 0'
        }}
      >
        {messages.map((m) => {
          const isBot = m.sender === 'assistant';

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isBot ? 'flex-start' : 'flex-end',
                gap: 4,
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                {isBot ? (
                  <>
                    <Bot size={12} color="#38bdf8" />
                    <span style={{ fontWeight: 600, color: '#38bdf8' }}>AETHERION</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 600, color: '#a855f7' }}>You</span>
                    <User size={12} color="#a855f7" />
                  </>
                )}
                <span>{m.time}</span>
              </div>

              <div
                style={{
                  maxWidth: isBot ? '96%' : '88%',
                  padding: '9px 12px',
                  borderRadius: isBot ? 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 2px' : 'var(--radius-lg) var(--radius-lg) 2px var(--radius-lg)',
                  backgroundColor: isBot ? 'var(--bg-card)' : 'rgba(59, 130, 246, 0.15)',
                  border: `1px solid ${isBot ? 'var(--border-subtle)' : 'rgba(59, 130, 246, 0.35)'}`,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  boxShadow: isBot ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(59, 130, 246, 0.1)'
                }}
              >
                <FormattedMessage text={m.text} />
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              color: 'var(--text-secondary)',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              width: 'fit-content'
            }}
          >
            <div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <span>AETHERION is analyzing and generating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Action Prompts */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          padding: '6px 0',
          borderTop: '1px solid var(--border-subtle)'
        }}
      >
        {[
          activeFileName ? `Explain ${activeFileName}` : 'Explain active code',
          'Find potential bugs',
          'Generate unit tests',
          'Refactor for performance'
        ].map((prompt, i) => (
          <button
            key={i}
            type="button"
            className="btn btn-secondary"
            style={{
              height: 22,
              fontSize: 10,
              padding: '0 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card-subtle, rgba(255,255,255,0.03))',
              borderColor: 'var(--border-subtle)'
            }}
            onClick={() => handleSend(prompt)}
            disabled={isTyping}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={activeFileName ? `Ask anything about ${activeFileName} or general coding...` : 'Ask anything about this code or general programming...'}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          style={{
            flex: 1,
            height: 34,
            padding: '0 12px',
            fontSize: 11,
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)'
          }}
        />
        <button
          type="submit"
          className="btn btn-primary-gradient"
          style={{
            width: 36,
            height: 34,
            padding: 0,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          disabled={!inputVal.trim() || isTyping}
          title="Send message to AETHERION (Enter)"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
