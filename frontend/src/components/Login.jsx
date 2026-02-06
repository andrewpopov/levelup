import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { login, getAuthConfig, googleLogin } from '../api';
import GoogleSignInButton from './GoogleSignInButton';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authConfig, setAuthConfig] = useState(null);

  useEffect(() => {
    getAuthConfig()
      .then(res => setAuthConfig(res.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(username, password);
      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setError('');
    setLoading(true);
    try {
      const response = await googleLogin(credential);
      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <Heart size={48} color="#e91e63" fill="#e91e63" />
        </div>
        <h1>Welcome Back</h1>
        <p style={{
          textAlign: 'center',
          color: '#757575',
          fontSize: '0.95rem',
          marginTop: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          Continue your relationship journey together.
        </p>

        {error && <div className="error-message">{error}</div>}

        {authConfig?.googleClientId && (
          <>
            <GoogleSignInButton
              clientId={authConfig.googleClientId}
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setError(msg)}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1rem 0',
              gap: '0.75rem'
            }}>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
              <span style={{ color: '#999', fontSize: '0.85rem' }}>or sign in with email</span>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Email</label>
            <input
              type="email"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {authConfig?.signupAllowed !== false && (
          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#757575' }}>
            Don't have an account? <Link to="/register" style={{ color: '#e91e63' }}>Create Account</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
