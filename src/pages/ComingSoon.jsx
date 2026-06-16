import { useState, useEffect } from 'react';
import client from '../api/client';

function getYouTubeId(url) {
  if (!url) return '';
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return m ? m[1] : '';
}

export default function ComingSoon() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notified, setNotified] = useState({});
  const [notifying, setNotifying] = useState({});
  const [trailer, setTrailer] = useState(null);

  useEffect(() => {
    client.get('/movies.php?action=coming_soon')
      .then(res => { if (res.data.ok) setMovies(res.data.movies); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e50914', animation: 'pulse 1.2s ease infinite' }} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e50914' }}>Coming Soon</span>
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 900 }}>Upcoming Titles</h1>
      </div>

      {/* Trailer modal */}
      {trailer && (
        <div onClick={() => setTrailer(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 800, position: 'relative' }}>
            <button onClick={() => setTrailer(null)} style={{
              position: 'absolute', top: -40, right: 0, background: 'none', border: 'none',
              color: '#fff', fontSize: '1.5rem', cursor: 'pointer'
            }}>✕</button>
            <div style={{ aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
              <iframe src={`https://www.youtube.com/embed/${getYouTubeId(trailer)}?autoplay=1`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media"
                allowFullScreen />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        </div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
            <rect x="2" y="2" width="20" height="20" rx="2"/><path d="M10 8l6 4-6 4V8z"/>
          </svg>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '.9rem' }}>No upcoming titles announced yet</p>
          <p style={{ color: 'rgba(255,255,255,.2)', fontSize: '.78rem', marginTop: '.5rem' }}>Check back soon</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
          {movies.map(m => (
            <div key={m.id} style={{
              background: '#111', border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 16, overflow: 'hidden',
              display: 'flex', gap: 0
            }}>
              {/* Poster */}
              <div style={{ width: 110, flexShrink: 0, aspectRatio: '2/3', background: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
                {m.image
                  ? <img src={m.image} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)' }} />}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 70%, #111 100%)' }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: '16px 16px 16px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-block', background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.2)', color: '#e50914', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.58rem', fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, marginBottom: 8 }}>
                    Coming {m.release_date || 'Soon'}
                  </div>
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.15rem', fontWeight: 900, marginBottom: 6, lineHeight: 1.1 }}>{m.title}</h2>
                  {m.genre && <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', marginBottom: 8 }}>{m.genre}</div>}
                  {m.description && (
                    <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {m.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {m.trailer_url && (
                    <button onClick={() => setTrailer(m.trailer_url)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
                      color: '#fff', borderRadius: 8, padding: '6px 14px',
                      fontSize: '.75rem', fontWeight: 700, cursor: 'pointer'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Watch Trailer
                    </button>
                  )}
                  <button onClick={async () => {
                      if (notified[m.id] || notifying[m.id]) return;
                      setNotifying(n => ({ ...n, [m.id]: true }));
                      try {
                        const res = await client.post('/movies.php?action=notify_me', { upcoming_id: m.id });
                        if (res.data.ok) setNotified(n => ({ ...n, [m.id]: true }));
                      } catch {}
                      setNotifying(n => ({ ...n, [m.id]: false }));
                    }} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: notified[m.id] ? 'rgba(34,197,94,.1)' : 'rgba(229,9,20,.1)',
                    border: `1px solid ${notified[m.id] ? 'rgba(34,197,94,.25)' : 'rgba(229,9,20,.25)'}`,
                    color: notified[m.id] ? '#22c55e' : '#e50914',
                    borderRadius: 8, padding: '6px 14px',
                    fontSize: '.75rem', fontWeight: 700, cursor: 'pointer'
                  }}>
                    {notified[m.id] ? 'Notified' : notifying[m.id] ? 'Saving...' : 'Notify Me'}
                  </button>
                  {m.notify_count > 0 && (
                    <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.25)', alignSelf: 'center' }}>
                      {m.notify_count} waiting
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  );
}
