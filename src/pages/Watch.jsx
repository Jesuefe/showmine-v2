import { useState, useEffect, useRef, useCallback } from 'react';
import { showInterstitial, isAdMobAvailable } from '../services/admob';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import client from '../api/client';

const API_BASE = 'https://app.showmine.ng/api/v2';

function getYouTubeId(url) {
  if (!url) return '';
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return m ? m[1] : '';
}

function MovieCard({ movie }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/watch/${movie.slug}`)}
      style={{ flexShrink: 0, width: 120, cursor: 'pointer' }}>
      <div style={{
        position: 'relative', aspectRatio: '2/3',
        background: '#161616', borderRadius: 10, overflow: 'hidden'
      }}>
        {movie.cover_image
          ? <img src={movie.cover_image} alt={movie.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: '#1a1a1a' }} />}
        {movie.is_free && (
          <span style={{
            position: 'absolute', top: 6, left: 6,
            background: 'rgba(34,197,94,.95)', color: '#fff',
            fontSize: '.5rem', fontWeight: 900, padding: '2px 6px',
            borderRadius: 4, textTransform: 'uppercase'
          }}>FREE</span>
        )}
      </div>
      <div style={{ padding: '5px 2px 0' }}>
        <div style={{
          fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,.8)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>{movie.title}</div>
        <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.25)', marginTop: 2 }}>
          {movie.release_year}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SHOWMINE PLAYER
// ─────────────────────────────────────────────
function ShowminePlayer({ url, streamType, title, onBack, movieId }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimer = useRef(null);
  const touchStartRef = useRef(null);
  const dataTrackRef = useRef({ bytesEstimate: 0, lastSentBytes: 0, lastMidroll: 0 });
  const [sessionDataUsed, setSessionDataUsed] = useState(0);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showSkip, setShowSkip] = useState(null);
  const [showVolume, setShowVolume] = useState(false);
  const [showBrightness, setShowBrightness] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [showQuality, setShowQuality] = useState(false);
  const [levels, setLevels] = useState([]);
  const [error, setError] = useState('');

  // Boot player
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !url) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    setLoading(true);
    setError('');

    if (streamType === 'hls') {
      const isCapacitor = !!(window.Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:' || window.Android);
      if (isCapacitor) {
        // Android WebView supports HLS natively
        vid.src = url;
        vid.load();
        vid.play().catch(() => { vid.muted = true; vid.play().catch(() => {}); });
      } else if (Hls.isSupported()) {
        const hls = new Hls({ startLevel: -1, capLevelToPlayerSize: true, maxBufferLength: 30 });
        hls.loadSource(url);
        hls.attachMedia(vid);
        hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
          const levelList = data.levels.map((l, i) => ({ id: i, label: l.height + 'p' }));
          setLevels(levelList);
          const savedPref = window.__showmineQualityPref || { quality_preference: 'auto', data_saver: false };
          const qualityMap = { '360p': 360, '480p': 480, '720p': 720, '1080p': 1080, '4k': 2160 };
          let targetHeight = null;
          if (savedPref.data_saver) {
            targetHeight = 360;
          } else if (savedPref.quality_preference && savedPref.quality_preference !== 'auto') {
            targetHeight = qualityMap[savedPref.quality_preference];
          }
          if (targetHeight) {
            let bestIdx = -1, bestDiff = Infinity;
            data.levels.forEach((l, i) => {
              const diff = Math.abs(l.height - targetHeight);
              if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
            });
            if (bestIdx >= 0) {
              hls.currentLevel = bestIdx;
              setQuality(data.levels[bestIdx].height + 'p');
              window.__showmineCurrentQuality = data.levels[bestIdx].height + 'p';
            }
          }
          vid.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (e, d) => {
          if (d.fatal) setError('Stream error. Please try again.');
        });
        hlsRef.current = hls;
      } else {
        // Fallback: native HLS (Safari/iOS) or just try
        vid.src = url;
        vid.load();
        vid.play().catch(() => {});
      }
    } else {
      vid.src = url;
      vid.load();
      vid.play().catch(() => {});
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [url, streamType]);

  // Fetch user data saver / quality preference once
  useEffect(() => {
    client.get('/data_usage.php?action=summary')
      .then(res => {
        if (res.data.ok) {
          window.__showmineQualityPref = {
            data_saver: res.data.data_saver,
            quality_preference: res.data.quality_preference,
          };
        }
      })
      .catch(() => {});
  }, []);

  // Track approximate data usage during playback
  useEffect(() => {
    if (!movieId) return;
    const KB_PER_SEC = { '360p': 0.12, '480p': 0.2, '720p': 0.37, '1080p': 0.75, '4k': 1.5 };
    const interval = setInterval(() => {
      const vid = videoRef.current;
      if (!vid || vid.paused) return;
      const q = window.__showmineQualityPref?.data_saver ? '360p' : (window.__showmineCurrentQuality || '480p');
      const rate = KB_PER_SEC[q] || 0.2;
      const addedBytes = rate * 1024 * 1024 * 5;
      dataTrackRef.current.bytesEstimate += addedBytes;
      setSessionDataUsed(dataTrackRef.current.bytesEstimate);

      if (dataTrackRef.current.bytesEstimate - dataTrackRef.current.lastSentBytes > 1024 * 1024) {
        const toSend = Math.round(dataTrackRef.current.bytesEstimate);
        client.post('/data_usage.php?action=track', {
          movie_id: movieId,
          bytes: toSend,
          quality: q,
          completed: 0,
        }).catch(() => {});
        dataTrackRef.current.lastSentBytes = dataTrackRef.current.bytesEstimate;
      }
      const playedSeconds = dataTrackRef.current.bytesEstimate / (0.2 * 1024 * 1024) * 5;
      if (isAdMobAvailable() && playedSeconds - dataTrackRef.current.lastMidroll >= 1200) {
        dataTrackRef.current.lastMidroll = playedSeconds;
        const vid2 = videoRef.current;
        if (vid2) vid2.pause();
        showInterstitial(() => {
          const vid3 = videoRef.current;
          if (vid3) vid3.play().catch(() => {});
        });
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      if (dataTrackRef.current.bytesEstimate > 0) {
        client.post('/data_usage.php?action=track', {
          movie_id: movieId,
          bytes: Math.round(dataTrackRef.current.bytesEstimate),
          quality: window.__showmineCurrentQuality || '480p',
          completed: 0,
        }).catch(() => {});
      }
    };
  }, [movieId]);

  // Video events
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrentTime(vid.currentTime);
    const onMeta = () => { setDuration(vid.duration); setLoading(false); };
    const onWait = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    vid.addEventListener('play', onPlay);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('timeupdate', onTime);
    vid.addEventListener('loadedmetadata', onMeta);
    vid.addEventListener('waiting', onWait);
    vid.addEventListener('canplay', onCanPlay);
    return () => {
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('timeupdate', onTime);
      vid.removeEventListener('loadedmetadata', onMeta);
      vid.removeEventListener('waiting', onWait);
      vid.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  const showControlsTemp = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); } else { vid.pause(); }
    showControlsTemp();
  };

  const seek = (secs) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + secs));
    setShowSkip(secs > 0 ? 'forward' : 'backward');
    setTimeout(() => setShowSkip(null), 800);
    showControlsTemp();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      el?.requestFullscreen?.() || el?.webkitRequestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
      setFullscreen(false);
    }
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${m}:${String(sec).padStart(2,'0')}`;
  };

  const onTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
      width: containerRef.current?.offsetWidth || 300,
    };
  };

  const onTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const { x, y, time, width } = touchStartRef.current;
    const dx = e.changedTouches[0].clientX - x;
    const dy = e.changedTouches[0].clientY - y;
    const dt = Date.now() - time;
    const isLeft = x < width / 2;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40 && dt < 300) {
      seek(dx > 0 ? 10 : -10);
      return;
    }

    if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) {
      const delta = dy / 200;
      if (isLeft) {
        const newB = Math.max(0.1, Math.min(1, brightness - delta));
        setBrightness(newB);
        setShowBrightness(true);
        setTimeout(() => setShowBrightness(false), 1500);
      } else {
        const vid = videoRef.current;
        if (vid) {
          const newV = Math.max(0, Math.min(1, volume - delta));
          vid.volume = newV;
          setVolume(newV);
          setShowVolume(true);
          setTimeout(() => setShowVolume(false), 1500);
        }
      }
      return;
    }

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) showControlsTemp();
    touchStartRef.current = null;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', width: '100%', background: '#000',
        aspectRatio: '16/9', maxHeight: '82vh', overflow: 'hidden',
        filter: `brightness(${brightness})`,
        userSelect: 'none', touchAction: 'none'
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseMove={showControlsTemp}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        playsInline
        controlsList="nodownload noremoteplayback"
        onContextMenu={e => e.preventDefault()}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
      />

      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(255,255,255,.15)', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, zIndex: 5 }}>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem' }}>{error}</p>
        </div>
      )}

      {showSkip && (
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          [showSkip === 'forward' ? 'right' : 'left']: '15%',
          zIndex: 6, background: 'rgba(0,0,0,.5)', borderRadius: '50%',
          width: 64, height: 64, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2
        }}>
          {showSkip === 'forward'
            ? <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"/></svg>
            : <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M18.41 7.41L13.82 12l4.59 4.59L17 18l-6-6 6-6zM8 6H6v12h2z"/></svg>
          }
          <span style={{ color: '#fff', fontSize: '.65rem', fontWeight: 700 }}>10s</span>
        </div>
      )}

      {showVolume && (
        <div style={{ position: 'absolute', right: '10%', top: '50%', transform: 'translateY(-50%)', zIndex: 6, background: 'rgba(0,0,0,.6)', borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
          <div style={{ height: 80, width: 4, background: 'rgba(255,255,255,.2)', borderRadius: 2, position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 0, width: '100%', background: '#e50914', borderRadius: 2, height: `${volume * 100}%` }} />
          </div>
          <span style={{ color: '#fff', fontSize: '.7rem', fontWeight: 700 }}>{Math.round(volume * 100)}%</span>
        </div>
      )}

      {showBrightness && (
        <div style={{ position: 'absolute', left: '10%', top: '50%', transform: 'translateY(-50%)', zIndex: 6, background: 'rgba(0,0,0,.6)', borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <div style={{ height: 80, width: 4, background: 'rgba(255,255,255,.2)', borderRadius: 2, position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 0, width: '100%', background: '#e50914', borderRadius: 2, height: `${brightness * 100}%` }} />
          </div>
          <span style={{ color: '#fff', fontSize: '.7rem', fontWeight: 700 }}>{Math.round(brightness * 100)}%</span>
        </div>
      )}

      <div style={{ position: 'absolute', inset: 0, zIndex: 4, opacity: showControls ? 1 : 0, transition: 'opacity .25s', pointerEvents: showControls ? 'all' : 'none', background: showControls ? 'linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 30%, transparent 70%, rgba(0,0,0,.6) 100%)' : 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={(e) => { e.stopPropagation(); onBack?.(); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.95rem', fontWeight: 700, color: '#fff' }}>{title}</span>
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.8rem', fontWeight: 900, letterSpacing: '.1em', color: '#e50914', opacity: .85 }}>SHOWMINE</div>
        </div>

        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: 40 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => seek(-10)} style={{ background: 'rgba(0,0,0,.3)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M12.5 3C7.81 3 4 6.81 4 11.5S7.81 20 12.5 20c4.69 0 8.5-3.81 8.5-8.5 0-.34-.02-.68-.06-1.01l1.77-1.77C23.19 9.9 23.5 10.68 23.5 11.5 23.5 17.3 18.8 22 13 22S2.5 17.3 2.5 11.5 7.2 1 13 1c2.4 0 4.6.85 6.33 2.26L17.5 5.09A8.46 8.46 0 0012.5 3z"/><text x="7" y="15" fill="white" fontSize="6" fontWeight="bold">10</text></svg>
          </button>
          <button onClick={togglePlay} style={{ background: 'rgba(229,9,20,.9)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(229,9,20,.5)' }}>
            {playing
              ? <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            }
          </button>
          <button onClick={() => seek(10)} style={{ background: 'rgba(0,0,0,.3)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M11.5 3C16.19 3 20 6.81 20 11.5S16.19 20 11.5 20C6.81 20 3 16.19 3 11.5c0-.34.02-.68.06-1.01L1.29 8.72C.81 9.9.5 10.68.5 11.5.5 17.3 5.2 22 11 22s10.5-4.7 10.5-10.5S16.8 1 11 1c-2.4 0-4.6.85-6.33 2.26L6.5 5.09A8.46 8.46 0 0111.5 3z"/><text x="7" y="15" fill="white" fontSize="6" fontWeight="bold">10</text></svg>
          </button>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 14px' }} onClick={e => e.stopPropagation()}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>{formatTime(currentTime)}</span>
              <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>{formatTime(duration)}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,.2)', borderRadius: 2, cursor: 'pointer', position: 'relative' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                const vid = videoRef.current;
                if (vid) vid.currentTime = pct * vid.duration;
              }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, background: '#e50914', borderRadius: 2, transition: 'width .1s' }} />
              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: `${progress}%`, marginLeft: -6, width: 12, height: 12, borderRadius: '50%', background: '#e50914', boxShadow: '0 0 6px rgba(229,9,20,.8)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => { const vid = videoRef.current; if (vid) { vid.muted = !vid.muted; setMuted(!muted); } }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                {muted || volume === 0
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
                }
              </button>
              <input type="range" min="0" max="1" step="0.05" value={volume}
                onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; }}
                style={{ width: 70, accentColor: '#e50914', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {sessionDataUsed > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '3px 8px', fontSize: '.65rem', color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                  {(sessionDataUsed / (1024*1024)).toFixed(1)} MB
                </div>
              )}
              {levels.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowQuality(q => !q)} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', cursor: 'pointer', borderRadius: 6, padding: '3px 8px', fontSize: '.7rem', fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.04em' }}>{quality}</button>
                  {showQuality && (
                    <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 8, background: '#161616', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, overflow: 'hidden', minWidth: 80 }}>
                      <button onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = -1; setQuality('Auto'); setShowQuality(false); window.__showmineCurrentQuality = 'auto'; }} style={{ display: 'block', width: '100%', padding: '8px 12px', background: quality === 'Auto' ? 'rgba(229,9,20,.15)' : 'none', border: 'none', color: quality === 'Auto' ? '#e50914' : '#fff', cursor: 'pointer', fontSize: '.78rem', textAlign: 'left' }}>Auto</button>
                      {levels.map(l => (
                        <button key={l.id} onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = l.id; setQuality(l.label); setShowQuality(false); window.__showmineCurrentQuality = l.label; }} style={{ display: 'block', width: '100%', padding: '8px 12px', background: quality === l.label ? 'rgba(229,9,20,.15)' : 'none', border: 'none', color: quality === l.label ? '#e50914' : '#fff', cursor: 'pointer', fontSize: '.78rem', textAlign: 'left' }}>{l.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                {fullscreen
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// AD PLAYER
// ─────────────────────────────────────────────
function AdPlayer({ ad, onFinish, movieId }) {
  const videoRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(ad.max_length || 30);
  const [canSkip, setCanSkip] = useState(false);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !ad.video_url) { onFinish(); return; }
    vid.src = ad.video_url;
    vid.load();
    vid.play().catch(() => { vid.muted = true; vid.play().catch(() => onFinish()); });
    const maxLen = ad.max_length || 30;
    const skipAt = ad.skip_after || 10;

    const onTime = () => {
      const remaining = Math.max(0, Math.ceil(maxLen - vid.currentTime));
      setTimeLeft(remaining);
      if (vid.currentTime >= skipAt) setCanSkip(true);
      if (!tracked && vid.currentTime / maxLen >= 0.8) {
        setTracked(true);
        trackAd(true);
      }
      if (vid.currentTime >= maxLen) finishAd();
    };

    const finishAd = () => { if (!tracked) trackAd(false); onFinish(); };
    vid.addEventListener('timeupdate', onTime);
    vid.addEventListener('ended', finishAd);
    vid.addEventListener('error', onFinish);
    return () => {
      vid.removeEventListener('timeupdate', onTime);
      vid.removeEventListener('ended', finishAd);
      vid.removeEventListener('error', onFinish);
    };
  }, []);

  const trackAd = (completed) => {
    const vid = videoRef.current;
    fetch(`${API_BASE}/ads.php?action=track`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ad_id: ad.id, movie_id: movieId, secs: Math.floor(vid?.currentTime || 0), completed })
    }).catch(() => {});
  };

  const finishAd = () => { trackAd(false); onFinish(); };
  const maxLen = ad.max_length || 30;
  const skipAt = ad.skip_after || 10;
  const elapsed = maxLen - timeLeft;

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: '82vh', background: '#000' }}>
      <video ref={videoRef} playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        onContextMenu={e => e.preventDefault()}
      />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,.7)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Advertisement</span>
        <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>{timeLeft}s</span>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,.15)', zIndex: 10 }}>
        <div style={{ height: '100%', background: '#e50914', width: `${(elapsed / maxLen) * 100}%`, transition: 'width .5s linear' }} />
      </div>
      {canSkip && ad.skippable ? (
        <button onClick={finishAd} style={{ position: 'absolute', bottom: 50, right: 16, zIndex: 10, background: 'rgba(0,0,0,.8)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '8px 16px', borderRadius: 6, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.85rem', fontWeight: 800, letterSpacing: '.04em', cursor: 'pointer' }}>Skip Ad ›</button>
      ) : ad.skippable ? (
        <div style={{ position: 'absolute', bottom: 50, right: 16, zIndex: 10, background: 'rgba(0,0,0,.7)', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.6)', padding: '8px 16px', borderRadius: 6, fontSize: '.82rem' }}>Skip in {Math.max(0, skipAt - elapsed)}s</div>
      ) : null}
      {ad.click_url && <a href={ad.click_url} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', inset: '40px 100px 40px 0', zIndex: 5, display: 'block' }} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// WATCH PAGE
// ─────────────────────────────────────────────
export default function Watch() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [episodeUrl, setEpisodeUrl] = useState(null);
  const [ad, setAd] = useState(null);
  const [showAd, setShowAd] = useState(false);
  const [error, setError] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPlaying(false);
    setData(null);
    setError('');
    setEpisodeUrl(null);
    client.get(`/movies.php?action=watch&slug=${slug}`)
      .then(res => {
        if (res.data.ok) {
          setData(res.data);
          client.get(`/movies.php?action=watchlist_check&movie_id=${res.data.movie?.id}`)
            .then(r => { if (r.data.ok) setInWatchlist(r.data.in_watchlist); })
            .catch(() => {});
        } else {
          setError(res.data.error || 'Movie not found');
        }
      })
      .catch(() => setError('Failed to load movie'))
      .finally(() => setLoading(false));

    // Fetch ad — absolute URL for Capacitor
    fetch(`${API_BASE}/ads.php?action=get`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.ok && d.ad) setAd(d.ad); })
      .catch(() => {});
  }, [slug]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', background: '#000' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ color: 'rgba(255,255,255,.5)' }}>{error}</p>
      <button onClick={() => navigate('/')} style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: 8, padding: '.75rem 1.5rem', cursor: 'pointer', fontWeight: 700 }}>Go Home</button>
    </div>
  );

  const { movie, access, play_url, stream_type, related } = data;
  const ytId = stream_type === 'youtube' ? getYouTubeId(play_url) : '';

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>

      {!playing ? (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: '82vh', background: '#000', overflow: 'hidden' }}>
          {movie.banner_image && (
            <img src={movie.banner_image} alt={movie.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.9) 0%, rgba(0,0,0,.2) 50%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem 24px 1.5rem' }}>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 'clamp(1.6rem,4vw,2.8rem)', fontWeight: 900, marginBottom: '.4rem' }}>{movie.title}</h1>
            <div style={{ display: 'flex', gap: '.65rem', marginBottom: '1rem', flexWrap: 'wrap', fontSize: '.77rem', color: 'rgba(255,255,255,.6)' }}>
              {movie.release_year && <span>{movie.release_year}</span>}
              {movie.duration_mins > 0 && <span>{movie.duration_mins} min</span>}
              {movie.age_rating && <span style={{ border: '1px solid rgba(255,255,255,.3)', padding: '1px 6px', borderRadius: 3 }}>{movie.age_rating}</span>}
              {movie.genre_names && <span style={{ color: 'rgba(255,255,255,.4)' }}>{movie.genre_names.split(',')[0]}</span>}
            </div>
            {access?.ok ? (
              <button onClick={() => {
                const startPlay = () => { setPlaying(true); if (ad) setShowAd(true); };
                if (isAdMobAvailable()) {
                  showInterstitial(startPlay);
                } else {
                  startPlay();
                }
              }} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#e50914', color: '#fff', border: 'none', borderRadius: 8,
                padding: '.82rem 1.8rem', fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1rem', fontWeight: 900, letterSpacing: '.06em',
                textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(229,9,20,.45)'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                START WATCHING
              </button>
            ) : (
              <button onClick={() => navigate('/subscribe')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#e50914', color: '#fff', border: 'none', borderRadius: 8,
                padding: '.82rem 1.8rem', fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1rem', fontWeight: 900, cursor: 'pointer'
              }}>🔒 Subscribe to Watch</button>
            )}
          </div>
        </div>
      ) : showAd && ad ? (
        <AdPlayer
          ad={ad}
          movieId={data?.movie?.id}
          onFinish={() => { setShowAd(false); }}
        />
      ) : stream_type === 'youtube' && ytId ? (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: '82vh', background: '#000' }}>
          <iframe key={ytId}
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 220, height: 50, zIndex: 10 }} />
        </div>
      ) : (
        <ShowminePlayer
          url={episodeUrl || play_url}
          streamType={episodeUrl ? (episodeUrl.endsWith('.m3u8') ? 'hls' : 'mp4') : stream_type}
          title={movie.title}
          onBack={() => setPlaying(false)}
          movieId={movie.id}
        />
      )}

      <div style={{ maxWidth: 960, padding: '1.2rem 20px 0' }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '.5rem' }}>{movie.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', flexWrap: 'wrap', fontSize: '.77rem', color: 'rgba(255,255,255,.5)', marginBottom: '1rem' }}>
          {movie.release_year && <span>{movie.release_year}</span>}
          {movie.duration_mins > 0 && <><span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'inline-block' }} /><span>{movie.duration_mins} min</span></>}
          {movie.age_rating && <><span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'inline-block' }} /><span style={{ border: '1px solid rgba(255,255,255,.2)', padding: '1px 5px', borderRadius: 3, fontSize: '.65rem' }}>{movie.age_rating}</span></>}
          {movie.language && <><span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'inline-block' }} /><span>{movie.language}</span></>}
          {movie.genre_names && <><span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'inline-block' }} /><span style={{ color: 'rgba(255,255,255,.3)' }}>{movie.genre_names}</span></>}
        </div>

        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          {access?.ok && !playing && (
            <button onClick={() => setPlaying(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '.42rem .9rem', background: 'rgba(229,9,20,.1)',
              border: '1px solid rgba(229,9,20,.25)', borderRadius: 8,
              color: '#ff6b6b', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer'
            }}>▶ Watch Now</button>
          )}
          <button onClick={async () => {
            const action = inWatchlist ? 'watchlist_remove' : 'watchlist_add';
            await client.post(`/movies.php?action=${action}`, { movie_id: movie.id });
            setInWatchlist(w => !w);
          }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '.42rem .9rem',
            background: inWatchlist ? 'rgba(34,197,94,.1)' : 'rgba(255,255,255,.06)',
            border: `1px solid ${inWatchlist ? 'rgba(34,197,94,.25)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 8, color: inWatchlist ? '#22c55e' : 'rgba(255,255,255,.8)',
            fontSize: '.78rem', fontWeight: 600, cursor: 'pointer'
          }}>{inWatchlist ? '✓ In My List' : '+ My List'}</button>
          <button onClick={() => {
            const url = `https://v2.showmine.ng/watch/${movie.slug}`;
            if (navigator.share) navigator.share({ title: movie.title, url });
            else { navigator.clipboard?.writeText(url); alert('Link copied!'); }
          }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '.42rem .9rem', background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)', borderRadius: 8,
            color: 'rgba(255,255,255,.8)', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer'
          }}>↗ Share</button>
        </div>

        {movie.short_desc && <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '.86rem', lineHeight: 1.75, maxWidth: 680, marginBottom: '1rem' }}>{movie.short_desc}</p>}
        {movie.cast_names && <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', marginBottom: '.3rem' }}><strong style={{ color: 'rgba(255,255,255,.7)' }}>Cast:</strong> {movie.cast_names}</p>}
        {movie.director && <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', marginBottom: '1.5rem' }}><strong style={{ color: 'rgba(255,255,255,.7)' }}>Director:</strong> {movie.director}</p>}
      </div>

      {data?.episodes?.length > 0 && (
        <div style={{ maxWidth: 960, padding: '1rem 20px 0' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 800, marginBottom: '.75rem' }}>Episodes</div>
          {data.episodes.map(ep => (
            <div key={ep.id}
              onClick={() => {
                const url = ep.stream_720p || ep.stream_480p || ep.stream_360p;
                if (url) { setEpisodeUrl(url); setPlaying(true); }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, marginBottom: 6, cursor: 'pointer', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
              {ep.thumbnail
                ? <img src={ep.thumbnail} style={{ width: 80, height: 46, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} alt="" />
                : <div style={{ width: 80, height: 46, background: '#1a1a1a', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.3)', fontSize: '.7rem', fontWeight: 700 }}>EP {ep.episode_number}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'rgba(255,255,255,.85)', marginBottom: 3 }}>E{ep.episode_number}: {ep.title}</div>
                <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)' }}>{ep.duration_mins ? `${ep.duration_mins} min` : ''} {ep.air_date ? `· ${ep.air_date}` : ''}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'rgba(255,255,255,.3)', flexShrink: 0 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          ))}
        </div>
      )}

      {related?.length > 0 && (
        <div style={{ marginTop: '1rem', paddingBottom: '2rem' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 800, padding: '0 20px .5rem' }}>More Like This</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 20px 8px', scrollbarWidth: 'none' }}>
            {related.map(m => <MovieCard key={m.id} movie={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}