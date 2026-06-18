import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import LanguageSelector from '../components/LanguageSelector';

function useIsMobile() {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = Math.min(window.screen.width, window.screen.height) < 768;
  const [mobile, setMobile] = useState(isTouchDevice && isSmallScreen);
  useEffect(() => {
    const fn = () => {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const small = Math.min(window.screen.width, window.screen.height) < 768;
      setMobile(touch && small);
    };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export default function Login() {
  const { t } = useI18n();
  const { login, loginForce, setUser } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceLimitInfo, setDeviceLimitInfo] = useState(null);
  const [forceLoading, setForceLoading] = useState(false);

  // QR state
  const [qrToken, setQrToken] = useState('');
  const [qrTimeLeft, setQrTimeLeft] = useState(300);
  const [qrStatus, setQrStatus] = useState('loading'); // loading, ready, approved, expired
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (res.ok) {
        navigate('/');
      } else if (res.device_limit_reached) {
        setDeviceLimitInfo({ max_devices: res.max_devices, message: res.error });
      } else {
        setError(res.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogin = async () => {
    setForceLoading(true);
    try {
      const res = await loginForce(form.email, form.password);
      if (res.ok) {
        setDeviceLimitInfo(null);
        navigate('/');
      } else {
        setError(res.error || 'Login failed');
        setDeviceLimitInfo(null);
      }
    } catch {
      setError('Network error. Please try again.');
      setDeviceLimitInfo(null);
    } finally {
      setForceLoading(false);
    }
  };

  const generateQR = async () => {
    setQrStatus('loading');
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
    try {
      const res = await client.get('/tv_auth.php?action=generate');
      if (res.data.ok) {
        setQrToken(res.data.token);
        setQrTimeLeft(300);
        setQrStatus('ready');

        // Poll for approval
        pollRef.current = setInterval(async () => {
          try {
            const r = await client.get(`/tv_auth.php?action=check&token=${res.data.token}`);
            if (r.data.status === 'approved') {
              clearInterval(pollRef.current);
              clearInterval(timerRef.current);
              setQrStatus('approved');
              // Refresh user from session
              client.get('/auth.php?action=me').then(me => {
                if (me.data.ok) setUser(me.data.user);
              });
              setTimeout(() => navigate('/'), 1500);
            } else if (r.data.status === 'expired') {
              clearInterval(pollRef.current);
              clearInterval(timerRef.current);
              setQrStatus('expired');
            }
          } catch {}
        }, 2000);

        // Countdown timer
        timerRef.current = setInterval(() => {
          setQrTimeLeft(t => {
            if (t <= 1) {
              clearInterval(timerRef.current);
              clearInterval(pollRef.current);
              setQrStatus('expired');
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      }
    } catch {}
  };

  useEffect(() => {
    // Only generate QR on desktop
    if (!isMobile) generateQR();
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, [isMobile]);

  const scanUrl = `https://v2.showmine.ng/scan-login?token=${qrToken}`;
  const qrImgUrl = qrToken ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(scanUrl)}&bgcolor=111111&color=ffffff&margin=8` : '';
  const mins = Math.floor(qrTimeLeft / 60);
  const secs = qrTimeLeft % 60;

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      position: 'relative'
    }}>
      {/* Language selector */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <LanguageSelector compact />
      </div>

      {/* Desktop left panel */}
      {!isMobile && (
        <div style={{
          flex: 1, background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0000 60%, #0a0a0a 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '3rem', borderRight: '1px solid rgba(255,255,255,.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <img src="https://showmine24.b-cdn.net/1024.png" alt="Showmine" style={{ width: 56, height: 56, objectFit: 'contain' }} />
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.5rem', fontWeight: 900, letterSpacing: '.1em', color: '#e50914' }}>SHOWMINE</div>
          </div>
          <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.25)', letterSpacing: '.2em', marginBottom: '2.5rem' }}>ENTERTAINMENT</div>
          <p style={{ fontSize: '.95rem', color: 'rgba(255,255,255,.4)', textAlign: 'center', maxWidth: 300, lineHeight: 1.7, marginBottom: '2.5rem' }}>
            {t('tagline')}
          </p>

          {/* QR section */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, padding: '1.5rem 2rem', textAlign: 'center', maxWidth: 280 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.62rem', fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#e50914', marginBottom: 6 }}>
              {t('scan_sign_in_mobile')}
            </div>
            <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)', marginBottom: '1rem', lineHeight: 1.5 }}>
              {t('open_showmine_scan')}
            </p>

            {qrStatus === 'loading' && (
              <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <div style={{ width: 32, height: 32, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
              </div>
            )}

            {qrStatus === 'ready' && qrToken && (
              <>
                <img src={qrImgUrl} alt="QR" style={{ width: 180, height: 180, borderRadius: 10, margin: '0 auto', display: 'block' }} />
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 900, letterSpacing: '.25em', color: '#fff', marginTop: '1rem' }}>
                  {qrToken.slice(0,4).toUpperCase()}-{qrToken.slice(4,8).toUpperCase()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '.75rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s ease infinite' }} />
                  <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.25)' }}>
                    Expires in {mins}:{String(secs).padStart(2,'0')}
                  </span>
                </div>
              </>
            )}

            {qrStatus === 'approved' && (
              <div style={{ padding: '1rem 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,.15)', border: '2px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ fontSize: '.82rem', color: '#22c55e', fontWeight: 700 }}>Signed in! Redirecting...</p>
              </div>
            )}

            {qrStatus === 'expired' && (
              <div style={{ padding: '.5rem 0' }}>
                <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)', marginBottom: '.75rem' }}>Code expired</p>
                <button onClick={generateQR} style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.25)', color: '#e50914', borderRadius: 8, padding: '6px 16px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}>
                  Generate New Code
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right panel — login form */}
      <div style={{
        width: isMobile ? '100%' : 420,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '2rem 1.25rem' : '2rem',
        background: isMobile ? '#000' : '#090909',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          {isMobile && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 4 }}>
                <img src="https://showmine24.b-cdn.net/1024.png" alt="Showmine" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, letterSpacing: '.1em', color: '#e50914' }}>SHOWMINE</span>
              </div>
              <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', letterSpacing: '.15em', marginTop: 4 }}>ENTERTAINMENT</div>
            </div>
          )}

          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '2rem' }}>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>{t('sign_in')}</h1>

            {error && (
              <div style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.3)', borderRadius: 8, padding: '.75rem 1rem', color: '#ff6b6b', fontSize: '.84rem', marginBottom: '1rem' }}>{error}</div>
            )}

            <form onSubmit={submit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.78rem', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>{t('email_username')}</label>
                <input name="email" type="text" value={form.email} onChange={handle} required placeholder="Enter your email"
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: '.9rem', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '.78rem', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>{t('password')}</label>
                <input name="password" type="password" value={form.password} onChange={handle} required placeholder="Enter your password"
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: '.9rem', outline: 'none' }} />
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <Link to="/forgot-password" style={{ fontSize: '.75rem', color: '#e50914' }}>{t('forgot_password')}</Link>
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
                {loading ? t('signing_in') : t('sign_in')}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.84rem', color: 'rgba(255,255,255,.4)' }}>
              {t('dont_have_account')}{' '}
              <Link to="/register" style={{ color: '#e50914', fontWeight: 700 }}>Sign Up</Link>
            </p>
          </div>

          {/* Mobile — scan to connect to TV */}
          {isMobile && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link to="/scan-login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                color: 'rgba(255,255,255,.35)', fontSize: '.78rem',
                textDecoration: 'none', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 8, padding: '.5rem 1rem'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 00-2 2v3m5-5v5h-5"/></svg>
                Sign in on TV with QR Code
              </Link>
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.72rem', color: 'rgba(255,255,255,.2)' }}>
            © 2026 Showmine Entertainment
          </p>
        </div>
      </div>

      {/* Device limit modal */}
      {deviceLimitInfo && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }}>
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '2rem', width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 800, marginBottom: '.5rem' }}>Device Limit Reached</h2>
            <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your plan allows {deviceLimitInfo.max_devices} device{deviceLimitInfo.max_devices > 1 ? 's' : ''} signed in at a time. Sign out of another device to continue, or log out everywhere and sign in here.
            </p>
            <button onClick={handleForceLogin} disabled={forceLoading} style={{
              width: '100%', padding: '12px', marginBottom: 10,
              background: forceLoading ? '#333' : '#e50914', border: 'none',
              borderRadius: 10, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '.9rem', fontWeight: 800, letterSpacing: '.04em',
              textTransform: 'uppercase', cursor: forceLoading ? 'not-allowed' : 'pointer'
            }}>
              {forceLoading ? 'Signing in...' : 'Log Out Other Devices & Continue'}
            </button>
            <button onClick={() => setDeviceLimitInfo(null)} style={{
              width: '100%', padding: '12px', background: 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.1)', borderRadius: 10,
              color: 'rgba(255,255,255,.5)', fontSize: '.85rem', cursor: 'pointer'
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
      `}</style>
    </div>
  );
}
