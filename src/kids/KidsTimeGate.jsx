import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PinDialog } from '../components/PinPad';
import { kidsApi, KFONT } from './api';

// Full-screen "time to rest" screen shown when today's screen time is used up
// or it's bedtime. Only a grown-up (PIN) can add time or change the rules.
export default function KidsTimeGate({ reason, name, onExtended }) {
  const navigate = useNavigate();
  const [pin, setPin] = useState(false);
  const [unlocked, setUnlocked] = useState(null); // the verified PIN
  const [busy, setBusy] = useState(false);
  const bed = reason === 'bedtime';

  const addTime = async (mins) => {
    setBusy(true);
    try {
      const r = await kidsApi.saveProfile({ pin: unlocked, extra_mins: mins });
      if (r.ok) onExtended?.(r.time);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, fontFamily: KFONT, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, overflow: 'hidden',
      background: bed ? 'radial-gradient(800px 500px at 50% 0%, #1e1b4b, #070818 70%)' : 'radial-gradient(800px 500px at 50% 0%, #4c1d95, #0b1026 70%)' }}>
      <style>{`
        @keyframes kgFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes kgTwinkle{0%,100%{opacity:.2}50%{opacity:1}}
        @keyframes kgZ{0%{opacity:0;transform:translate(0,0) scale(.6)}30%{opacity:1}100%{opacity:0;transform:translate(26px,-60px) scale(1.2)}}
        @keyframes kgIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
      `}</style>
      {Array.from({ length: 22 }).map((_, i) => (
        <span key={i} style={{ position: 'absolute', left: `${(i * 37) % 100}%`, top: `${(i * 53) % 60}%`, width: i % 3 ? 3 : 4, height: i % 3 ? 3 : 4, borderRadius: '50%', background: '#fff', animation: `kgTwinkle ${1.4 + (i % 5) * .4}s ease-in-out ${i * .17}s infinite` }} />
      ))}

      <div style={{ position: 'relative', animation: 'kgFloat 3.2s ease-in-out infinite' }}>
        <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden>
          {bed ? (<>
            <circle cx="75" cy="75" r="52" fill="#fde68a" />
            <circle cx="98" cy="58" r="46" fill={bed ? '#151339' : '#2e1065'} />
            <path d="M52 86 q8 6 16 0" stroke="#92400e" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M42 70 q6 4 12 0" stroke="#92400e" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>) : (<>
            <circle cx="75" cy="78" r="50" fill="#facc15" />
            <path d="M52 72 q7 5 14 0 M84 72 q7 5 14 0" stroke="#78350f" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <ellipse cx="75" cy="98" rx="9" ry="7" fill="#78350f" />
            <circle cx="48" cy="90" r="6" fill="#fb923c" opacity=".6" /><circle cx="102" cy="90" r="6" fill="#fb923c" opacity=".6" />
          </>)}
        </svg>
        {['z', 'z', 'Z'].map((z, i) => (
          <span key={i} style={{ position: 'absolute', right: -6 - i * 10, top: 10 - i * 4, fontWeight: 900, fontSize: 18 + i * 6, color: '#c4b5fd', animation: `kgZ 2.4s ease-out ${i * .7}s infinite` }}>{z}</span>
        ))}
      </div>

      <div style={{ animation: 'kgIn .5s ease both', maxWidth: 360 }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 900, margin: '18px 0 6px' }}>
          {bed ? `Sweet dreams${name ? `, ${name}` : ''}!` : `Great watching${name ? `, ${name}` : ''}!`}
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.5, margin: 0 }}>
          {bed ? 'It’s bedtime. Your shows will be here tomorrow.' : 'That’s all the screen time for today. Time to play, read or rest!'}
        </p>
      </div>

      {!unlocked ? (
        <button onClick={() => setPin(true)} style={{ marginTop: 34, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 14, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', color: 'rgba(255,255,255,.75)', fontWeight: 800, fontFamily: KFONT, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Grown-ups
        </button>
      ) : (
        <div style={{ marginTop: 28, display: 'grid', gap: 10, width: '100%', maxWidth: 320 }}>
          {!bed && [15, 30].map(m => (
            <button key={m} disabled={busy} onClick={() => addTime(m)} style={{ padding: '13px', borderRadius: 14, border: 'none', background: '#facc15', color: '#1a1033', fontWeight: 900, fontSize: '1rem', fontFamily: KFONT, cursor: 'pointer', opacity: busy ? .6 : 1 }}>
              Give {m} more minutes
            </button>
          ))}
          <button onClick={() => navigate('/kids/parents', { state: { pin: unlocked } })} style={{ padding: '13px', borderRadius: 14, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', fontWeight: 800, fontFamily: KFONT, cursor: 'pointer' }}>
            Parent settings
          </button>
        </div>
      )}

      {pin && (
        <PinDialog title="Grown-ups only" subtitle="Enter your parental PIN"
          onSubmit={async (p) => { const r = await kidsApi.verifyPin(p); if (r.ok) { setUnlocked(p); setPin(false); } return r; }}
          onCancel={() => setPin(false)} />
      )}
    </div>
  );
}
