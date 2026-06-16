import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

function QRCode({ url }) {
  // Simple QR code using Google Charts API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=111111&color=ffffff&margin=10`;
  return (
    <div style={{ textAlign: 'center' }}>
      <img src={qrUrl} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 12, border: '2px solid rgba(255,255,255,.1)' }} />
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (res.ok) navigate('/');
      else setError(res.error || 'Login failed');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginUrl = 'https://v2.showmine.ng/login';

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: isMobile ? 'column' : 'row'
    }}>
      {/* Left side — desktop only background */}
      {!isMobile && (
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0000 50%, #0a0a0a 100%)'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '3rem'
          }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '3.5rem', fontWeight: 900, letterSpacing: '.1em', color: '#e50914', marginBottom: 8 }}>SHOWMINE</div>
            <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.3)', letterSpacing: '.2em', marginBottom: '3rem' }}>ENTERTAINMENT</div>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,.5)', textAlign: 'center', maxWidth: 320, lineHeight: 1.7, marginBottom: '3rem' }}>
              Stream the best of African entertainment — movies, series, live TV and more.
            </p>

            {/* QR Code section — desktop only */}
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '1.5rem 2rem', textAlign: 'center', maxWidth: 280 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e50914', marginBottom: 8 }}>
                📱 Scan to Connect on Mobile
              </div>
              <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.35)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Scan this QR code with your phone to open Showmine on mobile
              </p>
              <QRCode url={loginUrl} />
              <p style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.2)', marginTop: '1rem' }}>
                v2.showmine.ng
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Right side — login form */}
      <div style={{
        width: isMobile ? '100%' : 440,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '2rem 1.25rem' : '2rem',
        background: isMobile ? '#000' : '#090909',
        borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,.05)'
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          {isMobile && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, letterSpacing: '.1em', color: '#e50914' }}>SHOWMINE</div>
              <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', letterSpacing: '.15em', marginTop: 4 }}>ENTERTAINMENT</div>
            </div>
          )}

          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '2rem' }}>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Sign In</h1>

            {error && (
              <div style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.3)', borderRadius: 8, padding: '.75rem 1rem', color: '#ff6b6b', fontSize: '.84rem', marginBottom: '1rem' }}>{error}</div>
            )}

            <form onSubmit={submit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.78rem', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>Email or Username</label>
                <input name="email" type="text" value={form.email} onChange={handle} required placeholder="Enter your email"
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: '.9rem', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '.78rem', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>Password</label>
                <input name="password" type="password" value={form.password} onChange={handle} required placeholder="Enter your password"
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: '.9rem', outline: 'none' }} />
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <Link to="/forgot-password" style={{ fontSize: '.75rem', color: '#e50914' }}>Forgot password?</Link>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '.85rem',
                background: loading ? '#333' : '#e50914',
                color: '#fff', border: 'none', borderRadius: 8,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1rem', fontWeight: 800,
                letterSpacing: '.06em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.84rem', color: 'rgba(255,255,255,.4)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#e50914', fontWeight: 700 }}>Sign Up</Link>
            </p>
          </div>

          {/* Mobile QR section */}
          {isMobile && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button onClick={() => setShowQR(!showQR)} style={{
                background: 'none', border: '1px solid rgba(255,255,255,.1)',
                color: 'rgba(255,255,255,.4)', borderRadius: 8,
                padding: '.5rem 1rem', fontSize: '.75rem', cursor: 'pointer'
              }}>
                {showQR ? 'Hide QR Code' : '📺 Connect to TV / Desktop'}
              </button>
              {showQR && (
                <div style={{ marginTop: '1rem', background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '1.25rem' }}>
                  <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginBottom: '1rem' }}>Scan on your TV or desktop browser</p>
                  <QRCode url={loginUrl} />
                </div>
              )}
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.72rem', color: 'rgba(255,255,255,.2)' }}>
            © 2026 Showmine Entertainment
          </p>
        </div>
      </div>
    </div>
  );
}
