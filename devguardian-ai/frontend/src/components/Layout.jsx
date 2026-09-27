import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';

const NAV = [
  { section: 'Platform',  items: [
    { to: '/',           icon: '⬡', label: 'Overview' },
    { to: '/repository', icon: '📁', label: 'Repository' },
  ]},
  { section: 'Analysis',  items: [
    { to: '/findings',   icon: '🔍', label: 'Findings',  badge: 'critical' },
    { to: '/security',   icon: '🔒', label: 'Security' },
    { to: '/testing',    icon: '🧪', label: 'Testing' },
  ]},
  { section: 'Actions',   items: [
    { to: '/agents',     icon: '🤖', label: 'Agents' },
    { to: '/fixes',      icon: '🔧', label: 'Fixes' },
    { to: '/validation', icon: '✅', label: 'Validation' },
    { to: '/reports',    icon: '📊', label: 'Reports' },
  ]},
];

export default function Layout({ children }) {
  const { session, results } = useAnalysis();
  const criticalCount = results?.summary?.critical || 0;
  const isRunning = session?.status === 'running';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-badge">🛡️</div>
          <div>
            <div className="logo-text">DevGuardian</div>
            <div className="logo-sub">AI Platform</div>
          </div>
        </div>

        {NAV.map(group => (
          <div className="nav-section" key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.badge === 'critical' && criticalCount > 0 && (
                  <span className="nav-badge">{criticalCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          {isRunning ? (
            <div className="status-strip">
              <div>Running: <span className="status-agent">{session.currentAgent || 'orchestrator'}</span></div>
              <div className="progress-wrap">
                <div className="progress-fill" style={{ width: `${session.progress || 0}%` }} />
              </div>
            </div>
          ) : results ? (
            <div className="status-strip">
              <span className="text-green">✓</span> Analysis complete
            </div>
          ) : (
            <div className="status-strip">No analysis running</div>
          )}
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
