import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (res.ok) {
        navigate('/');
      } else {
        setError(res.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '2rem', fontWeight: 900,
            letterSpacing: '.1em', color: '#e50914'
          }}>SHOWMINE</div>
          <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)', letterSpacing: '.15em', marginTop: 4 }}>
            ENTERTAINMENT
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#111', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 16, padding: '2rem'
        }}>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem'
          }}>Sign In</h1>

          {error && (
            <div style={{
              background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.3)',
              borderRadius: 8, padding: '.75rem 1rem',
              color: '#ff6b6b', fontSize: '.84rem', marginBottom: '1rem'
            }}>{error}</div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '.78rem', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>
                Email or Username
              </label>
              <input
                name="email" type="text" value={form.email}
                onChange={handle} required
                placeholder="Enter your email"
                style={{
                  width: '100%', padding: '.75rem 1rem',
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 8, color: '#fff', fontSize: '.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '.78rem', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>
                Password
              </label>
              <input
                name="password" type="password" value={form.password}
                onChange={handle} required
                placeholder="Enter your password"
                style={{
                  width: '100%', padding: '.75rem 1rem',
                  background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 8, color: '#fff', fontSize: '.9rem',
                  outline: 'none'
                }}
              />
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <Link to="/forgot-password" style={{ fontSize: '.75rem', color: '#e50914' }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '.85rem',
                background: loading ? '#333' : '#e50914',
                color: '#fff', border: 'none', borderRadius: 8,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1rem', fontWeight: 800,
                letterSpacing: '.06em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background .15s'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.84rem', color: 'rgba(255,255,255,.4)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#e50914', fontWeight: 700 }}>Sign Up</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.72rem', color: 'rgba(255,255,255,.2)' }}>
          © 2026 Showmine Entertainment
        </p>
      </div>
    </div>
  );
}