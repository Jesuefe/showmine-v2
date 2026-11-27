import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Icon from '../components/Icon';

// "Free Cinema · CC": Creative Commons and public-domain films that every viewer can watch for free.
const H = { fontFamily: "'Barlow Condensed', sans-serif" };

export function CCMark({ size = 22, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M10.6 9.6a3 3 0 100 4.8M17.1 9.6a3 3 0 100 4.8" />
    </svg>
  );
}

function licenseLabel(l) {
  if (!l) return 'Free';
  if (/public/i.test(l)) return 'Public domain';
  return l.toUpperCase().replace(/^CC[- ]?/, 'CC ');
}

function LicenseBadge({ license, small }) {
  const pd = /public/i.test(license || '');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: small ? '2px 7px' : '4px 10px', borderRadius: 999, background: pd ? 'rgba(250,204,21,.16)' : 'rgba(56,189,248,.16)', color: pd ? '#facc15' : '#38bdf8', border: `1px solid ${pd ? 'rgba(250,204,21,.4)' : 'rgba(56,189,248,.4)'}`, ...H, fontWeight: 800, fontSize: small ? '.6rem' : '.7rem', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>
      <CCMark size={small ? 10 : 12} color="currentColor" />{licenseLabel(license)}
    </span>
  );
}

function Hero({ items }) {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const t = useRef();
  useEffect(() => {
    if (items.length < 2) return undefined;
    t.current = setInterval(() => setI(x => (x + 1) % items.length), 7000);
    return () => clearInterval(t.current);
  }, [items.length]);
  if (!items.length) return null;
  return (
    <div style={{ position: 'relative', height: 'min(62vh, 560px)', minHeight: 360, overflow: 'hidden' }}>
      {items.map((m, k) => (
        <div key={m.id} style={{ position: 'absolute', inset: 0, opacity: k === i ? 1 : 0, transition: 'opacity 1s ease' }}>
          <img src={m.banner_image || m.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', animation: k === i ? 'ccKen 9s ease-out both' : 'none' }} />
        </div>
      ))}
      <div className="cc-grain" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 4%, rgba(0,0,0,.55) 45%, rgba(0,0,0,.2) 75%, rgba(0,0,0,.6) 100%)' }} />
      <div key={items[i].id} style={{ position: 'absolute', left: 20, right: 20, bottom: 26, maxWidth: 640, animation: 'ccUp .6s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <LicenseBadge license={items[i].cc_license} />
          {items[i].release_year && <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '.78rem', fontWeight: 700 }}>{items[i].release_year}</span>}
          {items[i].duration_mins > 0 && <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '.78rem', fontWeight: 700 }}>· {items[i].duration_mins} min</span>}
        </div>
        <h2 style={{ ...H, fontSize: 'clamp(2.2rem, 7vw, 3.6rem)', fontWeight: 900, lineHeight: .95, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.01em' }}>{items[i].title}</h2>
        {items[i].short_desc && <p style={{ color: 'rgba(255,255,255,.72)', fontSize: '.9rem', lineHeight: 1.55, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{items[i].short_desc}</p>}
        <button onClick={() => navigate(`/watch/${items[i].slug}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, border: 'none', background: '#fff', color: '#000', ...H, fontWeight: 800, fontSize: '1rem', letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#000"><polygon points="6 4 20 12 6 20 6 4" /></svg>Watch free
        </button>
      </div>
      {items.length > 1 && (
        <div style={{ position: 'absolute', right: 20, bottom: 30, display: 'flex', gap: 6 }}>
          {items.map((m, k) => <button key={m.id} data-nohaptic aria-label={m.title} onClick={() => { clearInterval(t.current); setI(k); }} style={{ width: k === i ? 22 : 7, height: 7, borderRadius: 4, border: 'none', padding: 0, background: k === i ? '#fff' : 'rgba(255,255,255,.35)', transition: 'width .3s', cursor: 'pointer' }} />)}
        </div>
      )}
    </div>
  );
}

function Card({ m }) {
  const navigate = useNavigate();
  return (
    <div className="cc-card" onClick={() => navigate(`/watch/${m.slug}`)} style={{ flexShrink: 0, width: 150, cursor: 'pointer', scrollSnapAlign: 'start' }}>
      <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 10, overflow: 'hidden', background: '#141414', border: '1px solid rgba(255,255,255,.06)' }}>
        {m.cover_image ? <img src={m.cover_image} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.3)' }}><Icon name="film" size={30} /></div>}
        <div style={{ position: 'absolute', left: 6, top: 6 }}><LicenseBadge license={m.cc_license} small /></div>
      </div>
      <div style={{ fontSize: '.85rem', fontWeight: 700, marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
      <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[m.release_year, m.duration_mins ? `${m.duration_mins} min` : ''].filter(Boolean).join(' · ')}</div>
    </div>
  );
}

function Collection({ c, index }) {
  return (
    <section style={{ marginBottom: '2.4rem', animation: `ccUp .5s ease ${index * .08}s both` }}>
      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <span style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: c.color }} />
        <div>
          <h3 style={{ ...H, margin: 0, fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.03em' }}>{c.label}</h3>
          <p style={{ margin: '2px 0 0', fontSize: '.78rem', color: 'rgba(255,255,255,.45)' }}>{c.blurb}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 6px', scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
        {c.items.map(m => <Card key={m.id} m={m} />)}
      </div>
    </section>
  );
}

export default function FreeCinema() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    client.get('/cc.php?action=home').then(r => (r.data.ok ? setData(r.data) : setErr(true))).catch(() => setErr(true));
  }, []);

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingBottom: 40 }}>
      <style>{`
        @keyframes ccKen { from { transform: scale(1.08); } to { transform: scale(1); } }
        @keyframes ccUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes ccGrain { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-2%,1%)} 50%{transform:translate(1%,-2%)} 75%{transform:translate(2%,2%)} }
        .cc-grain { position:absolute; inset:-10%; pointer-events:none; opacity:.09; mix-blend-mode:overlay;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: ccGrain .9s steps(3) infinite; }
        .cc-card { transition: transform .2s ease; }
        .cc-card:active { transform: scale(.96); }
        @media (hover:hover) { .cc-card:hover { transform: translateY(-4px); } }
      `}</style>

      {!data && !err && (
        <div style={{ padding: 20 }}>
          <div className="sm-skel" style={{ height: 360, borderRadius: 14, background: 'rgba(255,255,255,.05)' }} />
        </div>
      )}
      {err && <div style={{ padding: '4rem 20px', textAlign: 'center', color: 'rgba(255,255,255,.5)' }}>Couldn’t load Free Cinema. Pull down or try again later.</div>}

      {data && (
        <>
          <Hero items={data.hero || []} />

          <div style={{ padding: '22px 20px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, background: 'linear-gradient(120deg, rgba(56,189,248,.12), rgba(250,204,21,.08))', border: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CCMark size={28} /></div>
              <div>
                <div style={{ ...H, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase' }}>Free Cinema · {data.total} films</div>
                <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.5 }}>Creative Commons and public-domain films, free for everyone, with no subscription needed. Credits are shown on every title.</div>
              </div>
            </div>
          </div>

          {(data.collections || []).map((c, i) => <Collection key={c.id} c={c} index={i} />)}

          <p style={{ padding: '0 20px', fontSize: '.7rem', color: 'rgba(255,255,255,.3)', lineHeight: 1.6 }}>
            Open movies © Blender Foundation / Blender Studio, used under Creative Commons Attribution licences (creativecommons.org). Classic films are in the public domain. Showmine is not affiliated with the original creators.
          </p>
        </>
      )}
    </div>
  );
}
