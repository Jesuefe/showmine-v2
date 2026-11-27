import { useEffect, useRef, useState } from 'react';
import client from '../api/client';

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SUB_KEY = 'showmine_sub_lang';

/* ── Subtitles: list tracks, fetch VTT as text, attach as a same-origin blob track ── */
export function useSubtitles(videoRef, movieId, episodeId) {
  const [tracks, setTracks] = useState([]);
  const [active, setActive] = useState(null); // track id or null (off)
  const blobRef = useRef(null);

  useEffect(() => {
    const type = episodeId ? 'episode' : 'movie';
    const id = episodeId || movieId;
    setTracks([]); setActive(null);
    if (!id) return;
    let alive = true;
    client.get(`/subtitles.php?action=list&type=${type}&id=${id}`).then(res => {
      if (!alive || !res.data?.ok) return;
      const list = res.data.tracks || [];
      setTracks(list);
      let pref = null;
      try { pref = localStorage.getItem(SUB_KEY); } catch { /* ignore */ }
      if (pref && pref !== 'off') {
        const t = list.find(x => x.lang === pref);
        if (t) setActive(t.id);
      }
    }).catch(() => {});
    return () => { alive = false; };
  }, [movieId, episodeId]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    // remove previous
    vid.querySelectorAll('track[data-sm]').forEach(t => t.remove());
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
    if (active == null) return;
    const t = tracks.find(x => x.id === active);
    if (!t) return;
    let alive = true;
    const type = episodeId ? 'episode' : 'movie';
    client.get(`/subtitles.php?action=vtt&type=${type}&tid=${t.id}`, { responseType: 'text', transformResponse: r => r })
      .then(res => {
        if (!alive || typeof res.data !== 'string' || !res.data.includes('-->')) return;
        const url = URL.createObjectURL(new Blob([res.data], { type: 'text/vtt' }));
        blobRef.current = url;
        const el = document.createElement('track');
        el.kind = 'subtitles'; el.label = t.label; el.srclang = t.lang; el.src = url; el.default = true;
        el.setAttribute('data-sm', '1');
        vid.appendChild(el);
        const show = () => { for (const tt of vid.textTracks) tt.mode = tt.label === t.label ? 'showing' : 'disabled'; };
        el.addEventListener('load', show);
        setTimeout(show, 50);
      }).catch(() => {});
    return () => { alive = false; };
  }, [active, tracks, episodeId, videoRef]);

  const choose = (id) => {
    setActive(id);
    const t = tracks.find(x => x.id === id);
    try { localStorage.setItem(SUB_KEY, t ? t.lang : 'off'); } catch { /* ignore */ }
  };
  return { tracks, active, choose };
}

export const pipSupported = () =>
  typeof document !== 'undefined' && !!document.pictureInPictureEnabled;

export async function togglePiP(video) {
  if (!video) return;
  try {
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await video.requestPictureInPicture();
  } catch { /* unsupported or blocked */ }
}

/* ── Settings popover: speed + subtitles ── */
const row = (on) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%',
  padding: '8px 12px', background: on ? 'rgba(229,9,20,.15)' : 'none', border: 'none',
  color: on ? '#e50914' : '#fff', cursor: 'pointer', fontSize: '.78rem', textAlign: 'left', fontWeight: on ? 700 : 500,
});
const head = { padding: '8px 12px 4px', fontSize: '.6rem', letterSpacing: '.12em', color: 'rgba(255,255,255,.4)', fontWeight: 800, textTransform: 'uppercase' };

export function PlayerSettings({ speed, onSpeed, subs }) {
  const [open, setOpen] = useState(false);
  const hasSubs = subs.tracks.length > 0;
  return (
    <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'center' }}>
      {hasSubs && (
        <button aria-label="Subtitles" onClick={() => subs.choose(subs.active == null ? subs.tracks[0].id : null)}
          style={{ background: 'none', border: 'none', color: subs.active != null ? '#e50914' : '#fff', cursor: 'pointer', display: 'flex' }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M10 10.5a2 2 0 100 3M17 10.5a2 2 0 100 3" /></svg>
        </button>
      )}
      <button aria-label="Playback settings" onClick={() => setOpen(o => !o)}
        style={{ background: speed !== 1 ? 'rgba(229,9,20,.2)' : 'none', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: speed !== 1 ? '2px 6px' : 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        {speed !== 1 && <span style={{ fontSize: '.68rem', fontWeight: 800 }}>{speed}x</span>}
      </button>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 10, background: 'rgba(18,18,18,.97)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, overflow: 'hidden', minWidth: 150, maxHeight: 260, overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,.6)', animation: 'smPop .16s ease-out' }}>
          <div style={head}>Speed</div>
          {SPEEDS.map(s => (
            <button key={s} style={row(speed === s)} onClick={() => { onSpeed(s); setOpen(false); }}>
              <span>{s === 1 ? 'Normal' : `${s}x`}</span>{speed === s && <span>✓</span>}
            </button>
          ))}
          {hasSubs && <>
            <div style={head}>Subtitles</div>
            <button style={row(subs.active == null)} onClick={() => { subs.choose(null); setOpen(false); }}><span>Off</span>{subs.active == null && <span>✓</span>}</button>
            {subs.tracks.map(t => (
              <button key={t.id} style={row(subs.active === t.id)} onClick={() => { subs.choose(t.id); setOpen(false); }}>
                <span>{t.label}</span>{subs.active === t.id && <span>✓</span>}
              </button>
            ))}
          </>}
        </div>
      )}
    </div>
  );
}

/* ── Skip intro ── */
export function SkipIntro({ onSkip, raised }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onSkip(); }}
      style={{ position: 'absolute', right: 18, bottom: raised ? 96 : 28, zIndex: 7, background: 'rgba(20,20,20,.85)', color: '#fff', border: '1.5px solid rgba(255,255,255,.7)', borderRadius: 8, padding: '9px 18px', fontWeight: 800, fontSize: '.82rem', letterSpacing: '.03em', cursor: 'pointer', backdropFilter: 'blur(6px)', transition: 'bottom .25s', animation: 'smPop .25s ease-out', display: 'flex', alignItems: 'center', gap: 8 }}>
      Skip Intro
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20"/><rect x="17" y="4" width="2.5" height="16"/></svg>
    </button>
  );
}

/* ── Next episode countdown ── */
export function NextEpisodeCard({ next, seconds, total, onPlay, onCancel, raised }) {
  const pct = Math.max(0, Math.min(1, 1 - seconds / total));
  return (
    <div onClick={e => e.stopPropagation()}
      style={{ position: 'absolute', right: 16, bottom: raised ? 96 : 24, zIndex: 7, width: 'min(300px, 70%)', background: 'rgba(14,14,14,.92)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, overflow: 'hidden', backdropFilter: 'blur(8px)', boxShadow: '0 12px 40px rgba(0,0,0,.6)', transition: 'bottom .25s', animation: 'smPop .3s ease-out' }}>
      <div style={{ display: 'flex', gap: 10, padding: 10, alignItems: 'center' }}>
        {next.thumbnail
          ? <img src={next.thumbnail} alt="" style={{ width: 84, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
          : <div style={{ width: 84, height: 48, borderRadius: 6, background: '#222', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 800, color: 'rgba(255,255,255,.4)' }}>EP {next.episode_number}</div>}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '.6rem', letterSpacing: '.12em', color: 'rgba(255,255,255,.5)', fontWeight: 800 }}>NEXT EPISODE IN {Math.ceil(seconds)}</div>
          <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>S{next.season_number || 1} E{next.episode_number} · {next.title}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 10px 10px' }}>
        <button onClick={onPlay} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#fff', color: '#000', border: 'none', borderRadius: 7, padding: '8px 0', fontWeight: 800, fontSize: '.78rem', cursor: 'pointer' }}>
          <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, background: 'rgba(229,9,20,.25)', transition: 'width .25s linear' }} />
          <span style={{ position: 'relative' }}>▶ Play now</span>
        </button>
        <button onClick={onCancel} style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 14px', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

export const EXTRAS_CSS = `@keyframes smPop{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:none}}
video::cue{background:rgba(0,0,0,.7);color:#fff;font-family:'Barlow',system-ui,sans-serif;font-size:1.05em;line-height:1.35}`;
