import { Link } from 'react-router-dom';

interface NavbarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export function Navbar({ isDarkMode, toggleTheme }: NavbarProps) {
  return (
    <header className="navbar glass-panel">
      <div className="container nav-content">
        <div className="logo">
          <Link to="/" className="text-gradient" style={{ textDecoration: 'none' }}>Sydaura</Link>
        </div>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/about">About</Link>
          <button className="theme-toggle hover-lift" onClick={toggleTheme} aria-label="Toggle theme">
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </nav>
      </div>
    </header>
  );
}
