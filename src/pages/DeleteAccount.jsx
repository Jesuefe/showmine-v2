import { useState } from 'react';
import { IconBadge } from '../components/Icon';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { account } from '../api/extras';

// Public route (also the web URL given to Google Play: v2.showmine.ng/delete-account).
const COND = "'Barlow Condensed', sans-serif";

const REMOVED = [
  ['user', 'Profile & login', 'Name, email, password and every signed-in device'],
  ['history', 'Watch history', 'Continue watching, progress and viewing stats'],
  ['heart', 'My List & likes', 'Saved titles, likes and reminders'],
  ['message', 'Comments & support', 'Comments are blanked; support tickets are removed'],
  ['bell', 'Notifications', 'Push tokens and in-app notifications'],
];

const ALTERNATIVES = [
  ['card', 'Just want to stop paying?', 'Your plan simply ends on its expiry date if you don’t renew.', '/subscribe'],
  ['phone', 'Worried about another device?', 'Sign out devices you don’t recognise instead.', '/sessions'],
  ['lifebuoy', 'Something not working?', 'Tell our support team — we’re happy to help.', '/support'],
];

const input = {
  width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,.05)',
  border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontSize: '.95rem', outline: 'none', fontFamily: 'inherit',
};

export default function DeleteAccount() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (confirm !== 'DELETE') { setError('Type DELETE in capital letters to confirm.'); return; }
    setBusy(true); setError('');
    try {
      const r = await account.remove(password);
      if (r.ok) {
        localStorage.removeItem('showmine_token');
        localStorage.removeItem('showmine_user');
        setUser(null); setDone(true);
      } else setError(r.error || 'Could not delete the account');
    } catch { setError('Network problem. Try again.'); }
    setBusy(false);
  };

  if (done) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ maxWidth: 380 }}>
          <IconBadge name="checkCircle" size={64} color="#22c55e" style={{ margin: '0 auto 14px' }} />
          <h1 style={{ fontFamily: COND, fontSize: '2rem', fontWeight: 900, margin: '0 0 8px' }}>Your account has been deleted</h1>
          <p style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: 22 }}>Thank you for watching with Showmine. You’re always welcome back — just create a new account.</p>
          <button onClick={() => navigate('/onboarding', { replace: true })} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e50914', color: '#fff', fontFamily: COND, fontSize: '1.05rem', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: 60 }}>
      <div style={{ padding: 'calc(env(safe-area-inset-top) + 14px) 20px 24px', background: 'radial-gradient(500px 240px at 50% 0%, rgba(229,9,20,.28), transparent 70%)' }}>
        <button onClick={() => (step === 2 ? setStep(1) : navigate(-1))} aria-label="Back" style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 12px', background: 'rgba(229,9,20,.15)', border: '1px solid rgba(229,9,20,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </div>
          <h1 style={{ fontFamily: COND, fontSize: '2rem', fontWeight: 900, margin: '0 0 6px' }}>Delete your account</h1>
          <p style={{ fontSize: '.86rem', color: 'rgba(255,255,255,.55)', margin: 0 }}>{user ? <>Signed in as <b style={{ color: '#fff' }}>{user.email}</b></> : 'This permanently removes your Showmine account.'}</p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
            {[1, 2].map(i => <div key={i} style={{ width: step === i ? 26 : 8, height: 8, borderRadius: 4, background: step >= i ? '#e50914' : 'rgba(255,255,255,.15)', transition: 'all .3s' }} />)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
        {step === 1 && (
          <>
            <div style={{ fontFamily: COND, fontSize: '.72rem', fontWeight: 800, letterSpacing: '.16em', color: 'rgba(255,255,255,.4)', margin: '0 4px 8px' }}>WHAT GETS DELETED</div>
            <div style={{ background: '#101013', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '4px 16px', marginBottom: 14 }}>
              {REMOVED.map(([ic, t, d], i) => (
                <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: i < REMOVED.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                  <IconBadge name={ic} size={34} color="#9ca3af" />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: '.88rem' }}>{t}</span>
                    <span style={{ display: 'block', fontSize: '.74rem', color: 'rgba(255,255,255,.45)' }}>{d}</span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2.6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, background: 'rgba(245,197,66,.06)', border: '1px solid rgba(245,197,66,.25)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
              This can’t be undone. An active subscription is not refunded and ends with the account. Payment records are kept only as long as tax law requires and are no longer linked to you.
            </div>

            {user && (
              <>
                <div style={{ fontFamily: COND, fontSize: '.72rem', fontWeight: 800, letterSpacing: '.16em', color: 'rgba(255,255,255,.4)', margin: '0 4px 8px' }}>BEFORE YOU GO</div>
                {ALTERNATIVES.map(([ic, t, d, to]) => (
                  <button key={t} onClick={() => navigate(to)} style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', padding: 14, marginBottom: 8, borderRadius: 14, background: '#0d0d10', border: '1px solid rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer' }}>
                    <IconBadge name={ic} size={34} color="#e50914" />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: '.85rem' }}>{t}</span>
                      <span style={{ display: 'block', fontSize: '.74rem', color: 'rgba(255,255,255,.45)' }}>{d}</span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
                <button onClick={() => setStep(2)} style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 12, background: 'transparent', border: '1px solid rgba(229,9,20,.5)', color: '#ff4d57', fontFamily: COND, fontSize: '1rem', fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  Continue to delete
                </button>
              </>
            )}

            {!user && (
              <div style={{ background: '#101013', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Sign in first</div>
                <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.6, margin: '0 0 14px' }}>Log in to the account you want to delete, then come back here (in the app: Profile → Settings → Delete account).</p>
                <button onClick={() => navigate('/login')} style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: '#e50914', color: '#fff', fontFamily: COND, fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}>Log in</button>
                <p style={{ fontSize: '.76rem', color: 'rgba(255,255,255,.4)', marginTop: 14, lineHeight: 1.6 }}>
                  Can’t log in? Email <a href="mailto:support@showmine.ng?subject=Delete%20my%20account" style={{ color: '#ff6b73' }}>support@showmine.ng</a> from the address on your account and we’ll delete it within 7 days.
                </p>
              </div>
            )}
          </>
        )}

        {step === 2 && user && (
          <form onSubmit={submit} style={{ background: '#101013', border: '1px solid rgba(229,9,20,.25)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontFamily: COND, fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>Confirm it’s you</div>
            <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', margin: '0 0 16px' }}>Enter your password and type DELETE.</p>
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>Password</label>
            <input style={{ ...input, marginBottom: 14 }} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your Showmine password" />
            <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>Type DELETE</label>
            <input style={{ ...input, letterSpacing: '.2em', fontWeight: 800, borderColor: confirm === 'DELETE' ? 'rgba(229,9,20,.6)' : 'rgba(255,255,255,.12)' }} autoCapitalize="characters" value={confirm} onChange={e => setConfirm(e.target.value.toUpperCase())} placeholder="DELETE" />
            {error && <div style={{ color: '#ff8080', fontSize: '.8rem', marginTop: 12 }}>{error}</div>}
            <button type="submit" disabled={busy || confirm !== 'DELETE'} style={{ width: '100%', marginTop: 18, padding: 15, borderRadius: 12, border: 'none', background: '#e50914', color: '#fff', fontFamily: COND, fontSize: '1.05rem', fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer', opacity: busy || confirm !== 'DELETE' ? .5 : 1 }}>
              {busy ? 'Deleting…' : 'Permanently delete my account'}
            </button>
            <button type="button" onClick={() => navigate('/profile')} style={{ width: '100%', marginTop: 10, padding: 13, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Keep my account</button>
          </form>
        )}
      </div>
    </div>
  );
}
