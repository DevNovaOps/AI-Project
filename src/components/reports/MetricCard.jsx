import React from 'react';
import { 
  Bug, AlertTriangle, Info, FileText, Clock, CheckCircle2, 
  ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

export default function MetricCard({ 
  title, value, change, isPositive, subtitle, iconType, 
  color, bg, border, onClick, isSelected 
}) {
  const renderIcon = () => {
    switch (iconType) {
      case 'bug':
        return <Bug size={20} color={color} />;
      case 'warning':
        return <AlertTriangle size={20} color={color} />;
      case 'info':
        return <Info size={20} color={color} />;
      case 'document':
        return <FileText size={20} color={color} />;
      case 'clock':
        return <Clock size={20} color={color} />;
      case 'check':
        return <CheckCircle2 size={20} color={color} />;
      default:
        return <Info size={20} color={color} />;
    }
  };

  return (
    <div 
      className="reports-card"
      onClick={onClick}
      style={{
        border: isSelected ? `1px solid ${color}` : undefined,
        boxShadow: isSelected ? `0 0 14px ${color}33` : undefined,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Icon Badge */}
      <div 
        style={{
          width: 42,
          height: 42,
          minWidth: 42,
          borderRadius: '50%',
          backgroundColor: bg,
          border: `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 10px ${color}26`
        }}
      >
        {renderIcon()}
      </div>

      {/* Metric Content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <span className="reports-text-muted" style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
          <span className="reports-heading" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>
            {value}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span 
              style={{ 
                fontSize: 10, 
                fontWeight: 600, 
                color: change.startsWith('-') ? '#10b981' : (isPositive ? '#10b981' : (color || '#ef4444')),
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <span>{change.startsWith('-') ? '▼' : '▲'}</span>
              <span>{change}</span>
            </span>
            <span className="reports-sub-muted" style={{ fontSize: 9, marginTop: 2 }}>
              {subtitle || 'vs last run'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
