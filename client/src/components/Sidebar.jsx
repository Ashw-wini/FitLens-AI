import { NavLink } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const links = [
    { to: '/', icon: '📊', label: 'Dashboard' },
    { to: '/workout', icon: '🏋️', label: 'AI Workout' },
    { to: '/meals', icon: '🥗', label: 'Meal Planner' },
    { to: '/schedule', icon: '📅', label: 'Schedule' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99,
        display: 'none'
      }} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">💪</div>
          <h1>FitLens AI</h1>
        </div>
        <nav className="sidebar-nav">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              end={link.to === '/'}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ 
          padding: 'var(--space-md)', 
          borderTop: '1px solid var(--border)', 
          marginTop: 'auto',
          fontSize: 'var(--font-xs)',
          color: 'var(--text-tertiary)',
          textAlign: 'center'
        }}>
          FitLens AI v1.0<br/>
          Powered by MediaPipe
        </div>
      </aside>
    </>
  );
}
