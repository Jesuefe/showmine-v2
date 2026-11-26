import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKids } from '../context/KidsContext';
import { PinPad } from '../components/PinPad';

const FEATURES = [
  { emoji: '🛡️', title: 'Kids-only titles', text: 'Only shows made for children. Everything else is blocked, even by link.' },
  { emoji: '🔒', title: 'PIN-locked exit', text: 'Menus, search and settings are hidden. Leaving needs your 4-digit PIN.' },
  { emoji: '💬', title: 'No comments or sharing', text: 'Social features are switched off while Kids Mode is on.' },
  { emoji: '🎨', title: 'Made for little hands', text: 'Big, colourful buttons and simple categories.' },
];

const H = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900 };
const card = { background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18 };
const primaryBtn = {
  width: '100%', padding: '15px', background: '#e50914', border: 'none', borderRadius: 12, color: '#fff',
  ...H, fontSize: '1.05rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.05em',
  boxShadow: '0 8px 24px rgba(229,9,20,.35)',
};
const ghostBtn = {
  width: '100%', padding: '14px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 12, color: 'rgba(255,255,255,.75)', fontSize: '.9rem', fontWeight: 600, cursor: 'pointer',
};

function Steps({ step }) {
  const idx = { intro: 0, pin: 1, confirm: 2 }[step] ?? 0;
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: '1.4rem' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: i === idx ? 26 : 8, height: 8, borderRadius: 4, background: i <= idx ? '#e50914' : 'rgba(255,255,255,.15)', transition: 'all .3s' }} />
      ))}
    </div>
  );
}

export default function KidsSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { active, hasPin, refresh, enable } = useKids();
  const [step, setStep] = useState('intro');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [planError, setPlanError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const justReset = location.state?.reset;

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (active) navigate('/kids', { replace: true }); }, [active, navigate]);

  const turnOn = async (pin) => {
    setBusy(true); setError(''); setPlanError(false);
    try {
      const r = await enable(pin);
      if (r.ok) { navigate('/kids', { replace: true }); return; }
      if (/plan/i.test(r.error || '')) setPlanError(true);
      setError(r.error || 'Could not turn on Kids Mode');
      setStep('intro');
    } catch {
      setError('No connection. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const onFirst = (pin) => {
    if (/^(\d)\1{3}$/.test(pin) || ['1234', '4321', '0123', '9876'].includes(pin)) {
      setError('That PIN is too easy to guess. Pick another.');
      setAttempt(a => a + 1);
      return;
    }
    setFirstPin(pin); setError(''); setStep('confirm');
  };

  const onConfirm = (pin) => {
    if (pin !== firstPin) {
      setError('PINs didn’t match. Let’s start again.');
      setFirstPin(''); setStep('pin'); setAttempt(a => a + 1);
      return;
    }
    turnOn(pin);
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '16px 20px 60px' }}>
      <button onClick={() => step === 'intro' ? navigate(-1) : (setStep(step === 'confirm' ? 'pin' : 'intro'), setError(''))}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '.88rem', padding: '6px 0', marginBottom: '1rem' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <Steps step={step} />

        {step === 'intro' && (
          <>
            <div style={{
              borderRadius: 22, padding: '26px 22px', marginBottom: 16, textAlign: 'center',
              background: 'radial-gradient(400px 200px at 0% 0%, #3b1d6e, transparent 70%), radial-gradient(400px 200px at 100% 100%, #0e4a6b, transparent 70%), #0b1026',
              border: '1px solid rgba(255,255,255,.08)',
            }}>
              <div style={{ fontSize: '2.6rem', marginBottom: 6 }}>🧸</div>
              <h1 style={{ ...H, fontSize: '2rem', margin: '0 0 .3rem' }}>Kids Mode</h1>
              <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.6, margin: 0 }}>
                A safe, locked space where your children can only watch shows made for them.
              </p>
            </div>

            {justReset && !error && (
              <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)', color: '#4ade80', borderRadius: 12, padding: '12px 14px', fontSize: '.82rem', marginBottom: 14 }}>
                Your PIN was reset and Kids Mode is off. Set a new PIN to turn it back on.
              </div>
            )}
            {error && (
              <div style={{ background: 'rgba(229,9,20,.08)', border: '1px solid rgba(229,9,20,.3)', color: '#ff8080', borderRadius: 12, padding: '12px 14px', fontSize: '.82rem', marginBottom: 14 }}>
                {error}
                {planError && (
                  <button onClick={() => navigate('/subscribe')} style={{ display: 'block', marginTop: 10, background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontWeight: 800, cursor: 'pointer', fontSize: '.78rem' }}>
                    See plans
                  </button>
                )}
              </div>
            )}

            <div style={{ ...card, padding: '6px 18px', marginBottom: 18 }}>
              {FEATURES.map((f, i) => (
                <div key={f.title} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                  <div style={{ fontSize: '1.4rem', width: 30, textAlign: 'center', flexShrink: 0 }}>{f.emoji}</div>
                  <div>
                    <div style={{ fontSize: '.9rem', fontWeight: 800, marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.5 }}>{f.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {hasPin ? (
              <>
                <button style={{ ...primaryBtn, opacity: busy ? .6 : 1 }} disabled={busy} onClick={() => turnOn()}>
                  {busy ? 'Turning on…' : 'Turn on Kids Mode'}
                </button>
                <button style={{ ...ghostBtn, marginTop: 10 }} onClick={() => { setError(''); setStep('pin'); }}>Change PIN</button>
                <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: 12 }}>Uses the PIN you already set.</p>
              </>
            ) : (
              <button style={primaryBtn} onClick={() => { setError(''); setStep('pin'); }}>Set up a PIN</button>
            )}
            <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: 12 }}>Kids Mode needs the Standard plan or above.</p>
          </>
        )}

        {(step === 'pin' || step === 'confirm') && (
          <div style={{ ...card, padding: '26px 18px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 6 }}>{step === 'pin' ? '🔐' : '✅'}</div>
            <h2 style={{ ...H, fontSize: '1.5rem', margin: '0 0 .3rem' }}>{step === 'pin' ? 'Create a parental PIN' : 'Confirm your PIN'}</h2>
            <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', margin: '0 0 1.5rem' }}>
              {step === 'pin' ? 'Pick 4 digits your kids won’t guess. You’ll need it to leave Kids Mode.' : 'Enter the same 4 digits again.'}
            </p>
            <PinPad key={step} onComplete={step === 'pin' ? onFirst : onConfirm} error={error} resetKey={attempt} disabled={busy} />
            <p style={{ minHeight: 20, color: '#ff8080', fontSize: '.8rem', margin: '1rem 0 0' }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
