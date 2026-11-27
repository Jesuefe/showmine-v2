import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { kidsApi, KCOLORS, KFONT } from './api';
import { tapHaptic } from '../utils/feel';

// Poster card used across the Kids area, with a heart button for favourites.
export default function KidCard({ m, i = 0, width, onFav }) {
  const navigate = useNavigate();
  const [fav, setFav] = useState(!!m.favorite);
  const c = KCOLORS[i % KCOLORS.length];

  const toggle = async (e) => {
    e.stopPropagation();
    tapHaptic('light');
    const next = !fav; setFav(next);
    try { const r = await kidsApi.fav(m.id); if (r.ok) { setFav(!!r.favorite); onFav?.(m, !!r.favorite); } } catch { setFav(!next); }
  };

  return (
    <div onClick={() => navigate(`/watch/${m.slug}`)} className="kid-press" style={{ cursor: 'pointer', width, flexShrink: 0 }}>
      <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 22, overflow: 'hidden', border: `3px solid ${c}`, background: '#1b1f3a', boxShadow: `0 10px 26px ${c}33` }}>
        {m.cover_image
          ? <img src={m.cover_image} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.35)' }}><Icon name="film" size={34} /></div>}
        <button onClick={toggle} data-nopress aria-label={fav ? 'Remove from favourites' : 'Add to favourites'} style={{
          position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: fav ? '#f472b6' : 'rgba(11,16,38,.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform .25s cubic-bezier(.3,1.6,.5,1), background .2s', transform: fav ? 'scale(1.1)' : 'scale(1)',
        }}>
          <Icon name="heart" size={17} stroke={2.4} style={{ fill: fav ? '#fff' : 'none' }} />
        </button>
        {m.percent > 0 && (
          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, height: 6, borderRadius: 3, background: 'rgba(0,0,0,.5)' }}>
            <div style={{ width: `${Math.min(100, m.percent)}%`, height: '100%', borderRadius: 3, background: c }} />
          </div>
        )}
      </div>
      <div style={{ fontFamily: KFONT, fontSize: '.88rem', fontWeight: 800, padding: '8px 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
    </div>
  );
}

export function KidRail({ title, icon, color = '#facc15', items, onMore, onFav }) {
  if (!items?.length) return null;
  return (
    <section style={{ marginTop: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 10px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1.2rem', fontWeight: 900, fontFamily: KFONT }}>
          {icon && <span style={{ width: 32, height: 32, borderRadius: 11, background: color, color: '#1a1033', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} stroke={2.4} /></span>}
          {title}
        </h2>
        {onMore && <button onClick={onMore} style={{ background: 'none', border: 'none', color, fontWeight: 900, fontFamily: KFONT, fontSize: '.9rem', cursor: 'pointer' }}>See all</button>}
      </div>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 20px 6px', scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
        {items.map((m, i) => <div key={m.id} style={{ scrollSnapAlign: 'start' }}><KidCard m={m} i={i} width={132} onFav={onFav} /></div>)}
      </div>
    </section>
  );
}

export const kidPressCss = `
  @keyframes kidShimmer { 0%{background-position:-300px 0} 100%{background-position:300px 0} }
  @keyframes kidIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  .kid-skel { background: linear-gradient(90deg, rgba(255,255,255,.06) 0%, rgba(255,255,255,.13) 50%, rgba(255,255,255,.06) 100%); background-size: 600px 100%; animation: kidShimmer 1.3s linear infinite; }
  .kid-press { transition: transform .15s ease; }
  .kid-press:active { transform: scale(.96); }
`;
