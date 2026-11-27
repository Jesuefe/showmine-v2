import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon, { IconBadge } from '../components/Icon';
import { kidsApi, KFONT, KBG } from './api';
import KidCard, { kidPressCss } from './KidCard';

const META = {
  favorites: { label: 'My favourites', icon: 'heart', color: '#f472b6' },
  cartoons: { label: 'Cartoons', icon: 'palette', color: '#f472b6' },
  animals: { label: 'Animal Friends', icon: 'heart', color: '#4ade80' },
  funny: { label: 'Giggles', icon: 'smile', color: '#facc15' },
  adventure: { label: 'Adventures', icon: 'globe', color: '#38bdf8' },
  music: { label: 'Music & Dance', icon: 'volume', color: '#a78bfa' },
  learn: { label: 'Learn', icon: 'book', color: '#fb923c' },
};

function Shell({ title, icon, color, children, back = '/kids' }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: KBG, fontFamily: KFONT, color: '#fff', paddingBottom: 40 }}>
      <style>{kidPressCss}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(env(safe-area-inset-top) + 16px) 20px 14px' }}>
        <button onClick={() => navigate(back)} aria-label="Back" style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {icon && <span style={{ width: 40, height: 40, borderRadius: 13, background: color, color: '#1a1033', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={22} stroke={2.4} /></span>}
        <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, flex: 1, minWidth: 0 }}>{title}</h1>
      </div>
      {children}
    </div>
  );
}

function Grid({ items, loading, empty }) {
  if (loading) return (
    <div style={grid}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="kid-skel" style={{ aspectRatio: '2/3', borderRadius: 22 }} />)}</div>
  );
  if (!items.length) return (
    <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
      <IconBadge name="smile" size={72} color="#facc15" style={{ margin: '0 auto 12px' }} />
      <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{empty}</div>
    </div>
  );
  return <div style={grid}>{items.map((m, i) => <div key={m.id} style={{ animation: `kidIn .35s ease ${Math.min(i, 12) * .04}s both` }}><KidCard m={m} i={i} /></div>)}</div>;
}
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, padding: '0 20px' };

export function KidsCategory() {
  const { cat } = useParams();
  const meta = META[cat] || { label: 'Shows', icon: 'star', color: '#facc15' };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    kidsApi.category(cat).then(r => setItems(r.ok ? r.items || [] : [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, [cat]);
  return (
    <Shell title={meta.label} icon={meta.icon} color={meta.color}>
      <Grid items={items} loading={loading} empty={cat === 'favorites' ? 'Tap the heart on a show to save it here!' : 'New shows coming soon!'} />
    </Shell>
  );
}

export function KidsSearch() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const input = useRef();
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setItems([]); setLoading(false); return undefined; }
    setLoading(true);
    const t = setTimeout(() => {
      kidsApi.search(term).then(r => setItems(r.ok ? r.items || [] : [])).catch(() => setItems([])).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  const suggestions = ['llama', 'bunny', 'adventure', 'funny', 'animals'];
  return (
    <Shell title="Find a show" icon="search" color="#38bdf8">
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 16px', borderRadius: 20, border: '3px solid #38bdf8', background: 'rgba(255,255,255,.07)' }}>
          <Icon name="search" size={20} stroke={2.4} />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Type a name…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontFamily: KFONT, fontWeight: 800, fontSize: '1.1rem', padding: '12px 0' }} />
          {q && <button onClick={() => setQ('')} aria-label="Clear" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Icon name="x" size={20} stroke={2.4} /></button>}
        </div>
        {q.trim().length < 2 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {suggestions.map((s, i) => (
              <button key={s} onClick={() => setQ(s)} style={{ padding: '9px 16px', borderRadius: 999, border: 'none', background: ['#f472b6', '#facc15', '#4ade80', '#a78bfa', '#fb923c'][i], color: '#1a1033', fontWeight: 900, fontFamily: KFONT, cursor: 'pointer' }}>{s}</button>
            ))}
          </div>
        )}
      </div>
      {q.trim().length >= 2 && <Grid items={items} loading={loading} empty={`No shows called “${q.trim()}” yet`} />}
    </Shell>
  );
}
