import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Hls from 'hls.js';
import client from '../api/client';
import Navbar from '../components/Navbar';

const CATEGORIES = [
  { id: 'all',           label: 'All' },
  { id: 'news',          label: 'News' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'sports',        label: 'Sports' },
  { id: 'music',         label: 'Music' },
  { id: 'religious',     label: 'Religious' },
  { id: 'other',         label: 'Other' },
];

export default function Live() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [streams, setStreams] = useState([]);
  const [watching, setWatching] = useState(null);
  const [loading, setLoading] = useState(true);
  const hlsRef = useRef(null);
  const videoRef = useRef(null);

  const cat = searchParams.get('cat') || 'all';
  const watchId = parseInt(searchParams.get('id') || '0');

  useEffect(() => {
    client.get('/live.php')
      .then(res => {
        if (res.data.ok) {
          setStreams(res.data.streams);
          // Auto-select channel
          const target = watchId
            ? res.data.streams.find(s => s.id === watchId)
            : res.data.streams.find(s => s.is_live) || res.data.streams[0];
          if (target) setWatching(target);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!watching) return;
    if (watching.youtube_video_id) return; // iframe handles it
    if (!watching.stream_url) return;
    // HLS stream
    const vid = videoRef.current;
    if (!vid) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(watching.stream_url);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => vid.play().catch(() => {}));
      hlsRef.current = hls;
    } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
      vid.src = watching.stream_url;
      vid.play().catch(() => {});
    }
    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [watching]);

  const selectChannel = (stream) => {
    setWatching(stream);
    const p = new URLSearchParams(searchParams);
    p.set('id', stream.id);
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = cat === 'all' ? streams : streams.filter(s => s.category === cat);

  const streamType = watching
    ? watching.youtube_video_id ? 'youtube'
    : watching.stream_url ? 'hls'
    : 'offline'
    : 'offline';

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: '5rem' }}>
      <Navbar />
      <div style={{ paddingTop: 60 }}>
        <div style={{ display: 'flex', gap: 0, maxWidth: 1400, margin: '0 auto' }}>

          {/* ── MAIN CONTENT ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Player */}
            <div style={{
              position: 'relative', width: '100%',
              aspectRatio: '16/9', background: '#000', overflow: 'hidden'
            }}>
              {!watching || streamType === 'offline' ? (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 14, background: 'radial-gradient(ellipse at center,#1a1a1a 0%,#000 100%)'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(255,255,255,.2)" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="2"/>
                    <path d="M16.24 7.76a6 6 0 010 8.49m-8.48 0a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/>
                  </svg>
                  <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.3)' }}>
                    {watching ? 'Channel Offline' : 'Select a channel'}
                  </p>
                </div>
              ) : streamType === 'youtube' ? (
                <iframe
                  key={watching.youtube_video_id}
                  src={`https://www.youtube.com/embed/${watching.youtube_video_id}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video ref={videoRef} controls playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
              )}

              {/* Transparent click blocker over YouTube logo */}
              {streamType === 'youtube' && (
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 220, height: 50, zIndex: 10 }} />
              )}
            </div>

            {/* Channel info */}
            {watching && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  {watching.channel_icon && (
                    <img src={watching.channel_icon} alt=""
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      onError={e => e.target.style.display = 'none'} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '1.05rem', fontWeight: 800
                      }}>{watching.title}</span>
                      {watching.is_live && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#e50914', color: '#fff',
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: '.6rem', fontWeight: 800, letterSpacing: '.1em',
                          padding: '2px 7px', borderRadius: 4
                        }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: '50%', background: '#fff',
                            animation: 'pulse 1.2s ease infinite'
                          }} />
                          LIVE
                        </span>
                      )}
                      {streamType === 'youtube' && (
                        <span style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontSize: '.55rem', fontWeight: 800,
                          background: 'rgba(255,255,255,.06)',
                          border: '1px solid rgba(255,255,255,.1)',
                          color: 'rgba(255,255,255,.4)',
                          padding: '2px 8px', borderRadius: 4
                        }}>Free · External Stream</span>
                      )}
                    </div>
                    {watching.description && (
                      <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
                        {watching.description}
                      </p>
                    )}
                  </div>
                </div>
                {/* Share button */}
                <button onClick={() => {
                  const url = `https://app.showmine.ng/live.php?id=${watching.id}`;
                  if (navigator.share) navigator.share({ title: watching.title, url });
                  else { navigator.clipboard?.writeText(url); alert('Link copied!'); }
                }} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '.42rem .9rem', background: 'rgba(255,255,255,.06)',
                  border: '1px solid rgba(255,255,255,.1)', borderRadius: 8,
                  color: 'rgba(255,255,255,.8)', fontSize: '.78rem',
                  fontWeight: 600, cursor: 'pointer', flexShrink: 0
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share
                </button>
              </div>
            )}

            {/* Mobile channel list */}
            <div style={{ padding: '8px 0' }}>
              {/* Category filter */}
              <div style={{
                display: 'flex', gap: 8, padding: '8px 16px',
                overflowX: 'auto', scrollbarWidth: 'none'
              }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => {
                    const p = new URLSearchParams(searchParams);
                    p.set('cat', c.id);
                    setSearchParams(p);
                  }} style={{
                    flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                    fontSize: '.75rem', fontWeight: 700,
                    border: '1px solid',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    background: cat === c.id ? '#e50914' : 'rgba(255,255,255,.06)',
                    color: cat === c.id ? '#fff' : 'rgba(255,255,255,.5)',
                    borderColor: cat === c.id ? '#e50914' : 'rgba(255,255,255,.1)'
                  }}>{c.label}</button>
                ))}
              </div>

              <div style={{ padding: '4px 16px 8px' }}>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '.65rem', fontWeight: 800, letterSpacing: '.14em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 8
                }}>Channels</p>

                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                    <div style={{ width: 32, height: 32, border: '3px solid #333', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                  </div>
                ) : filtered.map(s => (
                  <div key={s.id} onClick={() => selectChannel(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                      cursor: 'pointer',
                      background: watching?.id === s.id ? 'rgba(229,9,20,.1)' : 'rgba(255,255,255,.03)',
                      border: `1px solid ${watching?.id === s.id ? 'rgba(229,9,20,.3)' : 'rgba(255,255,255,.06)'}`,
                      transition: 'all .15s'
                    }}>
                    {s.channel_icon ? (
                      <img src={s.channel_icon} alt=""
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        onError={e => e.target.style.display = 'none'} />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: 'rgba(255,255,255,.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: '.7rem', fontWeight: 700,
                        color: 'rgba(255,255,255,.4)'
                      }}>{s.title[0]}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '.85rem', fontWeight: 700,
                        color: watching?.id === s.id ? '#fff' : 'rgba(255,255,255,.8)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>{s.title}</div>
                      <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', marginTop: 2 }}>
                        {s.category}
                      </div>
                    </div>
                    {s.is_live && (
                      <span style={{
                        flexShrink: 0, background: '#e50914', color: '#fff',
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '.55rem', fontWeight: 800,
                        padding: '2px 6px', borderRadius: 3
                      }}>LIVE</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
      `}</style>
    </div>
  );
}