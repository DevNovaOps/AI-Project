import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function IssueDistributionChart({ data, totalCount = 24 }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div style={{
          backgroundColor: '#0a1628',
          border: '1px solid #1e355b',
          borderRadius: 6,
          padding: '6px 10px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          fontSize: 11,
          color: '#ffffff'
        }}>
          <span style={{ color: entry.payload.color, fontWeight: 700 }}>
            {entry.name}:
          </span>{' '}
          <span style={{ fontWeight: 600 }}>{entry.value} ({entry.payload.percentage})</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="card"
      style={{
        backgroundColor: '#061326',
        border: '1px solid #12243e',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Header */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
        Issue Distribution
      </div>

      {/* Body: Donut on Left, Legend on Right */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Donut Container with Absolute Center Label */}
        <div style={{ position: 'relative', width: 140, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={66}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
              {totalCount}
            </div>
            <div style={{ fontSize: 10, color: '#8fa2be', marginTop: 2 }}>
              Issues
            </div>
          </div>
        </div>

        {/* Legend List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, paddingLeft: 4 }}>
          {data.map((item) => (
            <div
              key={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
                lineHeight: 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    boxShadow: `0 0 6px ${item.color}80`
                  }}
                />
                <span style={{ color: '#c5d2e7', fontWeight: 500 }}>{item.name}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 600, color: '#ffffff', minWidth: 12, textAlign: 'right' }}>
                  {item.value}
                </span>
                <span style={{ color: '#8fa2be', minWidth: 28, textAlign: 'right', fontSize: 10 }}>
                  {item.percentage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
