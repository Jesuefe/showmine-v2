import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function ComingSoon() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/movies.php?action=browse&sort=new')
      .then(res => { if (res.data.ok) setMovies(res.data.movies); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 40px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e50914', animation: 'pulse 1.2s ease infinite' }} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e50914' }}>Coming Soon</span>
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 900 }}>Upcoming Titles</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        </div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'rgba(255,255,255,.3)' }}>
          <p>No upcoming titles at the moment</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
          {movies.map(m => (
            <div key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/watch/${m.slug}`)}>
              <div style={{ position: 'relative', aspectRatio: '2/3', background: '#161616', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                {m.cover_image
                  ? <img src={m.cover_image} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: '#1a1a1a' }} />}
                <div style={{ position: 'absolute', top: 8, left: 8, background: '#e50914', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.55rem', fontWeight: 900, padding: '2px 8px', borderRadius: 4, letterSpacing: '.08em', textTransform: 'uppercase' }}>SOON</div>
              </div>
              <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'rgba(255,255,255,.85)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
              <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.3)' }}>{m.release_year}</div>
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
