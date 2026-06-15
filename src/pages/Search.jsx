import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function Search() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    timerRef.current = setTimeout(() => {
      setLoading(true);
      client.get(`/movies.php?action=browse&q=${encodeURIComponent(q)}`)
        .then(res => { if (res.data.ok) setResults(res.data.movies); })
        .catch(console.error)
        .finally(() => { setLoading(false); setSearched(true); });
    }, 400);
  }, [q]);

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '20px 16px 40px' }}>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2"
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="text" value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search movies, series, cast..."
          style={{
            width: '100%', padding: '14px 16px 14px 44px',
            background: '#111', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 12, color: '#fff', fontSize: '1rem',
            outline: 'none', fontFamily: 'inherit'
          }}
        />
        {q && (
          <button onClick={() => setQ('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div>
          <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)', marginBottom: 16 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{q}"
          </p>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '.9rem' }}>No results found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
              {results.map(m => (
                <div key={m.id} onClick={() => navigate(`/watch/${m.slug}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ position: 'relative', aspectRatio: '2/3', background: '#161616', borderRadius: 10, overflow: 'hidden' }}>
                    {m.cover_image
                      ? <img src={m.cover_image} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: '#1a1a1a' }} />}
                    {m.is_free && <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(34,197,94,.95)', color: '#fff', fontSize: '.5rem', fontWeight: 900, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>FREE</span>}
                  </div>
                  <div style={{ padding: '5px 2px 0' }}>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                    <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.25)', marginTop: 2 }}>{m.release_year}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!q && !searched && (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p style={{ color: 'rgba(255,255,255,.2)', fontSize: '.9rem' }}>Search for movies, series, cast</p>
        </div>
      )}
    </div>
  );
}
