import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function ScanLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [error, setError] = useState('');

  const approve = async (tkn) => {
    if (!tkn) return;
    if (!user) { navigate(`/login?next=/scan-login?token=${tkn}`); return; }
    setStatus('loading');
    setError('');
    try {
      const res = await client.post('/tv_auth.php?action=approve', { token: tkn });
      if (res.data.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(res.data.error || 'Failed to approve. Code may be expired.');
      }
    } catch {
      setStatus('error');
      setError('Network error. Please try again.');
    }
  };

  // Auto-approve if token in URL and user is logged in
  useEffect(() => {
    const tkn = searchParams.get('token');
    if (tkn && user) {
      setToken(tkn);
      approve(tkn);
    } else if (tkn && !user) {
      setToken(tkn);
    }
  }, [user]);

  const handleManual = () => {
    const code = manualCode.replace('-', '').toLowerCase();
    if (code.length < 8) { setError('Enter the full code from your TV screen'); return; }
    approve(code);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 900, letterSpacing: '.1em', color: '#e50914', marginBottom: 4 }}>SHOWMINE</div>
        <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', letterSpacing: '.15em', marginBottom: '2rem' }}>TV SIGN IN</div>

        {!user && (
          <div style={{ background: 'rgba(229,9,20,.08)', border: '1px solid rgba(229,9,20,.2)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.6)', marginBottom: '.75rem' }}>You need to be signed in to approve TV login</p>
            <button onClick={() => navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '.6rem 1.2rem', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.85rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
              Sign In First
            </button>
          </div>
        )}

        {status === 'idle' && user && !token && (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '1.5rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Enter the code shown on your TV screen
            </p>
            <input
              type="text" value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              maxLength={9}
              style={{ width: '100%', padding: '.75rem', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center', letterSpacing: '.2em', outline: 'none', marginBottom: '1rem' }}
            />
            {error && <p style={{ color: '#ff6b6b', fontSize: '.78rem', marginBottom: '.75rem' }}>{error}</p>}
            <button onClick={handleManual} style={{ width: '100%', padding: '.75rem', background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.95rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
              Approve TV Login
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div style={{ padding: '2rem 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem' }}>Approving TV login...</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ padding: '2rem 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,.15)', border: '2px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '.5rem' }}>TV Approved!</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', marginBottom: '1.5rem' }}>Your TV should now be signed in. You can close this page.</p>
            <button onClick={() => navigate('/')} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '.6rem 1.2rem', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.85rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
              Go to Home
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '1rem 0' }}>
            <p style={{ color: '#ff6b6b', fontSize: '.85rem', marginBottom: '1rem' }}>{error}</p>
            <button onClick={() => { setStatus('idle'); setError(''); }} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 8, padding: '.6rem 1.2rem', fontSize: '.82rem', cursor: 'pointer' }}>Try Again</button>
          </div>
        )}

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
