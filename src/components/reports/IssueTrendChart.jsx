import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts';

export default function IssueTrendChart({ data }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--bg-popup)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: 'var(--shadow-md)',
          fontSize: 11,
          color: 'var(--text-primary)'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: '#38bdf8' }}>{label}</div>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '1px 0' }}>
              <span style={{ color: entry.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: entry.color }} />
                <span style={{ textTransform: 'capitalize' }}>{entry.name}</span>
              </span>
              <span style={{ fontWeight: 600 }}>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

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
        height: '100%'
      }}
    >
      {/* Header with Title and Custom Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Issue Trend
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Track issues over time
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#a855f7' }} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Total</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Critical</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f97316' }} />
            <span style={{ color: 'var(--text-secondary)' }}>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#06b6d4' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Low</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ flex: 1, width: '100%', minHeight: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-subtle)' }}
            />
            <YAxis
              domain={[0, 40]}
              ticks={[0, 10, 20, 30, 40]}
              stroke="var(--text-muted)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Total Area with Smooth Curve and Dots */}
            <Area
              type="monotone"
              dataKey="total"
              stroke="#a855f7"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#totalGrad)"
              dot={{ r: 3.5, fill: '#a855f7', stroke: 'var(--bg-card)', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#c084fc' }}
            />
            {/* Critical Line */}
            <Area
              type="monotone"
              dataKey="critical"
              stroke="#ef4444"
              strokeWidth={2}
              fill="none"
              dot={{ r: 2.5, fill: '#ef4444', stroke: 'var(--bg-card)' }}
            />
            {/* High Line */}
            <Area
              type="monotone"
              dataKey="high"
              stroke="#f97316"
              strokeWidth={2}
              fill="none"
              dot={{ r: 2.5, fill: '#f97316', stroke: 'var(--bg-card)' }}
            />
            {/* Medium Line */}
            <Area
              type="monotone"
              dataKey="medium"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="none"
              dot={{ r: 2.5, fill: '#06b6d4', stroke: 'var(--bg-card)' }}
            />
            {/* Low Line */}
            <Area
              type="monotone"
              dataKey="low"
              stroke="#10b981"
              strokeWidth={2}
              fill="none"
              dot={{ r: 2.5, fill: '#10b981', stroke: 'var(--bg-card)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
