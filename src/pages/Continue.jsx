import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

// Landing page for the app → browser hand-off.
// The app opens /continue?code=…&next=/subscribe. The code is single-use and
// expires in about two minutes; we swap it for a web session, then go on.
export default function Continue() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { completeLogin } = useAuth();
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  const nextRaw = params.get('next') || '/subscribe';
  const next = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/subscribe';

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const code = (params.get('code') || '').trim();
    // Drop the code from the address bar and history straight away
    window.history.replaceState(null, '', '/continue');
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(code)) { setFailed(true); return; }

    client.post('/web_handoff.php?action=redeem', { code })
      .then(res => {
        if (res.data?.ok && res.data.token) {
          completeLogin(res.data.token, res.data.user);
          navigate(next, { replace: true });
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loginLink = `/login?next=${encodeURIComponent(next)}`;

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: 360 }}>
        {!failed ? (
          <>
            <div style={{ width: 44, height: 44, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 1.25rem' }} />
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800 }}>Signing you in…</h2>
            <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.85rem', marginTop: '.4rem' }}>Taking you to your plans</p>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '.5rem' }}>This link has expired</h2>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>Sign in with the same account you use in the app and we'll take you straight to the plans.</p>
            <Link to={loginLink} style={{ display: 'inline-block', background: '#e50914', color: '#fff', borderRadius: 10, padding: '12px 26px', fontWeight: 800, textDecoration: 'none' }}>Sign in</Link>
          </>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
