import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { register, getAuthConfig, googleLogin } from '../api';
import GoogleSignInButton from './GoogleSignInButton';

function Register({ onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authConfig, setAuthConfig] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAuthConfig()
      .then(res => {
        setAuthConfig(res.data);
        if (res.data.signupAllowed === false) {
          navigate('/login', { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await register(email, password);
      onRegister(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setError('');
    setLoading(true);
    try {
      const response = await googleLogin(credential);
      onRegister(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  if (authConfig?.signupAllowed === false) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <Heart size={48} color="#e91e63" fill="#e91e63" />
        </div>
        <h1>Join Our Journal</h1>
        <p style={{
          textAlign: 'center',
          color: '#757575',
          fontSize: '0.95rem',
          marginTop: '0.5rem',
          marginBottom: '1.5rem',
          lineHeight: '1.5'
        }}>
          A shared space to reflect, grow, and stay close together.
          <br />
          <span style={{ fontSize: '0.9rem' }}>
            For you and your partner – one private journal, two voices.
          </span>
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
              <span style={{ color: '#999', fontSize: '0.85rem' }}>or sign up with email</span>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              minLength="6"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '0.75rem',
          fontSize: '0.85rem',
          color: '#999'
        }}>
          Your entries are private. We'll never sell your data.
        </p>

        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#757575' }}>
          Already have an account? <Link to="/login" style={{ color: '#e91e63' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
