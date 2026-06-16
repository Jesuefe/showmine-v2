import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function Watchlist() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/movies.php?action=watchlist_get')
      .then(res => { if (res.data.ok) setMovies(res.data.movies); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const remove = async (movieId) => {
    await client.post('/movies.php?action=watchlist_remove', { movie_id: movieId });
    setMovies(m => m.filter(x => x.id !== movieId));
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 40px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e50914', marginBottom: 4 }}>My Collection</div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 900 }}>My List</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '.9rem', marginBottom: 16 }}>Your list is empty</p>
          <p style={{ color: 'rgba(255,255,255,.2)', fontSize: '.78rem', marginBottom: 20 }}>Add movies and series to watch later</p>
          <button onClick={() => navigate('/browse')} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '.6rem 1.4rem', fontSize: '.82rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Browse Content
          </button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)', marginBottom: 16 }}>{movies.length} title{movies.length !== 1 ? 's' : ''}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
            {movies.map(m => (
              <div key={m.id} style={{ position: 'relative', cursor: 'pointer' }}>
                <div onClick={() => navigate(`/watch/${m.slug}`)} style={{ position: 'relative', aspectRatio: '2/3', background: '#161616', borderRadius: 10, overflow: 'hidden', marginBottom: 6 }}>
                  {m.cover_image
                    ? <img src={m.cover_image} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: '#1a1a1a' }} />}
                  {m.is_free && <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(34,197,94,.95)', color: '#fff', fontSize: '.5rem', fontWeight: 900, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>FREE</span>}
                </div>
                {/* Remove button */}
                <button onClick={() => remove(m.id)} style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'rgba(0,0,0,.7)', border: '1px solid rgba(255,255,255,.2)',
                  color: '#fff', cursor: 'pointer', fontSize: '.7rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.25)', marginTop: 2 }}>{m.release_year}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
