import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

function MovieCard({ movie }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/watch/${movie.slug}`)}
      style={{ flexShrink: 0, width: 120, cursor: 'pointer' }}>
      <div style={{
        position: 'relative', aspectRatio: '2/3',
        background: '#161616', borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,.5)'
      }}>
        {movie.cover_image
          ? <img src={movie.cover_image} alt={movie.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M10 8l6 4-6 4V8z"/></svg>
            </div>}
        {movie.is_free && (
          <span style={{
            position: 'absolute', top: 6, left: 6,
            background: 'rgba(34,197,94,.95)', color: '#fff',
            fontSize: '.5rem', fontWeight: 900, padding: '2px 6px',
            borderRadius: 4, letterSpacing: '.08em', textTransform: 'uppercase'
          }}>FREE</span>
        )}
      </div>
      <div style={{ padding: '5px 2px 0' }}>
        <div style={{
          fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,.8)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>{movie.title}</div>
        <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.22)', marginTop: 2 }}>
          {movie.release_year}
        </div>
      </div>
    </div>
  );
}

function MovieRow({ title, label, movies, seeAllPath }) {
  const navigate = useNavigate();
  if (!movies?.length) return null;
  return (
    <div style={{ marginBottom: '2.2rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px .65rem' }}>
        <div>
          {label && (
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '.58rem', fontWeight: 800, letterSpacing: '.22em',
              textTransform: 'uppercase', color: '#e50914', marginBottom: 3
            }}>{label}</div>
          )}
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1.1rem', fontWeight: 800, color: '#fff'
          }}>{title}</div>
        </div>
        {seeAllPath && (
          <button onClick={() => navigate(seeAllPath)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,.3)', fontSize: '.68rem', fontWeight: 700,
            fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.06em',
            textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 3
          }}>
            SEE ALL
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
      </div>
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto',
        padding: '2px 20px 8px', scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {movies.map(m => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}

function HeroSlider({ movies, isMobile }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const timerRef = useRef(null);
  const trailerTimer = useRef(null);
  const touchStartX = useRef(null);

  const goNext = () => setCurrent(c => (c + 1) % movies.length);
  const goPrev = () => setCurrent(c => (c - 1 + movies.length) % movies.length);

  const goTo = (idx) => {
    setCurrent(idx);
    setShowTrailer(false);
    clearTimeout(trailerTimer.current);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(goNext, 6000);
    if (movies[idx]?.trailer_url) {
      trailerTimer.current = setTimeout(() => setShowTrailer(true), 2000);
    }
  };

  useEffect(() => {
    if (!movies?.length) return;
    timerRef.current = setInterval(goNext, 6000);
    if (movies[0]?.trailer_url) {
      trailerTimer.current = setTimeout(() => setShowTrailer(true), 2000);
    }
    return () => { clearInterval(timerRef.current); clearTimeout(trailerTimer.current); };
  }, [movies]);

  useEffect(() => {
    setShowTrailer(false);
    clearTimeout(trailerTimer.current);
    if (movies[current]?.trailer_url) {
      trailerTimer.current = setTimeout(() => setShowTrailer(true), 2000);
    }
  }, [current]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    touchStartX.current = null;
  };

  if (!movies?.length) return null;
  const movie = movies[current];

  const getYtId = (url) => {
    if (!url) return '';
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return m ? m[1] : '';
  };
  const ytId = movie.trailer_url ? getYtId(movie.trailer_url) : '';

  return (
    <div
      style={{
        position: 'relative', width: '100%',
        aspectRatio: isMobile ? '9/14' : '16/7',
        maxHeight: isMobile ? '88vh' : '82vh',
        overflow: 'hidden'
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Images */}
      {movies.map((m, i) => (
        <img key={m.id}
          src={isMobile ? (m.cover_image || m.banner_image) : (m.banner_image || m.cover_image)}
          alt={m.title}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: isMobile ? 'center top' : 'center center',
            opacity: i === current && !showTrailer ? 1 : 0,
            transition: 'opacity .7s ease',
          }} />
      ))}

      {/* Trailer */}
      {showTrailer && ytId && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
          <iframe key={ytId}
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${muted?1:0}&loop=1&playlist=${ytId}&controls=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
            style={{ position: 'absolute', inset: '-10%', width: '120%', height: '120%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          />
        </div>
      )}

      {/* Gradients */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        background: isMobile
          ? 'linear-gradient(to top, #000 0%, rgba(0,0,0,.75) 35%, rgba(0,0,0,.05) 65%, transparent 100%)'
          : 'linear-gradient(to top, #000 0%, rgba(0,0,0,.65) 30%, rgba(0,0,0,.05) 60%, transparent 100%)'
      }} />
      {!isMobile && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          background: 'linear-gradient(to right, rgba(0,0,0,.6) 0%, rgba(0,0,0,.2) 40%, transparent 70%)'
        }} />
      )}

      {/* Desktop arrows */}
      {!isMobile && movies.length > 1 && <>
        <button onClick={goPrev} style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.12)', color: '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onClick={goNext} style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.12)', color: '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </>}

      {/* Mute button */}
      {showTrailer && ytId && (
        <button onClick={() => setMuted(m => !m)} style={{
          position: 'absolute', top: isMobile ? 76 : 20, right: 16, zIndex: 10,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.2)', color: '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {muted
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
          }
        </button>
      )}

      {/* Content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        padding: isMobile ? '0 22px 28px' : '0 56px 44px',
        zIndex: 5, maxWidth: isMobile ? '100%' : '55%'
      }}>
        {movie.genre_names && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <div style={{ width: 20, height: 2, background: '#e50914', borderRadius: 1 }} />
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '.62rem', fontWeight: 800, letterSpacing: '.22em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,.65)'
            }}>{movie.genre_names.split(',')[0]}</span>
          </div>
        )}

        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: isMobile ? 'clamp(2.2rem,8vw,3.5rem)' : 'clamp(2.8rem,4vw,4.5rem)',
          fontWeight: 900, lineHeight: .9, marginBottom: 12,
          textShadow: '0 2px 24px rgba(0,0,0,.9)'
        }}>{movie.title}</h1>

        {!isMobile && movie.short_desc && (
          <p style={{
            fontSize: '.87rem', color: 'rgba(255,255,255,.6)',
            lineHeight: 1.65, marginBottom: 16, maxWidth: 460
          }}>{movie.short_desc.substring(0, 130)}{movie.short_desc.length > 130 ? '...' : ''}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {movie.release_year && <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', fontWeight: 600 }}>{movie.release_year}</span>}
          {movie.age_rating && <span style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.45)', border: '1px solid rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>{movie.age_rating}</span>}
          {movie.duration_mins > 0 && <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', fontWeight: 600 }}>{Math.floor(movie.duration_mins/60)}h {movie.duration_mins%60}m</span>}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          <button onClick={() => navigate(`/watch/${movie.slug}`)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#e50914', color: '#fff', border: 'none', borderRadius: 8,
            padding: isMobile ? '.72rem 1.5rem' : '.82rem 2rem',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: isMobile ? '.92rem' : '1rem', fontWeight: 900,
            letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(229,9,20,.45)'
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            PLAY NOW
          </button>
          <button onClick={() => navigate(`/watch/${movie.slug}`)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(10px)',
            color: '#fff', border: '1px solid rgba(255,255,255,.18)', borderRadius: 8,
            padding: isMobile ? '.72rem 1.4rem' : '.82rem 1.8rem',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: isMobile ? '.92rem' : '1rem', fontWeight: 800,
            letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer'
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            MORE INFO
          </button>
        </div>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {movies.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === current ? 22 : 5, height: 5,
              borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0,
              background: i === current ? '#e50914' : 'rgba(255,255,255,.22)',
              transition: 'all .35s cubic-bezier(.4,0,.2,1)'
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    client.get('/movies.php?action=home')
      .then(res => { if (res.data.ok) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const heroMovies = data?.featured?.length ? data.featured : data?.trending?.slice(0, 5) || [];

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <HeroSlider movies={heroMovies} isMobile={isMobile} />

      <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,.07), transparent)', margin: '28px 0 24px' }} />

      <MovieRow label="What's Hot"  title="Trending Now"  movies={data?.trending} seeAllPath="/browse" />
      <MovieRow label="No Cost"     title="Free to Watch" movies={data?.free}     seeAllPath="/browse" />
      <MovieRow label="Just Added"  title="New Arrivals"  movies={data?.new}      seeAllPath="/browse" />

      <div style={{ height: 24 }} />
    </div>
  );
}