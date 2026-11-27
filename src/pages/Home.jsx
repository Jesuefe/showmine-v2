import { useState, useEffect, useRef } from 'react';
import Icon from '../components/Icon';
import { useNavigate } from 'react-router-dom';
import { useTranslatedTitles, useTranslatedMovie } from '../i18n/useTranslatedContent';
import client from '../api/client';
import { progress as progressApi, shorts as shortsApi } from '../api/extras';
import { useI18n } from '../i18n/I18nContext';
import { CCMark } from './FreeCinema';
import { useProfiles } from '../context/ProfileContext';

function useIsMobile() {
  const checkMobile = () => {
    const ua = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    return isMobileUA || window.innerWidth < 1024;
  };
  const [mobile, setMobile] = useState(checkMobile());
  useEffect(() => {
    const fn = () => setMobile(checkMobile());
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

function MovieCard({ movie, displayTitle }) {
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
          ? <img src={movie.cover_image} alt={displayTitle || movie.title}
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
        }}>{displayTitle || movie.title}</div>
        <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.22)', marginTop: 2 }}>
          {movie.release_year}
        </div>
      </div>
    </div>
  );
}

function ContinueRow() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  useEffect(() => {
    progressApi.continueList().then(r => { if (r.ok) setItems(r.items); }).catch(() => {});
  }, []);
  if (!items.length) return null;
  return (
    <div className="sm-row" style={{ marginBottom: '2.2rem' }}>
      <div style={{ padding: '0 20px .65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{t('continue_watching')}</span>
        <button onClick={() => navigate('/continue-watching')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', fontSize: '.72rem', fontWeight: 700, cursor: 'pointer' }}>See all ›</button>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '2px 20px 8px', scrollbarWidth: 'none' }}>
        {items.map(m => (
          <div key={m.id} onClick={() => navigate(`/watch/${m.slug}`)} style={{ flexShrink: 0, width: 200, cursor: 'pointer' }}>
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#161616', borderRadius: 10, overflow: 'hidden' }}>
              {(m.banner_image || m.cover_image) && <img src={m.banner_image || m.cover_image} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.25)' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)"><polygon points="7 4 20 12 7 20 7 4"/></svg>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: 'rgba(255,255,255,.2)' }}>
                <div style={{ width: `${Math.min(100, m.percent)}%`, height: '100%', background: '#e50914' }} />
              </div>
            </div>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,.8)', marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CATEGORIES = [
  { label: 'Nollywood', genre: 'nollywood', icon: 'clapper' },
  { label: 'International', genre: 'international', icon: 'globe' },
  { label: 'Sports', genre: 'sports', icon: 'ball' },
  { label: 'Documentaries', genre: 'documentary', icon: 'video' },
  { label: 'Religious', genre: 'religious', icon: 'sun' },
  { label: 'Kids', genre: 'kids', icon: 'smile' },
];

function RowTitle({ label, title, onSeeAll }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 20px .65rem' }}>
      <div>
        {label && <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.58rem', fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: '#e50914', marginBottom: 3 }}>{label}</div>}
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{title}</div>
      </div>
      {onSeeAll && (
        <button onClick={onSeeAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.35)', fontSize: '.68rem', fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 3 }}>
          SEE ALL <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}
    </div>
  );
}

function CategoryChips() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 4px', marginBottom: '1.8rem', scrollbarWidth: 'none' }}>
      <button className="home-press" onClick={() => navigate('/cc')} style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999,
        background: 'linear-gradient(90deg, rgba(56,189,248,.22), rgba(250,204,21,.18))', border: '1px solid rgba(56,189,248,.45)', color: '#fff',
        fontSize: '.8rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        <CCMark size={15} />Free Cinema
      </button>
      {CATEGORIES.map(c => (
        <button key={c.genre} className="home-press" onClick={() => navigate(`/browse?genre=${c.genre}`)} style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999,
          background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff',
          fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <Icon name={c.icon} size={15} />{c.label}
        </button>
      ))}
    </div>
  );
}

function Top10Row({ movies }) {
  const navigate = useNavigate();
  const { getTitle } = useTranslatedTitles(movies || []);
  const list = (movies || []).slice(0, 10);
  if (list.length < 3) return null;
  return (
    <div className="sm-row" style={{ marginBottom: '2.2rem' }}>
      <RowTitle label="Most watched" title="Top 10 Today" />
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '2px 20px 8px', scrollbarWidth: 'none' }}>
        {list.map((m, i) => (
          <div key={m.id} className="home-press" onClick={() => navigate(`/watch/${m.slug}`)} style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', cursor: 'pointer' }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '6.2rem', lineHeight: .78,
              color: '#000', WebkitTextStroke: '2px rgba(255,255,255,.55)', marginRight: -14, zIndex: 0, letterSpacing: '-.04em',
            }}>{i + 1}</div>
            <div style={{ position: 'relative', zIndex: 1, width: 104, aspectRatio: '2/3', borderRadius: 10, overflow: 'hidden', background: '#161616', boxShadow: '0 6px 20px rgba(0,0,0,.6)' }}>
              {m.cover_image && <img src={m.cover_image} alt={getTitle(m) || m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShortsRow() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  useEffect(() => {
    shortsApi.feed(1).then(r => { if (r.ok) setItems((r.items || []).slice(0, 8)); }).catch(() => {});
  }, []);
  if (!items.length) return null;
  return (
    <div className="sm-row" style={{ marginBottom: '2.2rem' }}>
      <RowTitle label="Quick clips" title="Shorts" onSeeAll={() => navigate('/shorts')} />
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '2px 20px 8px', scrollbarWidth: 'none' }}>
        {items.map(it => (
          <div key={it.id} className="home-press" onClick={() => navigate('/shorts')} style={{
            flexShrink: 0, width: 118, aspectRatio: '9/16', borderRadius: 14, overflow: 'hidden', position: 'relative', cursor: 'pointer',
            background: 'linear-gradient(160deg,#2a0a10,#0d0d12)', border: '1px solid rgba(255,255,255,.08)',
          }}>
            {it.thumbnail_url && <img src={it.thumbnail_url} alt={it.title || ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.85), transparent 55%)' }} />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)" style={{ position: 'absolute', top: 8, right: 8 }}><polygon points="7 4 20 12 7 20 7 4"/></svg>
            <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8 }}>
              <div style={{ fontSize: '.7rem', fontWeight: 700, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.title || it.movie_title || it.caption}</div>
              {it.views > 0 && <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.55)', marginTop: 3 }}>{Intl.NumberFormat('en', { notation: 'compact' }).format(it.views)} views</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeSkeleton({ isMobile }) {
  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <div className="home-skel" style={{ width: '100%', aspectRatio: isMobile ? '9/14' : '16/7', maxHeight: isMobile ? '88vh' : '82vh' }} />
      {[0, 1].map(r => (
        <div key={r} style={{ padding: '28px 20px 0' }}>
          <div className="home-skel" style={{ width: 140, height: 16, borderRadius: 6, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="home-skel" style={{ flexShrink: 0, width: 120, aspectRatio: '2/3', borderRadius: 10 }} />)}
          </div>
        </div>
      ))}
      <style>{HOME_CSS}</style>
    </div>
  );
}

const HOME_CSS = `
  @keyframes homeShimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .home-skel { background: linear-gradient(90deg,#111 0%,#1c1c1c 50%,#111 100%); background-size: 800px 100%; animation: homeShimmer 1.3s linear infinite; }
  .home-press { transition: transform .15s ease; }
  .home-press:active { transform: scale(.96); }
`;

function ForYouRows() {
  const { current } = useProfiles();
  const [rec, setRec] = useState(null);
  useEffect(() => {
    client.get('/movies.php?action=recommend').then(r => r.data.ok && setRec(r.data)).catch(() => {});
  }, [current?.id]);
  if (!rec) return null;
  const who = current?.name;
  return (
    <>
      <MovieRow label={rec.personal ? 'Picked for you' : 'Start here'} title={rec.personal ? (who ? `Top Picks for ${who}` : 'Top Picks for You') : 'Popular on Showmine'} movies={rec.picks} />
      {rec.because && <MovieRow label="More like this" title={`Because you watched ${rec.because.title}`} movies={rec.because.items} />}
    </>
  );
}

function CCRow() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    client.get('/cc.php?action=rail').then(r => r.data.ok && setItems(r.data.items || [])).catch(() => {});
  }, []);
  return <MovieRow label="Creative Commons" title="Free Cinema · CC" movies={items} seeAllPath="/cc" />;
}

function MovieRow({ title, label, movies, seeAllPath }) {
  const navigate = useNavigate();
  const { getTitle } = useTranslatedTitles(movies);
  if (!movies?.length) return null;
  return (
    <div className="sm-row" style={{ marginBottom: '2.2rem' }}>
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
        {movies.map(m => <MovieCard key={m.id} movie={m} displayTitle={getTitle(m)} />)}
      </div>
    </div>
  );
}

function HeroSlider({ movies, isMobile }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const translatedHero = useTranslatedMovie(movies[current]?.id);
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
        }}>{translatedHero?.title || movie.title}</h1>

        {!isMobile && movie.short_desc && (
          <p style={{
            fontSize: '.87rem', color: 'rgba(255,255,255,.6)',
            lineHeight: 1.65, marginBottom: 16, maxWidth: 460
          }}>{(() => { const d = translatedHero?.short_desc || movie.short_desc; return d.substring(0, 130) + (d.length > 130 ? '...' : ''); })()}</p>
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

  if (loading) return <HomeSkeleton isMobile={isMobile} />;

  const heroMovies = data?.featured?.length ? data.featured : data?.trending?.slice(0, 5) || [];

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <HeroSlider movies={heroMovies} isMobile={isMobile} />

      <div style={{ height: 22 }} />
      <CategoryChips />

      <ContinueRow />
      <ForYouRows />
      <Top10Row movies={data?.trending} />
      <ShortsRow />
      <MovieRow label="No Cost"     title="Free to Watch" movies={data?.free}     seeAllPath="/browse" />
      <CCRow />
      <MovieRow label="Just Added"  title="New Arrivals"  movies={data?.new}      seeAllPath="/browse" />
      <MovieRow label="What's Hot"  title="Trending Now"  movies={data?.trending?.slice(10)} seeAllPath="/browse" />

      {!data && (
        <div style={{ textAlign: 'center', padding: '3rem 20px', color: 'rgba(255,255,255,.5)' }}>
          <div style={{ marginBottom: 12 }}>Couldn’t load the home page.</div>
          <button onClick={() => window.location.reload()} style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: 8, padding: '.7rem 1.4rem', fontWeight: 700, cursor: 'pointer' }}>Try again</button>
        </div>
      )}

      <div style={{ height: 24 }} />
      <style>{HOME_CSS}</style>
    </div>
  );
}