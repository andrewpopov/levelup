import { Link, useLocation } from 'react-router-dom';
import { Heart, BookOpen, Image, Sparkles, Target, MessageCircle, LogOut } from 'lucide-react';

function Header({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-content">
        <h1>
          <Heart size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Relationship Journal
        </h1>

        <nav className="nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Heart size={18} />
            Home
          </Link>
          <Link to="/journal" className={`nav-link ${isActive('/journal') ? 'active' : ''}`}>
            <BookOpen size={18} />
            Journal
          </Link>
          <Link to="/memories" className={`nav-link ${isActive('/memories') ? 'active' : ''}`}>
            <Image size={18} />
            Memories
          </Link>
          <Link to="/gratitude" className={`nav-link ${isActive('/gratitude') ? 'active' : ''}`}>
            <Sparkles size={18} />
            Gratitude
          </Link>
          <Link to="/goals" className={`nav-link ${isActive('/goals') ? 'active' : ''}`}>
            <Target size={18} />
            Goals
          </Link>
          <Link to="/questions" className={`nav-link ${isActive('/questions') ? 'active' : ''}`}>
            <MessageCircle size={18} />
            Questions
          </Link>
          <button onClick={onLogout} className="icon-button">
            <LogOut size={18} />
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
