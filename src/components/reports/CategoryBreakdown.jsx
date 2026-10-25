import React from 'react';

export default function CategoryBreakdown({ data = [] }) {
  const safeData = Array.isArray(data) ? data : [];
  const maxVal = Math.max(...safeData.map(d => d.count || 0), 8);

  return (
    <div
      className="card"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between'
      }}
    >
      {/* Header */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
        Issues by Category
      </div>

      {/* Progress Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'center' }}>
        {safeData.map((cat) => {
          const widthPct = Math.round((cat.count / maxVal) * 100);

          return (
            <div
              key={cat.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '95px 1fr 20px',
                alignItems: 'center',
                gap: 12,
                fontSize: 11
              }}
            >
              {/* Category Name */}
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {cat.name}
              </span>

              {/* Progress Bar Track */}
              <div
                style={{
                  height: 8,
                  backgroundColor: 'var(--border-subtle)',
                  borderRadius: 999,
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${widthPct}%`,
                    backgroundColor: cat.color,
                    borderRadius: 999,
                    boxShadow: `0 0 8px ${cat.color}66`,
                    transition: 'width 0.4s ease-out'
                  }}
                />
              </div>

              {/* Count */}
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                {cat.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
