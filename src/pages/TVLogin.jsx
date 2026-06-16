import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

function QRCode({ url }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}&bgcolor=111111&color=ffffff&margin=10`;
  return <img src={qrUrl} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 12 }} />;
}

export default function TVLogin() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('loading'); // loading, ready, approved, expired
  const [timeLeft, setTimeLeft] = useState(300);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const generateToken = async () => {
    setStatus('loading');
    try {
      const res = await client.get('/tv_auth.php?action=generate');
      if (res.data.ok) {
        setToken(res.data.token);
        setTimeLeft(300);
        setStatus('ready');
        startPolling(res.data.token);
        startTimer();
      }
    } catch {}
  };

  const startPolling = (tkn) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await client.get(`/tv_auth.php?action=check&token=${tkn}`);
        if (res.data.status === 'approved') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setStatus('approved');
          setTimeout(() => navigate('/'), 2000);
        } else if (res.data.status === 'expired') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setStatus('expired');
        }
      } catch {}
    }, 2000);
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          clearInterval(pollRef.current);
          setStatus('expired');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    generateToken();
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  const scanUrl = `https://v2.showmine.ng/scan-login?token=${token}`;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 900, letterSpacing: '.1em', color: '#e50914', marginBottom: 4 }}>SHOWMINE</div>
        <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', letterSpacing: '.15em', marginBottom: '2rem' }}>ENTERTAINMENT</div>

        {status === 'loading' && (
          <div style={{ padding: '3rem 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem' }}>Generating QR code...</p>
          </div>
        )}

        {status === 'ready' && token && (
          <>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '2rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)', marginBottom: '1.2rem', lineHeight: 1.6 }}>
                Scan this QR code with your phone to sign in
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <QRCode url={scanUrl} />
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, letterSpacing: '.3em', color: '#fff', marginBottom: '.5rem' }}>
                {token.slice(0, 4).toUpperCase()}-{token.slice(4, 8).toUpperCase()}
              </div>
              <p style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.25)' }}>Or visit showmine.ng/scan and enter code</p>
            </div>

            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '1.5rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${timeLeft < 60 ? '#e50914' : 'rgba(255,255,255,.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, color: timeLeft < 60 ? '#e50914' : 'rgba(255,255,255,.4)' }}>
                {mins}:{String(secs).padStart(2, '0')}
              </div>
              <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)' }}>QR code expires in</span>
            </div>

            {/* Polling indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s ease infinite' }} />
              <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)' }}>Waiting for scan...</span>
            </div>
          </>
        )}

        {status === 'approved' && (
          <div style={{ padding: '2rem 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,.15)', border: '2px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '.5rem' }}>Signed In!</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem' }}>Redirecting to home...</p>
          </div>
        )}

        {status === 'expired' && (
          <div style={{ padding: '2rem 0' }}>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', marginBottom: '1.5rem' }}>QR code expired. Generate a new one.</p>
            <button onClick={generateToken} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '.75rem 1.5rem', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.95rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Generate New Code
            </button>
          </div>
        )}

        <button onClick={() => navigate('/login')} style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', fontSize: '.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
          Sign in with password instead
        </button>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
        `}</style>
      </div>
    </div>
  );
}
