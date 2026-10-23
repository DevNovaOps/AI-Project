import React, { useState, useMemo } from 'react';
import { Search, FileCode, ArrowRight, CornerDownLeft, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export default function SearchPage() {
  const navigate = useNavigate();
  const { setActiveFile, files, currentProject, setCursorPosition } = useAppStore();
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Search dynamically across all loaded files in the project
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const results = [];
    const term = caseSensitive ? query : query.toLowerCase();

    Object.values(files).forEach((file) => {
      if (!file.content) return;
      const lines = file.content.split('\n');
      lines.forEach((lineText, idx) => {
        const textToSearch = caseSensitive ? lineText : lineText.toLowerCase();
        if (textToSearch.includes(term)) {
          results.push({
            file: file.path,
            line: idx + 1,
            text: lineText.trim(),
            match: query,
          });
        }
      });
    });

    return results;
  }, [files, query, caseSensitive]);

  const handleResultClick = (res) => {
    setActiveFile(res.file);
    setCursorPosition({ line: res.line, col: 1 });
    navigate('/');
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
        <div className="logo-badge" style={{ width: 32, height: 32 }}>
          <Search size={18} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Workspace Global Search</h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Real-time regex and text search across files in {currentProject?.name || 'Workspace'}
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="card" style={{ padding: '12px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0 10px', height: 34 }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              autoFocus
              placeholder="Search symbols, functions, or text across workspace..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 12, outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>

          <button 
            className={`btn btn-secondary ${caseSensitive ? 'active' : ''}`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            style={{ height: 34, fontSize: 11, padding: '0 10px' }}
          >
            Aa Match Case
          </button>
        </div>
      </div>

      {/* Search Results */}
      <div className="card" style={{ padding: '14px', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {query.trim() ? `${searchResults.length} occurrences found` : 'Enter a search term to find occurrences'}
        </div>

        {searchResults.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            {query.trim() ? 'No matches found in workspace files.' : 'Search across all open and indexed files.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {searchResults.map((res, idx) => (
              <div
                key={idx}
                className="palette-item"
                style={{ 
                  padding: '8px 12px', 
                  background: 'var(--bg-card-subtle)', 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={() => handleResultClick(res)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileCode size={14} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {res.file}:{res.line}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>
                      {res.text}
                    </div>
                  </div>
                </div>

                <ArrowRight size={13} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
