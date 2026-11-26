import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { useNavigate } from 'react-router-dom';

const COND = "'Barlow Condensed', sans-serif";

export function getYouTubeId(url) {
  if (!url) return '';
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#/]+)/);
  return m ? m[1] : '';
}

function ytCommand(iframe, func) {
  try { iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*'); } catch { /* ignore */ }
}

function Chip({ children, strong }) {
  return (
    <span style={{
      fontSize: '.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
      background: strong ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.1)', color: strong ? '#000' : 'rgba(255,255,255,.85)',
      border: strong ? 'none' : '1px solid rgba(255,255,255,.14)', backdropFilter: 'blur(6px)',
    }}>{children}</span>
  );
}

// Full-screen trailer with sound
export function TrailerModal({ url, title, onClose }) {
  const id = getYouTubeId(url);
  if (!id) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3500, background: 'rgba(0,0,0,.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 960 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: COND, fontSize: '.62rem', fontWeight: 800, letterSpacing: '.2em', color: '#e50914' }}>OFFICIAL TRAILER</div>
            <div style={{ fontFamily: COND, fontSize: '1.2rem', fontWeight: 800 }}>{title}</div>
          </div>
          <button onClick={onClose} aria-label="Close trailer" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', background: '#000', boxShadow: '0 20px 60px rgba(229,9,20,.25)' }}>
          <iframe title={`${title} trailer`} src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      </div>
    </div>
  );
}

export function WatchHero({ movie, access, onPlay, onSubscribe, onTrailer }) {
  const ytId = getYouTubeId(movie.trailer_url);
  const [trailerOn, setTrailerOn] = useState(false);
  const [muted, setMuted] = useState(true);
  const frame = useRef(null);

  useEffect(() => {
    if (!ytId) return;
    const t = setTimeout(() => setTrailerOn(true), 1800);
    return () => clearTimeout(t);
  }, [ytId]);

  const toggleMute = () => { ytCommand(frame.current, muted ? 'unMute' : 'mute'); setMuted(m => !m); };
  const genres = (movie.genre_names || '').split(',').map(s => s.trim()).filter(Boolean);
  const img = movie.banner_image || movie.cover_image;
  const hrs = movie.duration_mins > 0 ? `${Math.floor(movie.duration_mins / 60) ? Math.floor(movie.duration_mins / 60) + 'h ' : ''}${movie.duration_mins % 60}m` : '';

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', maxHeight: '78vh', minHeight: 420, overflow: 'hidden', background: '#000' }}>
      {img && <img src={img} alt={movie.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: trailerOn ? 0 : 1, transition: 'opacity .8s' }} />}
      {trailerOn && ytId && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <iframe ref={frame} title="Trailer preview"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1`}
            style={{ position: 'absolute', top: '50%', left: '50%', height: '100%', width: '177.78vh', minWidth: '100%', minHeight: '56.25vw', transform: 'translate(-50%,-50%)', border: 'none', pointerEvents: 'none' }}
            allow="autoplay; encrypted-media" />
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,.82) 28%, rgba(0,0,0,.15) 60%, rgba(0,0,0,.45) 100%)' }} />
      {/* subtle African-print accent stripe */}
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'repeating-linear-gradient(90deg,#e50914 0 18px,#f5c542 18px 30px,#0a7d3b 30px 42px,#000 42px 48px)', opacity: .85 }} />

      {trailerOn && ytId && (
        <button onClick={toggleMute} aria-label={muted ? 'Unmute trailer' : 'Mute trailer'} style={{
          position: 'absolute', right: 16, top: 'calc(env(safe-area-inset-top) + 72px)', zIndex: 3, width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {muted
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/></svg>}
        </button>
      )}

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 20px 22px', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontFamily: COND, fontWeight: 900, fontSize: '.78rem', letterSpacing: '.24em', color: '#e50914' }}>SHOWMINE</span>
          {genres[0] && <span style={{ fontFamily: COND, fontWeight: 700, fontSize: '.7rem', letterSpacing: '.16em', color: 'rgba(255,255,255,.7)', textTransform: 'uppercase' }}>· {genres[0]}</span>}
        </div>
        <h1 style={{ fontFamily: COND, fontSize: 'clamp(2.1rem,9vw,3.6rem)', fontWeight: 900, lineHeight: .92, margin: '0 0 12px', textShadow: '0 4px 30px rgba(0,0,0,.8)' }}>{movie.title}</h1>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {movie.is_free && <Chip strong>FREE</Chip>}
          {movie.age_rating && <Chip>{movie.age_rating}</Chip>}
          {movie.release_year && <Chip>{movie.release_year}</Chip>}
          {hrs && <Chip>{hrs}</Chip>}
          {movie.language && <Chip>{movie.language}</Chip>}
          <Chip>HD</Chip>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {access?.ok ? (
            <button onClick={onPlay} className="wd-press" style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#000', border: 'none', borderRadius: 10,
              padding: '14px 18px', fontFamily: COND, fontSize: '1.05rem', fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg> Play
            </button>
          ) : (
            <button onClick={onSubscribe} className="wd-press" style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#e50914', color: '#fff', border: 'none', borderRadius: 10,
              padding: '14px 18px', fontFamily: COND, fontSize: '1.05rem', fontWeight: 900, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 26px rgba(229,9,20,.45)',
            }}><Icon name="unlock" size={18} /> Subscribe to watch</button>
          )}
          {ytId && (
            <button onClick={onTrailer} className="wd-press" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(10px)', color: '#fff',
              border: '1px solid rgba(255,255,255,.25)', borderRadius: 10, padding: '14px 16px', fontFamily: COND, fontSize: '1rem', fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', cursor: 'pointer',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="3"/><polygon points="10 9 15 12 10 15 10 9" fill="currentColor"/></svg> Trailer
            </button>
          )}
        </div>
      </div>
      <style>{`.wd-press{transition:transform .12s}.wd-press:active{transform:scale(.96)}`}</style>
    </div>
  );
}

function ActionBtn({ icon, label, active, color = '#fff', onClick, pop }) {
  return (
    <button onClick={onClick} className="wd-press" style={{ flex: 1, background: 'none', border: 'none', color: active ? color : 'rgba(255,255,255,.85)', cursor: 'pointer', padding: '6px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span key={pop} className={pop ? 'wd-pop' : ''} style={{
        width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? `${color}22` : 'rgba(255,255,255,.07)', border: `1px solid ${active ? `${color}66` : 'rgba(255,255,255,.1)'}`,
      }}>{icon}</span>
      <span style={{ fontSize: '.7rem', fontWeight: 700 }}>{label}</span>
    </button>
  );
}

export function WatchActions({ liked, likeCount, inList, commentCount, onLike, onList, onComments, onShare }) {
  const [pop, setPop] = useState(0);
  const fmt = (n) => (n > 0 ? Intl.NumberFormat('en', { notation: 'compact' }).format(n) : '');
  return (
    <div style={{ display: 'flex', gap: 4, padding: '6px 0 14px', borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 16 }}>
      <ActionBtn label={inList ? 'In My List' : 'My List'} active={inList} color="#4ade80" onClick={onList}
        icon={inList
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>} />
      <ActionBtn label={fmt(likeCount) || 'Like'} active={liked} color="#e50914" pop={pop}
        onClick={() => { if (!liked) { setPop(p => p + 1); navigator.vibrate?.(12); } onLike(); }}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>} />
      <ActionBtn label={fmt(commentCount) ? `${fmt(commentCount)} Comments` : 'Comment'} onClick={onComments}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>} />
      <ActionBtn label="Share" onClick={onShare}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>} />
      <style>{`@keyframes wdPop{0%{transform:scale(1)}35%{transform:scale(1.35)}100%{transform:scale(1)}}.wd-pop{animation:wdPop .4s ease}.wd-press{transition:transform .12s}.wd-press:active{transform:scale(.94)}`}</style>
    </div>
  );
}

export function WatchInfo({ movie }) {
  const navigate = useNavigate();
  const [more, setMore] = useState(false);
  const text = movie.description || movie.short_desc || '';
  const genres = (movie.genre_names || '').split(',').map(s => s.trim()).filter(Boolean);
  const cast = (movie.cast_names || '').split(',').map(s => s.trim()).filter(Boolean);
  return (
    <div style={{ marginBottom: 8 }}>
      {text && (
        <div onClick={() => setMore(m => !m)} style={{ cursor: 'pointer', marginBottom: 14 }}>
          <p style={{
            color: 'rgba(255,255,255,.78)', fontSize: '.9rem', lineHeight: 1.7, margin: 0,
            ...(more ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
          }}>{text}</p>
          {text.length > 160 && <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#fff' }}>{more ? 'Less' : 'More'}</span>}
        </div>
      )}
      {genres.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {genres.map(g => (
            <button key={g} onClick={() => navigate(`/search?q=${encodeURIComponent(g)}`)} style={{
              fontSize: '.74rem', fontWeight: 700, padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
              background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.3)', color: '#ff6b73',
            }}>{g}</button>
          ))}
        </div>
      )}
      {cast.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: COND, fontSize: '.7rem', fontWeight: 800, letterSpacing: '.16em', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>STARRING</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {cast.slice(0, 12).map(c => (
              <button key={c} onClick={() => navigate(`/search?q=${encodeURIComponent(c)}`)} style={{ flexShrink: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', width: 68, textAlign: 'center', padding: 0 }}>
                <span style={{ width: 54, height: 54, borderRadius: '50%', margin: '0 auto 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#2a2a30,#141418)', border: '1px solid rgba(255,255,255,.1)', fontFamily: COND, fontWeight: 800, fontSize: '1.05rem' }}>
                  {c.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <span style={{ fontSize: '.66rem', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'rgba(255,255,255,.75)' }}>{c}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {movie.director && <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.45)' }}>Directed by <span style={{ color: '#fff', fontWeight: 700 }}>{movie.director}</span></div>}
    </div>
  );
}

export function CommentsPreview({ count, onOpen }) {
  return (
    <button onClick={onOpen} style={{
      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, cursor: 'pointer', color: '#fff',
      background: '#101013', border: '1px solid rgba(255,255,255,.07)',
    }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(229,9,20,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2.2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontFamily: COND, fontSize: '1.05rem', fontWeight: 800 }}>Comments {count > 0 && <span style={{ color: 'rgba(255,255,255,.45)' }}>· {count}</span>}</span>
        <span style={{ display: 'block', fontSize: '.78rem', color: 'rgba(255,255,255,.5)' }}>{count > 0 ? 'See what viewers are saying' : 'Be the first to share your thoughts'}</span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  );
}
