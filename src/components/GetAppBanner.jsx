import { useState } from 'react';
import { isNativeApp, PLAY_STORE_URL } from '../utils/platform';

const KEY = 'sm_getapp_dismissed';
const WEEK = 7 * 24 * 3600 * 1000;

// Shown only in mobile browsers on v2.showmine.ng, never inside the app.
export default function GetAppBanner({ bottom = 64 }) {
  const [hidden, setHidden] = useState(() => {
    if (isNativeApp()) return true;
    if (!/Android|iPhone|iPad/i.test(navigator.userAgent)) return true;
    try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < WEEK; } catch { return false; }
  });
  if (hidden) return null;
  const android = /Android/i.test(navigator.userAgent);
  const close = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ } setHidden(true); };
  return (
    <div style={{ position: 'fixed', left: 10, right: 10, bottom: bottom + 10, zIndex: 60, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'linear-gradient(90deg,#1a0a0b,#121214)', border: '1px solid rgba(229,9,20,.35)', boxShadow: '0 10px 30px rgba(0,0,0,.6)' }}>
      <img src="https://showmine24.b-cdn.net/1024.png" alt="" width="38" height="38" style={{ borderRadius: 10 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '.85rem' }}>Showmine TV app</div>
        <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.55)' }}>{android ? 'Smoother playback, Kids mode & offline-ready' : 'Coming soon to iPhone — keep watching here'}</div>
      </div>
      {android && <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ background: '#e50914', color: '#fff', fontWeight: 800, fontSize: '.78rem', padding: '8px 14px', borderRadius: 999, textDecoration: 'none' }}>Get app</a>}
      <button onClick={close} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: '1.1rem', cursor: 'pointer', padding: 4 }}>✕</button>
    </div>
  );
}
