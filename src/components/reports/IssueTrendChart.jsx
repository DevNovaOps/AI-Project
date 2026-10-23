import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';

export default function IssueTrendChart({ data }) {
  const { theme } = useAppStore();
  const isLight = theme === 'light';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: isLight ? '#ffffff' : '#0a1628',
          border: isLight ? '1px solid #cbd5e1' : '1px solid #1e355b',
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: isLight ? '0 4px 14px rgba(0, 0, 0, 0.1)' : '0 8px 24px rgba(0, 0, 0, 0.6)',
          fontSize: 11,
          color: isLight ? '#0f172a' : '#ffffff'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: isLight ? '#0284c7' : '#38bdf8' }}>{label}</div>
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
      className="reports-card"
      style={{
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Header with Title and Custom Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="reports-heading" style={{ fontSize: 13, fontWeight: 700 }}>
            Issue Trend
          </div>
          <div className="reports-text-muted" style={{ fontSize: 11 }}>
            Track issues over time
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#a855f7' }} />
            <span className="reports-heading" style={{ fontWeight: 500 }}>Total</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span className="reports-text-muted">Critical</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f97316' }} />
            <span className="reports-text-muted">High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#06b6d4' }} />
            <span className="reports-text-muted">Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span className="reports-text-muted">Low</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ flex: 1, width: '100%', minHeight: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={isLight ? 0.2 : 0.25} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)'} vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke={isLight ? '#94a3b8' : '#64748b'} 
              fontSize={10} 
              tickLine={false} 
              axisLine={{ stroke: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)' }} 
            />
            <YAxis 
              domain={[0, 40]} 
              ticks={[0, 10, 20, 30, 40]} 
              stroke={isLight ? '#94a3b8' : '#64748b'} 
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
              dot={{ r: 3.5, fill: '#a855f7', stroke: isLight ? '#ffffff' : '#061326', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#c084fc' }}
            />
            {/* Critical Line */}
            <Area 
              type="monotone" 
              dataKey="critical" 
              stroke="#ef4444" 
              strokeWidth={2} 
              fill="none" 
              dot={{ r: 2.5, fill: '#ef4444', stroke: isLight ? '#ffffff' : '#061326' }}
            />
            {/* High Line */}
            <Area 
              type="monotone" 
              dataKey="high" 
              stroke="#f97316" 
              strokeWidth={2} 
              fill="none" 
              dot={{ r: 2.5, fill: '#f97316', stroke: isLight ? '#ffffff' : '#061326' }}
            />
            {/* Medium Line */}
            <Area 
              type="monotone" 
              dataKey="medium" 
              stroke="#06b6d4" 
              strokeWidth={2} 
              fill="none" 
              dot={{ r: 2.5, fill: '#06b6d4', stroke: isLight ? '#ffffff' : '#061326' }}
            />
            {/* Low Line */}
            <Area 
              type="monotone" 
              dataKey="low" 
              stroke="#10b981" 
              strokeWidth={2} 
              fill="none" 
              dot={{ r: 2.5, fill: '#10b981', stroke: isLight ? '#ffffff' : '#061326' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
