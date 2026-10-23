import React from 'react';
import { 
  FolderGit2, Search, GitBranch, Bug, CheckSquare, 
  Settings, Wrench, BarChart2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

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

      <div className="activity-bar-group">
        <button
          className={`activity-item ${location.pathname === '/settings' ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
          title="Settings (Ctrl+,)"
          aria-label="Settings"
        >
          <Settings size={18} strokeWidth={1.7} />
          <span className="activity-label">Settings</span>
        </button>
      </div>
    </aside>
  );
}
