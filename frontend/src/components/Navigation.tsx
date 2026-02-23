import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { logout } = useAuth();

  const linkStyle = (isActive: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
    padding: '8px 12px',
    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.7rem',
    fontWeight: isActive ? 700 : 400,
  });

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid #333',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <NavLink to="/" style={({ isActive }) => linkStyle(isActive)}>
        <span style={{ fontSize: '1.25rem' }}>&#128218;</span>
        Review
      </NavLink>
      <NavLink to="/add" style={({ isActive }) => linkStyle(isActive)}>
        <span style={{ fontSize: '1.25rem' }}>&#10133;</span>
        Add
      </NavLink>
      <NavLink to="/cards" style={({ isActive }) => linkStyle(isActive)}>
        <span style={{ fontSize: '1.25rem' }}>&#128196;</span>
        Cards
      </NavLink>
      <NavLink to="/import" style={({ isActive }) => linkStyle(isActive)}>
        <span style={{ fontSize: '1.25rem' }}>&#128229;</span>
        Import
      </NavLink>
      <NavLink to="/extract" style={({ isActive }) => linkStyle(isActive)}>
        <span style={{ fontSize: '1.25rem' }}>&#9889;</span>
        AI
      </NavLink>
      <NavLink to="/settings" style={({ isActive }) => linkStyle(isActive)}>
        <span style={{ fontSize: '1.25rem' }}>&#9881;</span>
        Settings
      </NavLink>
      <button
        onClick={logout}
        style={{
          background: 'none',
          padding: '8px 12px',
          color: 'var(--text-secondary)',
          fontSize: '0.7rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>&#128682;</span>
        Logout
      </button>
    </nav>
  );
}
