import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { progress as progressApi } from '../api/extras';
import client from '../api/client';
import Icon from '../components/Icon';

const fmt = (s) => {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

const ago = (d) => {
  const t = Date.parse(String(d || '').replace(' ', 'T'));
  if (!t) return '';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
};

export default function ContinueWatching() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    progressApi.continueList()
      .then(r => setItems(r.ok ? r.items || [] : []))
      .catch(() => setItems([]));
  }, []);

  const remove = async (id) => {
    setRemoving(id);
    try {
      await client.post('/progress.php?action=remove', { movie_id: id });
      setItems(list => list.filter(x => x.id !== id));
    } catch { /* keep it in the list */ }
    setRemoving(null);
  };

  const [hero, ...rest] = items || [];

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 100px', color: '#fff' }}>
      <style>{`@keyframes cwspin{to{transform:rotate(360deg)}}@keyframes cwIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.4rem' }}>
        <button onClick={() => navigate(-1)} aria-label="Back" style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e50914' }}>Pick up where you left off</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>In Progress</h1>
        </div>
      </div>

      {items === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'cwspin .7s linear infinite' }} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px', background: 'radial-gradient(circle at 30% 30%, rgba(229,9,20,.35), rgba(229,9,20,.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e50914' }}>
            <Icon name="history" size={32} />
          </div>
          <p style={{ fontWeight: 800, marginBottom: 6 }}>Nothing in progress</p>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.82rem', marginBottom: 20 }}>Start a movie or episode and it will wait for you here.</p>
          <button onClick={() => navigate('/browse')} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '.65rem 1.5rem', fontSize: '.82rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '.04em' }}>Find something to watch</button>
        </div>
      ) : (
        <>
          {/* Most recent title gets a big resume card */}
          <div onClick={() => navigate(`/watch/${hero.slug}`)} style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9', maxHeight: 360, width: '100%', background: '#161616', cursor: 'pointer', marginBottom: 22, animation: 'cwIn .35s ease both' }}>
            {(hero.banner_image || hero.cover_image) && <img src={hero.banner_image || hero.cover_image} alt={hero.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.92) 10%, rgba(0,0,0,.1) 65%)' }} />
            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
              <div style={{ fontSize: '.62rem', fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 4 }}>Last watched {ago(hero.updated_at)}</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.05, marginBottom: 10 }}>{hero.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#000', borderRadius: 999, padding: '7px 16px', fontWeight: 900, fontSize: '.8rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg> Resume
                </span>
                <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.7)' }}>{fmt(hero.total - hero.progress)} left</span>
              </div>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: 'rgba(255,255,255,.18)' }}>
              <div style={{ width: `${Math.min(100, hero.percent)}%`, height: '100%', background: '#e50914' }} />
            </div>
          </div>

          {rest.length > 0 && <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginBottom: 12 }}>{items.length} titles in progress</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[hero, ...rest].slice(rest.length ? 1 : 0).map((m, i) => (
              <div key={m.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 8, opacity: removing === m.id ? .4 : 1, animation: `cwIn .35s ease ${0.05 * (i + 1)}s both` }}>
                <div onClick={() => navigate(`/watch/${m.slug}`)} style={{ position: 'relative', width: 128, flexShrink: 0, aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: '#161616', cursor: 'pointer' }}>
                  {(m.banner_image || m.cover_image) && <img src={m.banner_image || m.cover_image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.25)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,.92)"><polygon points="7 4 20 12 7 20 7 4"/></svg>
                  </div>
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'rgba(255,255,255,.2)' }}>
                    <div style={{ width: `${Math.min(100, m.percent)}%`, height: '100%', background: '#e50914' }} />
                  </div>
                </div>
                <div onClick={() => navigate(`/watch/${m.slug}`)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 800, fontSize: '.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                  <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.45)', marginTop: 3 }}>
                    {m.content_type === 'series' ? 'Series' : 'Movie'}{m.year ? ` · ${m.year}` : ''} · {fmt(m.total - m.progress)} left
                  </div>
                  <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', marginTop: 2 }}>{m.percent}% watched · {ago(m.updated_at)}</div>
                </div>
                <button onClick={() => remove(m.id)} disabled={removing === m.id} aria-label={`Remove ${m.title}`} style={{ width: 34, height: 34, flexShrink: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x" size={15} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
