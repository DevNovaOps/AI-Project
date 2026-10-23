import React from 'react';
import {
  FolderGit2, Search, GitBranch, Bug, CheckSquare,
  Settings, Wrench, BarChart2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import aetherionLogo from '../../assets/images/aetherion-logo.png';

export default function ActivityBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleLeftSidebar } = useAppStore();

  const navItems = [
    { id: 'explorer', label: 'Explorer', icon: FolderGit2, path: '/', isToggle: true },
    { id: 'search', label: 'Search', icon: Search, path: '/search' },
    { id: 'source-control', label: 'Source Control', icon: GitBranch, path: '/source-control' },
    { id: 'debug', label: 'Debug', icon: Bug, path: '/debug' },
    { id: 'tests', label: 'Tests', icon: CheckSquare, path: '/tests' },
    { id: 'fixes', label: 'Fixes', icon: Wrench, path: '/fixes' },
    { id: 'reports', label: 'Reports', icon: BarChart2, path: '/reports' }
  ];

  const handleNavClick = (item) => {
    if (item.id === 'explorer') {
      if (location.pathname === '/' || location.pathname === '/editor') {
        toggleLeftSidebar();
      } else {
        navigate('/');
      }
    } else {
      navigate(item.path);
    }
  };

  return (
    <aside className="activity-bar" aria-label="Activity Bar">
      <div className="activity-bar-group">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === 'explorer'
            ? (location.pathname === '/' || location.pathname === '/editor')
            : location.pathname === item.path;

          return (
            <button
              key={item.id}
              className={`activity-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.7} />
              <span className="activity-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="activity-bar-group" style={{ gap: 6 }}>
        <button
          className={`activity-item ${location.pathname === '/settings' ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
          title="Settings (Ctrl+,)"
          aria-label="Settings"
        >
          <Settings size={18} strokeWidth={1.7} />
          <span className="activity-label">Settings</span>
        </button>

        {/* AegisVault mini card widget at bottom */}
        <div
          style={{
            width: 48,
            borderRadius: 6,
            padding: '6px 2px',
            backgroundColor: '#091326',
            border: '1px solid #1a2a47',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            marginTop: 4,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
          title="AETHERION - Autonomous multi-agent debugging system"
        >
          <div className="brand-logo-container" style={{ width: 28, height: 28, borderRadius: 6 }}>
            <img 
              src={aetherionLogo} 
              alt="AETHERION" 
              className="brand-logo-img" 
            />
          </div>
          <span style={{ fontSize: 8, fontWeight: 800, color: '#f8fafc', lineHeight: 1, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Aetherion
          </span>
          <span style={{ fontSize: 7, color: '#64748b', lineHeight: 1 }}>
            System
          </span>
          <div style={{ display: 'flex', gap: 3, fontSize: 7, color: '#38bdf8', marginTop: 2, fontWeight: 600 }}>
            <span>24</span>
            <span style={{ color: '#a855f7' }}>6</span>
            <span style={{ color: '#10b981' }}>12</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
