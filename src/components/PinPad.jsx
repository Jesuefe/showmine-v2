import { useState, useEffect, useRef } from 'react';
import { useKids } from '../context/KidsContext';

// Local wrong-PIN tracking (the server enforces its own limit too: 5 tries / 5 min).
const FAIL_KEY = 'sm_kids_pin_fails';
const MAX_FAILS = 5;
const LOCK_SECS = 300;

function readFails() {
  try { return JSON.parse(localStorage.getItem(FAIL_KEY)) || { n: 0, until: 0 }; } catch { return { n: 0, until: 0 }; }
}
function writeFails(v) { try { localStorage.setItem(FAIL_KEY, JSON.stringify(v)); } catch { /* ignore */ } }

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinPad({ onComplete, error, disabled, accent = '#e50914', resetKey }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setPin('');
    if (error) { setShake(true); const t = setTimeout(() => setShake(false), 450); return () => clearTimeout(t); }
  }, [error, resetKey]);

  const press = (k) => {
    if (disabled || !k) return;
    if (navigator.vibrate) navigator.vibrate(8);
    if (k === 'del') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) setTimeout(() => onComplete(next), 120);
  };

  return (
    <div style={{ opacity: disabled ? 0.45 : 1, transition: 'opacity .2s' }}>
      <div className={shake ? 'sm-shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: '0 0 1.6rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: '50%',
            border: `2px solid ${error ? '#ff6b6b' : i < pin.length ? accent : 'rgba(255,255,255,.25)'}`,
            background: i < pin.length ? accent : 'transparent',
            transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
            transition: 'all .15s',
          }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 280, margin: '0 auto' }}>
        {KEYS.map((k, i) => (
          <button key={i} onClick={() => press(k)} disabled={!k || disabled} aria-label={k === 'del' ? 'Delete' : k}
            className={k ? 'sm-key' : ''}
            style={{
              height: 58, borderRadius: 16,
              background: k === 'del' || !k ? 'transparent' : 'rgba(255,255,255,.07)',
              border: k && k !== 'del' ? '1px solid rgba(255,255,255,.08)' : 'none',
              color: '#fff', fontSize: '1.45rem', fontWeight: 600,
              cursor: k && !disabled ? 'pointer' : 'default', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {k === 'del'
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
              : k}
          </button>
        ))}
      </div>
      <style>{`
        @keyframes smShake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-8px)} 40%,60%{transform:translateX(8px)} }
        .sm-shake { animation: smShake .45s both; }
        .sm-key:active { transform: scale(.94); background: rgba(255,255,255,.14) !important; }
      `}</style>
    </div>
  );
}

function Sheet({ children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'linear-gradient(180deg,#16161c,#0d0d11)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 24, padding: '1.8rem 1.4rem 1.4rem', width: '100%', maxWidth: 360, textAlign: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,.6)',
      }}>{children}</div>
    </div>
  );
}

function LockIcon({ color = '#e50914' }) {
  return (
    <div style={{ width: 56, height: 56, borderRadius: 18, background: `${color}1f`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
    </div>
  );
}

// PIN prompt with wrong-attempt lockout. onSubmit(pin) must resolve to { ok, error, locked }.
export function PinDialog({ title, subtitle, onSubmit, onCancel, onForgot }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(readFails);
  const [now, setNow] = useState(Date.now());
  const [attempt, setAttempt] = useState(0);
  const lockedFor = Math.max(0, Math.ceil((fails.until - now) / 1000));

  useEffect(() => {
    if (!lockedFor) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockedFor]);

  const submit = async (pin) => {
    setBusy(true); setError('');
    try {
      const r = await onSubmit(pin);
      if (r?.ok) { writeFails({ n: 0, until: 0 }); return; }
      const n = fails.n + 1;
      const next = r?.locked || n >= MAX_FAILS ? { n: 0, until: Date.now() + LOCK_SECS * 1000 } : { n, until: 0 };
      writeFails(next); setFails(next); setNow(Date.now());
      const left = MAX_FAILS - n;
      setError(next.until ? 'Too many wrong tries' : `${r?.error || 'Incorrect PIN'} · ${left} ${left === 1 ? 'try' : 'tries'} left`);
    } catch {
      setError('No connection. Try again.');
    } finally {
      setBusy(false); setAttempt(a => a + 1);
    }
  };

  const mm = String(Math.floor(lockedFor / 60)), ss = String(lockedFor % 60).padStart(2, '0');

  return (
    <Sheet onClose={onCancel}>
      <LockIcon />
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', fontWeight: 800, margin: '0 0 .3rem' }}>{title}</h2>
      <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.45)', margin: '0 0 1.4rem' }}>
        {lockedFor ? `Locked. Try again in ${mm}:${ss}` : subtitle}
      </p>
      <PinPad onComplete={submit} disabled={busy || lockedFor > 0} error={error} resetKey={attempt} />
      <p style={{ minHeight: 20, color: '#ff6b6b', fontSize: '.78rem', margin: '1rem 0 .4rem' }}>{!lockedFor && error}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        {onCancel && <button onClick={onCancel} style={linkBtn}>Cancel</button>}
        {onForgot && <button onClick={onForgot} style={{ ...linkBtn, color: '#e50914' }}>Forgot PIN?</button>}
      </div>
    </Sheet>
  );
}

const linkBtn = { background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', padding: '8px 6px' };
const input = {
  width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: 12, textAlign: 'center',
  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontSize: '1rem', outline: 'none',
};
const primary = {
  width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#e50914', color: '#fff',
  fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', cursor: 'pointer',
};

// Reset a forgotten PIN with the account password, or an emailed code (Google sign-in accounts).
// On success Kids Mode is switched off and the PIN cleared.
export function ForgotPinDialog({ onClose, onDone }) {
  const { hasPassword, requestResetCode, resetPin } = useKids();
  const [mode, setMode] = useState(hasPassword ? 'password' : 'code');
  const [value, setValue] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, [mode, codeSent]);

  const sendCode = async () => {
    setBusy(true); setError('');
    try {
      const r = await requestResetCode();
      if (r.ok) setCodeSent(true); else setError(r.error || 'Could not send code');
    } catch { setError('No connection. Try again.'); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    if (!value) return;
    setBusy(true); setError('');
    try {
      const r = await resetPin(mode === 'password' ? { password: value } : { code: value });
      if (r.ok) { try { localStorage.removeItem(FAIL_KEY); } catch { /* ignore */ } onDone?.(); }
      else setError(r.error || 'That didn’t work');
    } catch { setError('No connection. Try again.'); }
    finally { setBusy(false); }
  };

  return (
    <Sheet onClose={onClose}>
      <LockIcon color="#f59e0b" />
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', fontWeight: 800, margin: '0 0 .3rem' }}>Reset Kids PIN</h2>
      <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.45)', margin: '0 0 1.2rem', lineHeight: 1.5 }}>
        {mode === 'password'
          ? 'Enter your Showmine account password. Kids Mode will turn off so you can set a new PIN.'
          : codeSent ? 'We emailed a 6-digit code to the account owner. Enter it below.'
            : 'We’ll email a reset code to the account owner’s address.'}
      </p>

      {mode === 'code' && !codeSent ? (
        <button onClick={sendCode} disabled={busy} style={{ ...primary, opacity: busy ? .6 : 1 }}>{busy ? 'Sending…' : 'Email me a code'}</button>
      ) : (
        <>
          <input ref={inputRef} style={input} value={value} onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            type={mode === 'password' ? 'password' : 'text'} inputMode={mode === 'code' ? 'numeric' : undefined}
            maxLength={mode === 'code' ? 6 : 200} autoComplete={mode === 'password' ? 'current-password' : 'one-time-code'}
            placeholder={mode === 'password' ? 'Account password' : '6-digit code'} />
          <button onClick={submit} disabled={busy || !value} style={{ ...primary, marginTop: 12, opacity: busy || !value ? .6 : 1 }}>
            {busy ? 'Checking…' : 'Reset PIN'}
          </button>
        </>
      )}

      <p style={{ minHeight: 20, color: '#ff6b6b', fontSize: '.78rem', margin: '.8rem 0 .2rem' }}>{error}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={linkBtn}>Cancel</button>
        {hasPassword && (
          <button onClick={() => { setMode(m => m === 'password' ? 'code' : 'password'); setValue(''); setError(''); }} style={linkBtn}>
            {mode === 'password' ? 'Use email code' : 'Use password'}
          </button>
        )}
      </div>
    </Sheet>
  );
}
