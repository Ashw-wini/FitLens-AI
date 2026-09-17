import { NavLink, useLocation } from 'react-router-dom';

export default function Navbar({ onMenuToggle }) {
  const location = useLocation();
  
  const pageTitles = {
    '/': 'Dashboard',
    '/workout': 'AI Workout Trainer',
    '/meals': 'Meal Planner',
    '/schedule': 'Workout Schedule',
    '/profile': 'Profile Settings',
  };

  const title = pageTitles[location.pathname] || 'FitLens AI';
  
  const navLinks = [
    { to: '/', icon: '📊', label: 'Home' },
    { to: '/workout', icon: '🏋️', label: 'Train' },
    { to: '/meals', icon: '🥗', label: 'Meals' },
    { to: '/schedule', icon: '📅', label: 'Plan' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <>
      <header className="navbar">
        <button className="navbar-menu-btn" onClick={onMenuToggle}>☰</button>
        <h2 className="navbar-title">{title}</h2>
        <div className="navbar-actions">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </header>
      
      <nav className="mobile-nav">
        <ul className="mobile-nav-items">
          {navLinks.map(link => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                end={link.to === '/'}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
