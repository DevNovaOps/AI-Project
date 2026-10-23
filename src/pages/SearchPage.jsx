import React, { useState } from 'react';
import { Search, FileCode, ArrowRight, CornerDownLeft, Sparkles, Filter } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export default function SearchPage() {
  const navigate = useNavigate();
  const { setActiveFile, files } = useAppStore();
  const [query, setQuery] = useState('calculate_average');
  const [caseSensitive, setCaseSensitive] = useState(false);

  const searchResults = [
    {
      file: 'backend/main.py',
      line: 2,
      text: 'def calculate_average(numbers):',
      match: 'calculate_average'
    },
    {
      file: 'backend/main.py',
      line: 11,
      text: 'print("Average:", calculate_average(data))',
      match: 'calculate_average'
    },
    {
      file: 'backend/main.py',
      line: 15,
      text: 'print("Empty list average:", calculate_average(empty_list))',
      match: 'calculate_average'
    },
    {
      file: 'tests/test_main.py',
      line: 3,
      text: 'from backend.main import calculate_average',
      match: 'calculate_average'
    },
    {
      file: 'tests/test_main.py',
      line: 7,
      text: 'self.assertEqual(calculate_average([10, 20, 30, 40, 50]), 30)',
      match: 'calculate_average'
    }
  ];

  const handleResultClick = (res) => {
    setActiveFile(res.file);
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
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fast indexing across all 24 files in AegisVault repository</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="card" style={{ padding: '12px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0 10px', height: 34 }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search symbols, functions, or text across workspace..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', fontSize: 12, outline: 'none' }}
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
          {searchResults.length} occurrences found in 2 files
        </div>

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
                justifyContent: 'space-between'
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
      </div>
    </div>
  );
}
