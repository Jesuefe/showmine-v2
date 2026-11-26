import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { isNativeApp } from '../utils/platform';
import { useLocation, useNavigate } from 'react-router-dom';
import { support as supportApi } from '../api/extras';
import { getDeviceInfo } from '../services/device';
import { useAuth } from './AuthContext';
import { useKids } from './KidsContext';

export const SHAKE_KEY = 'sm_shake_support';
export const shakeEnabled = () => { try { return localStorage.getItem(SHAKE_KEY) !== '0'; } catch { return true; } };

const CATEGORIES = [
  { id: 'technical', label: 'Playback / app', emoji: '🛠️' },
  { id: 'billing', label: 'Payment', emoji: '💳' },
  { id: 'account', label: 'Account', emoji: '👤' },
  { id: 'content', label: 'Content request', emoji: '🎬' },
  { id: 'other', label: 'Something else', emoji: '💬' },
];

const SupportContext = createContext({ openSupport: () => {} });
export const useSupport = () => useContext(SupportContext);

function SupportSheet({ onClose, fromShake }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { active: kidsMode } = useKids();
  const [category, setCategory] = useState('technical');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null);
  const ref = useRef(null);

  useEffect(() => { const t = setTimeout(() => ref.current?.focus(), 250); return () => clearTimeout(t); }, []);

  const send = async () => {
    if (message.trim().length < 5) { setError('Tell us a little more so we can help.'); return; }
    setBusy(true); setError('');
    try {
      const d = await getDeviceInfo();
      const r = await supportApi.create({
        category, message: message.trim(),
        context: {
          app_version: d.app_version, platform: d.platform, device: [d.manufacturer, d.model].filter(Boolean).join(' '),
          os_version: d.os_version, screen: location.pathname, network: navigator.connection?.effectiveType || (navigator.onLine ? 'online' : 'offline'),
          kids_mode: !!kidsMode,
        },
      });
      if (r.ok) setSent(r.ticket); else setError(r.error || 'Could not send. Try again.');
    } catch { setError('No connection. Try again when you’re online.'); }
    setBusy(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="sup-up" style={{
        width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', background: 'linear-gradient(180deg,#17171c,#0e0e12)',
        borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,.08)', padding: '14px 20px calc(env(safe-area-inset-bottom) + 20px)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 16px' }} />
        {sent ? (
          <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
            <div className="sup-pop" style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,.15)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800 }}>We’ve got it!</div>
            <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', margin: '6px 0 4px' }}>Ticket <b style={{ color: '#fff' }}>{sent.code}</b> is with our team.</div>
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.45)', marginBottom: 18 }}>You’ll get a notification when we reply.</div>
            <button onClick={() => { onClose(); navigate(`/support/${sent.id}`); }} style={btnPrimary}>View ticket</button>
            <button onClick={onClose} style={{ ...btnGhost, marginTop: 10 }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(229,9,20,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{fromShake ? '📳' : '💬'}</div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.1 }}>{fromShake ? 'Need a hand?' : 'Help & support'}</div>
                <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)' }}>{fromShake ? 'You shook your phone. Tell us what went wrong.' : 'Our team reads every message.'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0 14px' }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} style={{
                  padding: '8px 12px', borderRadius: 999, fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
                  background: category === c.id ? '#e50914' : 'rgba(255,255,255,.06)', color: '#fff',
                  border: `1px solid ${category === c.id ? '#e50914' : 'rgba(255,255,255,.1)'}`,
                }}>{c.emoji} {c.label}</button>
              ))}
            </div>
            <textarea ref={ref} value={message} onChange={e => setMessage(e.target.value)} maxLength={4000} rows={5}
              placeholder={category === 'billing' ? 'What happened with your payment? Include the amount and date if you can.' : category === 'content' ? 'Which movie or show would you like to see on Showmine?' : 'Describe the problem. What were you doing when it happened?'}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, color: '#fff', padding: 14, fontSize: '.92rem', fontFamily: 'inherit', resize: 'none', outline: 'none' }} />
            <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.35)', margin: '6px 2px 12px' }}>We attach your app version and phone model to help us fix it faster.</div>
            {error && <div style={{ color: '#ff8080', fontSize: '.8rem', marginBottom: 10 }}>{error}</div>}
            <button onClick={send} disabled={busy} style={{ ...btnPrimary, opacity: busy ? .6 : 1 }}>{busy ? 'Sending…' : 'Send to support'}</button>
            <button onClick={() => { onClose(); navigate('/support'); }} style={{ ...btnGhost, marginTop: 10 }}>My tickets</button>
          </>
        )}
      </div>
      <style>{`
        @keyframes supUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .sup-up{animation:supUp .28s cubic-bezier(.2,.8,.2,1)}
        @keyframes supPop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        .sup-pop{animation:supPop .4s ease}
      `}</style>
    </div>
  );
}

const btnPrimary = { width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e50914', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.05rem', fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', cursor: 'pointer' };
const btnGhost = { width: '100%', padding: 13, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: 'rgba(255,255,255,.8)', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' };

// Shake detection: three sharp jolts within ~0.9 s opens support.
function useShake(onShake, enabled) {
  const cb = useRef(onShake);
  useEffect(() => { cb.current = onShake; }, [onShake]);
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;
    let last = null, jolts = [], cooldown = 0;
    const handler = (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null) return;
      if (last) {
        const delta = Math.abs(a.x - last.x) + Math.abs(a.y - last.y) + Math.abs(a.z - last.z);
        const now = Date.now();
        if (delta > 28 && now > cooldown) {
          jolts = jolts.filter(t => now - t < 900); jolts.push(now);
          if (jolts.length >= 3) { jolts = []; cooldown = now + 4000; navigator.vibrate?.(40); cb.current(); }
        }
      }
      last = { x: a.x, y: a.y, z: a.z };
    };
    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [enabled]);
}

export function SupportProvider({ children }) {
  const { user } = useAuth();
  const { active: kidsMode } = useKids();
  const [open, setOpen] = useState(null); // null | 'manual' | 'shake'
  const [shakeOn, setShakeOn] = useState(shakeEnabled);

  const openSupport = useCallback((src = 'manual') => setOpen(src), []);
  const setShake = useCallback((v) => { try { localStorage.setItem(SHAKE_KEY, v ? '1' : '0'); } catch { /* ignore */ } setShakeOn(v); }, []);

  useShake(() => setOpen(o => o || 'shake'), isNativeApp() && !!user && !kidsMode && shakeOn);

  return (
    <SupportContext.Provider value={{ openSupport, shakeOn, setShake }}>
      {children}
      {open && user && <SupportSheet fromShake={open === 'shake'} onClose={() => setOpen(null)} />}
    </SupportContext.Provider>
  );
}
