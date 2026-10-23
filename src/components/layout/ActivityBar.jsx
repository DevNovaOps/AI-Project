import React from 'react';
import { 
  Files, Search, GitBranch, Bug, FlaskConical, Blocks, 
  Settings, Wrench, BarChart2, MessageSquareCode
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export default function ActivityBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLeftSidebarOpen, toggleLeftSidebar } = useAppStore();

  const navItems = [
    { id: 'explorer', label: 'Explorer', icon: Files, path: '/', isToggle: true },
    { id: 'search', label: 'Search (Ctrl+Shift+F)', icon: Search, path: '/search' },
    { id: 'source-control', label: 'Source Control', icon: GitBranch, path: '/source-control' },
    { id: 'debug', label: 'Run and Debug', icon: Bug, path: '/debug' },
    { id: 'tests', label: 'Test Suite', icon: FlaskConical, path: '/tests' },
    { id: 'fixes', label: 'AI Fixes & Diffs', icon: Wrench, path: '/fixes' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart2, path: '/reports' },
    { id: 'extensions', label: 'Extensions', icon: Blocks, path: '/settings' }
  ];

  const handleNavClick = (item) => {
    if (item.id === 'explorer') {
      if (location.pathname === '/') {
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
              data-tooltip={item.label}
              aria-label={item.label}
            >
              <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
            </button>
          );
        })}
      </div>

      <div className="activity-bar-group">
        <button
          className={`activity-item ${location.pathname === '/settings' ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
          data-tooltip="Settings (Ctrl+,)"
          aria-label="Settings"
        >
          <Settings size={19} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
