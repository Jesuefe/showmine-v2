import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PinDialog, ForgotPinDialog } from '../components/PinPad';
import { useKids } from '../context/KidsContext';
import KidProfileForm from './KidProfileForm';
import { kidsApi, KFONT, KBG } from './api';
import { successHaptic } from '../utils/feel';

const fmt = (s) => { const m = Math.round((s || 0) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };

// PIN-protected grown-ups area inside Kids Mode.
export default function ParentZone() {
  const navigate = useNavigate();
  const location = useLocation();
  const { exit } = useKids();
  const [pin, setPin] = useState(location.state?.pin || null);
  const [dialog, setDialog] = useState(location.state?.pin ? null : 'pin');
  const [profile, setProfile] = useState(null);
  const [time, setTime] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pin) return;
    kidsApi.home().then(r => { if (r.ok) { setProfile(r.profile); setTime(r.time); } }).catch(() => {});
  }, [pin]);

  const save = async (extra) => {
    setBusy(true); setMsg('');
    try {
      const r = await kidsApi.saveProfile({ ...profile, pin, ...extra });
      if (r.ok) { setProfile(r.profile); setTime(r.time); setMsg(extra?.extra_mins ? `Added ${extra.extra_mins} minutes for today` : 'Saved'); successHaptic(); }
      else setMsg(r.error || 'Could not save');
    } catch { setMsg('No connection. Try again.'); }
    setBusy(false);
  };

  const leave = async () => {
    const r = await exit(pin);
    if (r.ok) navigate('/', { replace: true }); else setMsg(r.error || 'Could not leave Kids Mode');
  };

  const pct = time?.limit_secs ? Math.min(100, (time.used_secs / time.limit_secs) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: KBG, fontFamily: KFONT, color: '#fff', padding: 'calc(env(safe-area-inset-top) + 16px) 20px 60px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <button onClick={() => navigate('/kids', { replace: true })} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontFamily: KFONT, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="15 18 9 12 15 6"/></svg> Back to Kids
        </button>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 900, margin: '14px 0 2px' }}>Grown-ups</h1>
        <p style={{ color: 'rgba(255,255,255,.55)', margin: '0 0 18px', fontSize: '.9rem' }}>Rules and profile for Kids Mode on this account.</p>

        {pin && profile && (<>
          {/* Today */}
          <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 900 }}>Watched today</span>
              <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>{fmt(time?.used_secs)}</span>
            </div>
            {time?.limit_secs > 0 && (<>
              <div style={{ height: 10, borderRadius: 6, background: 'rgba(255,255,255,.1)', margin: '10px 0 6px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: pct >= 100 ? '#f87171' : 'linear-gradient(90deg,#4ade80,#facc15)', transition: 'width .5s' }} />
              </div>
              <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)' }}>{time.left_secs > 0 ? `${fmt(time.left_secs)} left of ${fmt(time.limit_secs)}` : 'Daily limit reached'}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {[15, 30].map(m => (
                  <button key={m} disabled={busy} onClick={() => save({ extra_mins: m })} style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: '#facc15', color: '#1a1033', fontWeight: 900, fontFamily: KFONT, cursor: 'pointer' }}>+{m} min today</button>
                ))}
              </div>
            </>)}
          </div>

          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: 16 }}>
            <KidProfileForm value={profile} onChange={setProfile} />
            {msg && <div style={{ marginTop: 14, fontWeight: 800, color: /saved|added/i.test(msg) ? '#4ade80' : '#f87171' }}>{msg}</div>}
            <button disabled={busy} onClick={() => save()} style={{ marginTop: 18, width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: '#e50914', color: '#fff', fontWeight: 900, fontSize: '1rem', fontFamily: KFONT, cursor: 'pointer', opacity: busy ? .6 : 1 }}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          <button onClick={leave} style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.18)', background: 'transparent', color: '#fff', fontWeight: 800, fontFamily: KFONT, cursor: 'pointer' }}>
            Leave Kids Mode
          </button>
        </>)}
      </div>

      {dialog === 'pin' && (
        <PinDialog title="Grown-ups only" subtitle="Enter your parental PIN"
          onSubmit={async (p) => { const r = await kidsApi.verifyPin(p); if (r.ok) { setPin(p); setDialog(null); } return r; }}
          onCancel={() => navigate('/kids', { replace: true })}
          onForgot={() => setDialog('forgot')} />
      )}
      {dialog === 'forgot' && (
        <ForgotPinDialog onClose={() => setDialog('pin')} onDone={() => navigate('/kids-setup', { replace: true, state: { reset: true } })} />
      )}
    </div>
  );
}
