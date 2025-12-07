import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, BookOpen, PenTool, LogOut, Library, Zap, Settings } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Header({ user, onLogout }) {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(`${API_URL}/api/auth/is-admin`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsAdmin(response.data.isAdmin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, []);

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
          {isAdmin && (
            <Link to="/admin/journeys" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              <Settings size={18} />
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
