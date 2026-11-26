import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { shorts as shortsApi, social } from '../api/extras';
import { CommentSheet } from '../components/Comments';
import { RED, Spinner, heading } from '../components/ui';

const NAV_H = 64; // bottom nav height from Layout

function fmt(n) { return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n || 0); }

function RailButton({ label, children, onClick, active }) {
  return (
    <button onClick={onClick} aria-label={label} style={{ background: 'none', border: 'none', color: active ? RED : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: '.72rem', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>
      <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</span>
      {label}
    </button>
  );
}

function ShortItem({ item, active, muted, setMuted, onUpdate }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const viewed = useRef(false);

  // Attach source once (HLS via hls.js where the WebView can't play it natively).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let hls;
    if (item.type === 'hls' && !v.canPlayType('application/vnd.apple.mpegurl') && Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 10 });
      hls.loadSource(item.video_url);
      hls.attachMedia(v);
    } else {
      v.src = item.video_url;
    }
    return () => { hls?.destroy(); };
  }, [item.video_url, item.type]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().then(() => setPaused(false)).catch(() => setPaused(true));
      if (!viewed.current) { viewed.current = true; shortsApi.view(item.id).catch(() => {}); }
    } else {
      v.pause();
    }
  }, [active, item.id]);

  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPaused(false); } else { v.pause(); setPaused(true); }
  };

  const like = async () => {
    onUpdate({ liked: !item.liked, likes: item.likes + (item.liked ? -1 : 1) });
    const r = await social.toggleLike('short', item.id).catch(() => null);
    if (r?.ok) onUpdate({ liked: r.liked, likes: r.count });
  };

  const share = () => {
    const url = item.movie_slug ? `https://v2.showmine.ng/watch/${item.movie_slug}` : 'https://v2.showmine.ng/shorts';
    if (navigator.share) navigator.share({ title: item.title, url }).catch(() => {});
    else navigator.clipboard?.writeText(url);
  };

  return (
    <section style={{ height: `calc(100vh - ${NAV_H}px - env(safe-area-inset-bottom, 0px))`, scrollSnapAlign: 'start', scrollSnapStop: 'always', position: 'relative', background: '#000', overflow: 'hidden' }}>
      <video ref={videoRef} playsInline loop muted={muted} preload="metadata" poster={item.thumbnail_url || undefined}
        onClick={togglePlay}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

      {paused && (
        <div onClick={togglePlay} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="rgba(255,255,255,.85)"><polygon points="7 4 20 12 7 20 7 4" /></svg>
        </div>
      )}

      <button onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute' : 'Mute'} style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', right: 14, background: 'rgba(0,0,0,.4)', border: 'none', color: '#fff', borderRadius: 20, padding: '7px 12px', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}>
        {muted ? '🔇 Tap for sound' : '🔊'}
      </button>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%', background: 'linear-gradient(to top, rgba(0,0,0,.85), transparent)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', right: 10, bottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RailButton label={fmt(item.likes)} onClick={like} active={item.liked}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={item.liked ? RED : 'none'} stroke={item.liked ? RED : '#fff'} strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" /></svg>
        </RailButton>
        <RailButton label={fmt(item.comments)} onClick={() => setShowComments(true)}>
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
        </RailButton>
        <RailButton label="Share" onClick={share}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
        </RailButton>
      </div>

      <div style={{ position: 'absolute', left: 16, right: 80, bottom: 24, color: '#fff' }}>
        <div style={{ ...heading, fontSize: '1.15rem', marginBottom: 4 }}>{item.title}</div>
        {item.caption && <div style={{ fontSize: '.85rem', lineHeight: 1.45, color: 'rgba(255,255,255,.85)', maxHeight: 62, overflow: 'hidden' }}>{item.caption}</div>}
        <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.55)', marginTop: 6 }}>{fmt(item.views)} views</div>
        {item.movie_slug && (
          <button onClick={() => navigate(`/watch/${item.movie_slug}`)} style={{ marginTop: 10, background: RED, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer', ...heading, letterSpacing: '.05em', textTransform: 'uppercase' }}>
            ▶ Watch {item.movie_title || 'full movie'}
          </button>
        )}
      </div>

      <CommentSheet type="short" id={item.id} open={showComments} onClose={() => setShowComments(false)}
        onCount={(n) => onUpdate({ comments: n })} />
    </section>
  );
}

export default function Shorts() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const scroller = useRef(null);

  const load = useCallback(async (p) => {
    setLoading(true);
    try {
      const r = await shortsApi.feed(p);
      if (r.ok) { setItems((prev) => (p === 1 ? r.items : [...prev, ...r.items])); setHasMore(r.has_more); setPage(p); }
      else setError(r.error || 'Could not load shorts');
    } catch { setError('Could not load shorts. Check your connection.'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(1); }, [load]);

  // Which item is on screen?
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== active) setActive(i);
    if (hasMore && !loading && i >= items.length - 3) load(page + 1);
  };

  const update = (idx, patch) => setItems((list) => list.map((x, k) => (k === idx ? { ...x, ...patch } : x)));

  if (error && !items.length) return <div style={{ padding: 40, color: 'rgba(255,255,255,.6)', textAlign: 'center' }}>{error}</div>;
  if (loading && !items.length) return <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;
  if (!items.length) return <div style={{ padding: 40, color: 'rgba(255,255,255,.6)', textAlign: 'center' }}>No shorts yet. Check back soon.</div>;

  return (
    <div ref={scroller} onScroll={onScroll} style={{ height: `calc(100vh - ${NAV_H}px - env(safe-area-inset-bottom, 0px))`, overflowY: 'scroll', scrollSnapType: 'y mandatory', background: '#000', scrollbarWidth: 'none' }}>
      {items.map((item, i) => (
        <ShortItem key={item.id} item={item} active={i === active} muted={muted} setMuted={setMuted} onUpdate={(patch) => update(i, patch)} />
      ))}
    </div>
  );
}
