import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import Navbar from '../components/Navbar';

const SECTIONS = [
  { label: 'African Movies', sub: 'Nollywood · Yoruba · Igbo · Hausa', color: '#e50914', type: 'movie' },
  { label: 'International',  sub: 'Hollywood · K-Drama · Bollywood',   color: '#3b82f6', type: 'movie' },
  { label: 'Sports',         sub: 'Football · Basketball · Athletics',  color: '#22c55e', type: 'movie' },
  { label: 'Documentaries',  sub: 'Nature · History · True Crime',      color: '#a855f7', type: 'movie' },
  { label: 'Religious',      sub: 'Christian · Muslim',                 color: '#f59e0b', type: 'movie' },
  { label: 'Kids Zone',      sub: 'Animation · Education · Quizzes',    color: '#ec4899', type: 'movie' },
];

function MovieCard({ movie }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/watch/${movie.slug}`)}
      style={{ cursor: 'pointer' }}>
      <div style={{
        position: 'relative', aspectRatio: '2/3',
        background: '#1c1c1c', borderRadius: 8, overflow: 'hidden'
      }}>
        {movie.cover_image
          ? <img src={movie.cover_image} alt={movie.title} loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: '#222',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,.2)', fontSize: '.7rem' }}>No Image</div>}
        {movie.is_free && (
          <span style={{
            position: 'absolute', top: 6, left: 6,
            background: 'rgba(34,197,94,.9)', color: '#fff',
            fontSize: '.55rem', fontWeight: 800, padding: '2px 6px',
            borderRadius: 4, textTransform: 'uppercase'
          }}>Free</span>
        )}
      </div>
      <div style={{ padding: '4px 2px 0' }}>
        <div style={{
          fontSize: '.75rem', fontWeight: 700, color: 'rgba(255,255,255,.85)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>{movie.title}</div>
        <div style={{ fontSize: '.64rem', color: 'rgba(255,255,255,.3)', marginTop: 2 }}>
          {movie.release_year}{movie.language ? ` · ${movie.language}` : ''}
        </div>
      </div>
    </div>
  );
}

export default function Browse() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const q    = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'popular';
  const page = parseInt(searchParams.get('page') || '1');

  const showSections = !q && !type;

  useEffect(() => {
    setLoading(true);
    client.get(`/movies.php?action=browse&q=${q}&type=${type}&sort=${sort}&page=${page}`)
      .then(res => {
        if (res.data.ok) { setMovies(res.data.movies); setTotal(res.data.total || res.data.movies.length); }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q, type, sort, page]);

  const setParam = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: '5rem' }}>
      <Navbar />
      <div style={{ paddingTop: 60 }}>
        <div style={{ padding: '16px 16px 0', maxWidth: 1400, margin: '0 auto' }}>

          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1.3rem', fontWeight: 800, marginBottom: 12
          }}>Browse</h1>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,.3)" strokeWidth="2"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text" value={q} placeholder="Search movies, series, cast..."
              onChange={e => setParam('q', e.target.value)}
              style={{
                width: '100%', padding: '12px 16px 12px 38px',
                background: 'rgba(255,255,255,.07)',
                border: '1.5px solid rgba(255,255,255,.1)',
                borderRadius: 12, color: '#fff', fontSize: '.9rem',
                outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Type filter pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[['', 'All'], ['movie', 'Movies'], ['series', 'Series']].map(([v, l]) => (
              <button key={v} onClick={() => setParam('type', v)} style={{
                flexShrink: 0, padding: '7px 16px', borderRadius: 20,
                fontSize: '.78rem', fontWeight: 700, border: '1.5px solid',
                cursor: 'pointer', whiteSpace: 'nowrap',
                background: type === v ? '#e50914' : 'rgba(255,255,255,.06)',
                color: type === v ? '#fff' : 'rgba(255,255,255,.5)',
                borderColor: type === v ? '#e50914' : 'rgba(255,255,255,.1)'
              }}>{l}</button>
            ))}
            <div style={{ flex: 1 }} />
            {[['popular', 'Popular'], ['new', 'Newest'], ['az', 'A–Z']].map(([v, l]) => (
              <button key={v} onClick={() => setParam('sort', v)} style={{
                flexShrink: 0, padding: '7px 16px', borderRadius: 20,
                fontSize: '.78rem', fontWeight: 700, border: '1.5px solid',
                cursor: 'pointer', whiteSpace: 'nowrap',
                background: sort === v ? '#e50914' : 'rgba(255,255,255,.06)',
                color: sort === v ? '#fff' : 'rgba(255,255,255,.5)',
                borderColor: sort === v ? '#e50914' : 'rgba(255,255,255,.1)'
              }}>{l}</button>
            ))}
          </div>

          {/* Section cards */}
          {showSections && (
            <>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '.65rem', fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 10
              }}>Sections</p>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 10, marginBottom: 24
              }}>
                {SECTIONS.map(s => (
                  <div key={s.label} onClick={() => setParam('type', s.type)}
                    style={{
                      borderRadius: 16, padding: '20px 16px',
                      border: '1px solid rgba(255,255,255,.07)',
                      background: 'linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.01))',
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      minHeight: 110
                    }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: `radial-gradient(ellipse at top right, ${s.color} 0%, transparent 65%)`,
                      opacity: .18, pointerEvents: 'none'
                    }} />
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '1.05rem', fontWeight: 800, color: '#fff',
                      position: 'relative', zIndex: 1, marginBottom: 4
                    }}>{s.label}</div>
                    <div style={{
                      fontSize: '.68rem', color: 'rgba(255,255,255,.4)',
                      position: 'relative', zIndex: 1, lineHeight: 1.5
                    }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '.65rem', fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 10
              }}>All Content</p>
            </>
          )}

          {/* Results count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)' }}>
              {loading ? 'Loading...' : `${total} titles`}
            </p>
          </div>

          {/* Movie grid */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid #333', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : movies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'rgba(255,255,255,.3)' }}>
              <p style={{ fontSize: '.9rem' }}>{q ? `No results for "${q}"` : 'No content available'}</p>
              {(q || type) && (
                <button onClick={() => setSearchParams({})} style={{
                  marginTop: '.75rem', background: 'rgba(255,255,255,.07)',
                  color: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 8, padding: '.5rem 1rem', cursor: 'pointer', fontSize: '.8rem'
                }}>Clear filters</button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 12, paddingBottom: 16
            }}>
              {movies.map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}