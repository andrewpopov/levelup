import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, BookOpen, PenTool, LogOut, Library, Zap, Shield } from 'lucide-react';

function Header({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/journaling') {
      return location.pathname.startsWith('/journal') ||
             location.pathname.startsWith('/gratitude') ||
             location.pathname.startsWith('/goals') ||
             location.pathname.startsWith('/memories');
    }
    if (path === '/journeys') {
      return location.pathname.startsWith('/journeys') ||
             location.pathname.startsWith('/journey');
    }
    if (path === '/admin') {
      return location.pathname.startsWith('/admin');
    }
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1>
          <TrendingUp size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Level Up Journal
        </h1>

        <nav className="nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <TrendingUp size={18} />
            Home
          </Link>
          <Link to="/journeys" className={`nav-link ${isActive('/journeys') ? 'active' : ''}`}>
            <Library size={18} />
            Journeys
          </Link>
          <Link to="/journaling" className={`nav-link ${isActive('/journaling') ? 'active' : ''}`}>
            <PenTool size={18} />
            Journaling
          </Link>
          {user?.roles?.includes('admin') && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              <Shield size={18} />
              Admin
            </Link>
          )}
          <button onClick={onLogout} className="icon-button">
            <LogOut size={18} />
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
