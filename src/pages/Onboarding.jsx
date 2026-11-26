import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RED, heading, Button } from '../components/ui';

export const ONBOARDED_KEY = 'sm_onboarded';
export const isOnboarded = () => { try { return localStorage.getItem(ONBOARDED_KEY) === '1'; } catch { return true; } };

const slides = [
  { icon: '🎬', title: 'African stories, anytime', text: 'Nollywood hits, series, documentaries and originals — stream them all in one place.' },
  { icon: '📡', title: 'Live TV & sports', text: 'Catch live channels and matches as they happen, in HD or data-saver mode.' },
  { icon: '⚡', title: 'Shorts & more', text: 'Swipe through quick clips, save titles to your list, and pick up right where you stopped.' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const finish = (to) => { try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch { /* ignore */ } navigate(to, { replace: true }); };
  const s = slides[i];
  const last = i === slides.length - 1;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 30%, rgba(229,9,20,.18), #000 60%)', color: '#fff', display: 'flex', flexDirection: 'column', padding: '0 24px calc(28px + env(safe-area-inset-bottom, 0px))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 0' }}>
        <span style={{ ...heading, fontSize: '1.4rem', color: RED, letterSpacing: '.04em' }}>SHOWMINE</span>
        {!last && <button onClick={() => finish('/login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', fontSize: '.85rem', cursor: 'pointer' }}>Skip</button>}
      </div>

      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', animation: 'smfade .35s ease' }}>
        <div style={{ fontSize: '4.5rem', marginBottom: 24 }} aria-hidden>{s.icon}</div>
        <h1 style={{ ...heading, fontSize: '2rem', margin: '0 0 12px' }}>{s.title}</h1>
        <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 340, margin: 0 }}>{s.text}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 26 }}>
        {slides.map((_, k) => (
          <span key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 4, background: k === i ? RED : 'rgba(255,255,255,.2)', transition: 'all .2s' }} />
        ))}
      </div>

      {last ? (
        <>
          <Button onClick={() => finish('/register')}>Create free account</Button>
          <Button variant="ghost" style={{ marginTop: 10 }} onClick={() => finish('/login')}>I already have an account</Button>
        </>
      ) : (
        <Button onClick={() => setI(i + 1)}>Next</Button>
      )}
      <style>{'@keyframes smfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'}</style>
    </div>
  );
}
