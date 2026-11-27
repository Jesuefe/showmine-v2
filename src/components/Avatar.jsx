import { useId, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { successHaptic, selectHaptic } from '../utils/feel';

// Generated profile pictures. Every account gets one automatically (picked from
// its id/name), and people can choose another in Profile. Saved on the server as
// avatar_url = "sm:<style>"; real image URLs still work.

const hash = (s) => {
  let h = 2166136261;
  for (const c of String(s || 'viewer')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

// Each style: name, two gradient stops for the background, and an SVG body (100x100).
export const AVATARS = [
  {
    id: 'gele-queen', label: 'Gele Queen', bg: ['#ff7a18', '#af002d'],
    art: (g) => (<>
      <path d="M22 44 C18 20 50 8 72 18 C88 26 84 44 78 46 C70 30 40 28 22 44Z" fill={`url(#${g}b)`} />
      <path d="M30 40 C40 26 66 24 78 40" stroke="#ffe08a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="58" rx="19" ry="22" fill="#6b3a1e" />
      <path d="M38 56 q4 -3 8 0 M54 56 q4 -3 8 0" stroke="#1a0d05" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M43 68 q7 6 14 0" stroke="#ff4d6d" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="31" cy="64" r="3" fill="#ffd166" /><circle cx="69" cy="64" r="3" fill="#ffd166" />
      <path d="M26 100 C28 82 72 82 74 100Z" fill="#ffd166" />
    </>),
    defs: (g) => <linearGradient id={`${g}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd166" /><stop offset="1" stopColor="#06d6a0" /></linearGradient>,
  },
  {
    id: 'afro-wave', label: 'Afro Wave', bg: ['#7f5af0', '#2cb67d'],
    art: () => (<>
      <circle cx="50" cy="40" r="30" fill="#1b1033" />
      <circle cx="30" cy="30" r="12" fill="#1b1033" /><circle cx="70" cy="30" r="12" fill="#1b1033" />
      <ellipse cx="50" cy="56" rx="17" ry="20" fill="#8d5524" />
      <rect x="35" y="50" width="30" height="8" rx="4" fill="#111" />
      <rect x="37" y="51" width="11" height="6" rx="3" fill="#2cb67d" opacity=".9" /><rect x="52" y="51" width="11" height="6" rx="3" fill="#2cb67d" opacity=".9" />
      <path d="M44 66 q6 4 12 0" stroke="#3b1d0a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M24 100 C26 80 74 80 76 100Z" fill="#fffffe" opacity=".92" />
    </>),
  },
  {
    id: 'mask', label: 'Spirit Mask', bg: ['#0f2027', '#2c5364'],
    art: () => (<>
      <path d="M50 12 C76 12 80 40 74 62 C70 80 60 90 50 92 C40 90 30 80 26 62 C20 40 24 12 50 12Z" fill="#e9c46a" />
      <path d="M50 12 V92" stroke="#264653" strokeWidth="2" />
      <path d="M32 46 l12 -4 l2 8 l-12 2Z M68 46 l-12 -4 l-2 8 l12 2Z" fill="#264653" />
      <path d="M30 30 h40 M34 36 h32" stroke="#e76f51" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 72 h12 l-6 8Z" fill="#e76f51" />
      <circle cx="30" cy="62" r="2.5" fill="#e76f51" /><circle cx="70" cy="62" r="2.5" fill="#e76f51" />
      <path d="M38 58 l-4 6 M62 58 l4 6" stroke="#264653" strokeWidth="2" />
    </>),
  },
  {
    id: 'kente', label: 'Kente', bg: ['#1d1d1d', '#000'],
    art: () => (<>
      {[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => (
        <rect key={`${r}${c}`} x={c * 20} y={r * 20} width="20" height="20"
          fill={['#f4a100', '#0a8f3c', '#d00000', '#f4a100', '#111'][(r + c) % 5]} />
      )))}
      {[10, 30, 50, 70, 90].map(y => <rect key={y} x="0" y={y - 2} width="100" height="4" fill="#111" opacity=".55" />)}
      {[10, 30, 50, 70, 90].map(x => <rect key={`v${x}`} x={x - 1.5} y="0" width="3" height="100" fill="#fff" opacity=".35" />)}
      <circle cx="50" cy="50" r="22" fill="#111" stroke="#f4a100" strokeWidth="3" />
      <path d="M50 36 l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1Z" fill="#f4a100" />
    </>),
  },
  {
    id: 'astro', label: 'Astronaut', bg: ['#141e30', '#243b55'],
    art: () => (<>
      {[[14, 18], [84, 14], [78, 40], [18, 72], [88, 80], [30, 10]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1.2 : 1.8} fill="#fff" opacity=".8" />)}
      <circle cx="50" cy="48" r="28" fill="#eef2f7" />
      <rect x="30" y="36" width="40" height="26" rx="13" fill="#1f2a44" />
      <path d="M36 44 q8 -6 18 -2" stroke="#7dd3fc" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
      <circle cx="78" cy="48" r="4" fill="#e50914" />
      <path d="M22 100 C24 78 76 78 78 100Z" fill="#eef2f7" />
      <rect x="42" y="84" width="16" height="10" rx="2" fill="#e50914" />
    </>),
  },
  {
    id: 'bot', label: 'Robo', bg: ['#00c6ff', '#0072ff'],
    art: () => (<>
      <line x1="50" y1="14" x2="50" y2="24" stroke="#fff" strokeWidth="3" /><circle cx="50" cy="12" r="4" fill="#ffd166" />
      <rect x="24" y="24" width="52" height="44" rx="14" fill="#f1f5f9" />
      <rect x="31" y="34" width="38" height="20" rx="10" fill="#0b1220" />
      <circle cx="41" cy="44" r="5" fill="#22d3ee" /><circle cx="59" cy="44" r="5" fill="#22d3ee" />
      <rect x="42" y="58" width="16" height="4" rx="2" fill="#94a3b8" />
      <rect x="18" y="40" width="6" height="14" rx="3" fill="#cbd5e1" /><rect x="76" y="40" width="6" height="14" rx="3" fill="#cbd5e1" />
      <path d="M28 100 V80 q0 -8 8 -8 h28 q8 0 8 8 V100Z" fill="#f1f5f9" />
      <circle cx="50" cy="86" r="5" fill="#e50914" />
    </>),
  },
  {
    id: 'lion', label: 'Lion', bg: ['#f7971e', '#ffd200'],
    art: () => (<>
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return <circle key={i} cx={50 + Math.cos(a) * 28} cy={52 + Math.sin(a) * 28} r="11" fill={i % 2 ? '#a0522d' : '#8b3a0f'} />;
      })}
      <circle cx="50" cy="52" r="24" fill="#f4b860" />
      <circle cx="41" cy="48" r="3" fill="#2b1a0a" /><circle cx="59" cy="48" r="3" fill="#2b1a0a" />
      <path d="M45 58 h10 l-5 6Z" fill="#5b2c0f" />
      <path d="M50 64 q-5 6 -10 3 M50 64 q5 6 10 3" stroke="#5b2c0f" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>),
  },
  {
    id: 'fox', label: 'Fox', bg: ['#ee0979', '#ff6a00'],
    art: () => (<>
      <path d="M22 22 L40 40 L30 50Z M78 22 L60 40 L70 50Z" fill="#ff7b00" />
      <path d="M26 28 L36 40 L31 44Z M74 28 L64 40 L69 44Z" fill="#2b0f05" />
      <path d="M50 84 L24 50 Q24 34 50 34 Q76 34 76 50Z" fill="#ff7b00" />
      <path d="M50 84 L34 58 Q50 66 66 58Z" fill="#fff4e6" />
      <circle cx="40" cy="52" r="3.4" fill="#1a0a04" /><circle cx="60" cy="52" r="3.4" fill="#1a0a04" />
      <circle cx="50" cy="80" r="4" fill="#1a0a04" />
    </>),
  },
  {
    id: 'cat', label: 'Night Cat', bg: ['#232526', '#414345'],
    art: () => (<>
      <circle cx="76" cy="22" r="10" fill="#fde68a" /><circle cx="80" cy="19" r="9" fill="#2f3132" />
      <path d="M26 30 L36 46 L24 52Z M74 30 L64 46 L76 52Z" fill="#111" />
      <ellipse cx="50" cy="62" rx="28" ry="24" fill="#111" />
      <ellipse cx="39" cy="58" rx="6" ry="7" fill="#a3e635" /><ellipse cx="61" cy="58" rx="6" ry="7" fill="#a3e635" />
      <ellipse cx="39" cy="58" rx="1.8" ry="5.5" fill="#111" /><ellipse cx="61" cy="58" rx="1.8" ry="5.5" fill="#111" />
      <path d="M47 68 h6 l-3 3Z" fill="#f472b6" />
      <path d="M30 70 h-12 M30 74 h-11 M70 70 h12 M70 74 h11" stroke="#555" strokeWidth="1.4" />
    </>),
  },
  {
    id: 'director', label: 'Director', bg: ['#e50914', '#3b0306'],
    art: () => (<>
      <ellipse cx="50" cy="26" rx="26" ry="8" fill="#111" /><path d="M30 26 Q30 8 50 8 Q70 8 70 26Z" fill="#111" />
      <ellipse cx="50" cy="52" rx="18" ry="21" fill="#c68642" />
      <rect x="32" y="44" width="36" height="10" rx="5" fill="#111" />
      <path d="M40 64 q10 6 20 0" stroke="#4a2511" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M26 100 C28 80 72 80 74 100Z" fill="#111" />
      <g transform="translate(60 74) rotate(-12)">
        <rect width="30" height="18" rx="2" fill="#f5f5f5" />
        <rect y="-7" width="30" height="7" fill="#111" />
        {[0, 8, 16, 24].map(x => <path key={x} d={`M${x} -7 l5 0 l-3 7 l-5 0Z`} fill="#f5f5f5" />)}
      </g>
    </>),
  },
  {
    id: 'nebula', label: 'Nebula', bg: ['#41295a', '#2f0743'],
    art: (g) => (<>
      <circle cx="30" cy="30" r="30" fill={`url(#${g}n)`} opacity=".7" />
      <circle cx="74" cy="70" r="26" fill={`url(#${g}n)`} opacity=".5" />
      <circle cx="52" cy="50" r="18" fill="#ff9a8b" />
      <ellipse cx="52" cy="50" rx="34" ry="8" fill="none" stroke="#ffe29f" strokeWidth="3" transform="rotate(-18 52 50)" />
      <path d="M36 44 q16 -10 32 6" stroke="#ff6a88" strokeWidth="3" fill="none" opacity=".7" />
      {[[14, 80], [86, 18], [70, 30], [20, 56], [90, 50]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.5" fill="#fff" />)}
    </>),
    defs: (g) => <radialGradient id={`${g}n`}><stop offset="0" stopColor="#ff6ec4" /><stop offset="1" stopColor="#ff6ec4" stopOpacity="0" /></radialGradient>,
  },
  {
    id: 'sunset', label: 'Lagos Sunset', bg: ['#ff5f6d', '#ffc371'],
    art: () => (<>
      <circle cx="50" cy="58" r="26" fill="#fff3b0" />
      {[50, 58, 66].map((y, i) => <rect key={y} x="20" y={y} width="60" height={3 - i * .6} fill="#ff5f6d" />)}
      <path d="M0 72 L14 60 L22 66 L34 50 L44 62 L56 46 L66 60 L78 54 L100 70 V100 H0Z" fill="#3a0ca3" />
      <path d="M0 84 Q25 78 50 84 T100 84 V100 H0Z" fill="#240046" />
      <path d="M62 30 q4 -4 8 0 q4 -4 8 0" stroke="#3a0ca3" strokeWidth="2" fill="none" />
    </>),
  },
  {
    id: 'ghost', label: 'Boo', bg: ['#8e2de2', '#4a00e0'],
    art: () => (<>
      <path d="M26 86 V46 Q26 18 50 18 Q74 18 74 46 V86 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6Z" fill="#fafafa" />
      <ellipse cx="41" cy="46" rx="5" ry="7" fill="#1e1b4b" /><ellipse cx="59" cy="46" rx="5" ry="7" fill="#1e1b4b" />
      <ellipse cx="50" cy="62" rx="5" ry="6" fill="#1e1b4b" />
      <circle cx="34" cy="56" r="4" fill="#f9a8d4" opacity=".7" /><circle cx="66" cy="56" r="4" fill="#f9a8d4" opacity=".7" />
    </>),
  },
  {
    id: 'popcorn', label: 'Popcorn', bg: ['#11998e', '#38ef7d'],
    art: () => (<>
      {[[34, 30], [46, 22], [58, 26], [68, 34], [40, 38], [54, 36], [30, 40], [70, 42]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill="#fff8e1" stroke="#f6d365" strokeWidth="1.5" />)}
      <path d="M26 44 h48 l-6 46 h-36Z" fill="#fff" />
      {[30, 42, 54, 66].map(x => <path key={x} d={`M${x} 44 h6 l-1.8 46 h-6Z`} fill="#e50914" />)}
      <circle cx="42" cy="64" r="3" fill="#111" /><circle cx="58" cy="64" r="3" fill="#111" />
      <path d="M44 74 q6 5 12 0" stroke="#111" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>),
  },
  {
    id: 'aurora', label: 'Aurora', bg: ['#0f0c29', '#302b63'],
    art: () => (<>
      <path d="M0 40 Q25 20 50 36 T100 30 V58 Q75 44 50 58 T0 54Z" fill="#00f5a0" opacity=".55" />
      <path d="M0 56 Q30 40 55 56 T100 50 V72 Q70 62 48 74 T0 70Z" fill="#00d9f5" opacity=".45" />
      <path d="M0 26 Q30 8 60 22 T100 16 V34 Q70 24 50 34 T0 38Z" fill="#c471ed" opacity=".45" />
      <path d="M0 86 L20 74 L36 82 L54 70 L72 82 L100 72 V100 H0Z" fill="#0b0a1f" />
    </>),
  },
  {
    id: 'drum', label: 'Talking Drum', bg: ['#b24592', '#f15f79'],
    art: () => (<>
      <path d="M30 22 Q50 14 70 22 L62 50 L70 78 Q50 86 30 78 L38 50Z" fill="#8b4513" />
      <ellipse cx="50" cy="22" rx="20" ry="6" fill="#f5deb3" /><ellipse cx="50" cy="78" rx="20" ry="6" fill="#d2b48c" />
      {[-16, -8, 0, 8, 16].map(x => <path key={x} d={`M${50 + x} 24 L${50 + x * .6} 50 L${50 + x} 76`} stroke="#f5deb3" strokeWidth="1.4" fill="none" />)}
      <path d="M70 18 q14 -8 18 6" stroke="#3b1d0a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M14 40 q-6 10 0 20 M86 40 q6 10 0 20" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".7" />
    </>),
  },
];

const BY_ID = Object.fromEntries(AVATARS.map(a => [a.id, a]));

export function avatarStyleFor(user) {
  const v = user?.avatar || '';
  if (v.startsWith('sm:') && BY_ID[v.slice(3)]) return v.slice(3);
  return AVATARS[hash(user?.full_name || user?.username || user?.name || user?.email || user?.id) % AVATARS.length].id;
}

export function AvatarArt({ style, size = 40, radius = '50%', ring, styleProp }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '');
  const a = BY_ID[style] || AVATARS[0];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={a.label}
      style={{ borderRadius: radius, flexShrink: 0, display: 'block', boxShadow: ring ? `0 0 0 2px ${ring}` : undefined, ...styleProp }}>
      <defs>
        <linearGradient id={`${raw}bg`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a.bg[0]} /><stop offset="1" stopColor={a.bg[1]} /></linearGradient>
        <clipPath id={`${raw}c`}><rect width="100" height="100" /></clipPath>
        {a.defs && a.defs(raw)}
      </defs>
      <g clipPath={`url(#${raw}c)`}>
        <rect width="100" height="100" fill={`url(#${raw}bg)`} />
        {a.art(raw)}
      </g>
    </svg>
  );
}

// Use anywhere a person is shown. Accepts a user object ({id, avatar, full_name…}).
export default function Avatar({ user, size = 40, radius = '50%', ring, style }) {
  const url = user?.avatar || '';
  if (/^https?:\/\//.test(url)) {
    return <img src={url} alt="" referrerPolicy="no-referrer" style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, ...style }} />;
  }
  return <AvatarArt style={avatarStyleFor(user)} size={size} radius={radius} ring={ring} styleProp={style} />;
}

// Bottom sheet to choose a generated avatar. Saves to the server and updates the signed-in user.
export function AvatarPicker({ onClose }) {
  const { user, setUser } = useAuth();
  const current = avatarStyleFor(user);
  const [sel, setSel] = useState(current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (sel === current && (user?.avatar || '').startsWith('sm:')) { onClose(); return; }
    setBusy(true); setErr('');
    try {
      const r = await client.post('/account.php?action=avatar', { style: sel });
      if (!r.data?.ok) throw new Error(r.data?.error || 'Could not save');
      const u = { ...user, avatar: r.data.avatar };
      setUser(u);
      successHaptic();
      try { localStorage.setItem('showmine_user', JSON.stringify(u)); } catch { /* storage off */ }
      onClose();
    } catch (e) { setErr(e.message || 'Could not save. Try again.'); }
    setBusy(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <style>{`@keyframes avUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}`}</style>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', background: '#0d0d10', borderTop: '1px solid rgba(255,255,255,.08)', borderRadius: '22px 22px 0 0', padding: '14px 18px calc(18px + env(safe-area-inset-bottom))', animation: 'avUp .25s ease both', color: '#fff' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <AvatarArt style={sel} size={64} radius={18} />
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 900 }}>Pick your look</div>
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>{(AVATARS.find(a => a.id === sel) || AVATARS[0]).label}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {AVATARS.map(a => (
            <button key={a.id} onClick={() => { setSel(a.id); selectHaptic(); }} data-nohaptic aria-label={a.label} aria-pressed={sel === a.id} style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 18, transform: sel === a.id ? 'scale(1.04)' : 'none', transition: 'transform .15s' }}>
              <AvatarArt style={a.id} size="100%" radius={16} ring={sel === a.id ? '#fff' : undefined} styleProp={{ width: '100%', height: 'auto', aspectRatio: '1/1', outline: sel === a.id ? '2px solid #e50914' : 'none', outlineOffset: 3 }} />
            </button>
          ))}
        </div>
        {err && <div style={{ color: '#f87171', fontSize: '.78rem', marginTop: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '.8rem', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{ flex: 2, padding: '.8rem', borderRadius: 12, border: 'none', background: '#e50914', color: '#fff', fontWeight: 900, cursor: 'pointer', opacity: busy ? .6 : 1 }}>{busy ? 'Saving…' : 'Use this picture'}</button>
        </div>
      </div>
    </div>
  );
}
