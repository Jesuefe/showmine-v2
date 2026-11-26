import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadsSupported, getDownload, startDownload, onDownloadChange, estimateSize } from '../utils/downloads';

const COND = "'Barlow Condensed', sans-serif";

export const DlIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v11"/><polyline points="7 10 12 15 17 10"/><path d="M5 20h14"/>
  </svg>
);
const DoneIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v8"/><polyline points="8 9 12 13 16 9"/><path d="M5 20h14"/><polyline points="15 17 17 19 21 15" stroke="#4ade80"/>
  </svg>
);

function Ring({ pct, size = 22 }) {
  const r = (size - 4) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="2.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e50914" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(3, pct) / 100)} style={{ transition: 'stroke-dashoffset .3s' }} />
    </svg>
  );
}

/** Tracks one title's download state on this phone. */
export function useDownload(type, id) {
  const [d, setD] = useState(null);
  useEffect(() => {
    if (!downloadsSupported() || !id) return;
    let alive = true;
    getDownload(type, id).then(x => { if (alive) setD(x); });
    const off = onDownloadChange(x => { if (x.key === `${type}-${id}`) setD(x); });
    return () => { alive = false; off(); };
  }, [type, id]);
  return [d, setD];
}

/** Quality picker + subscribe/limit messages. */
export function DownloadSheet({ item, onClose, onStarted }) {
  const navigate = useNavigate();
  const [quality, setQuality] = useState('480p');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const go = async () => {
    setBusy(true); setErr(null);
    const r = await startDownload({ type: item.type, id: item.id, quality });
    setBusy(false);
    if (r.ok) { onStarted?.(); onClose(); } else setErr(r);
  };
  const opt = (q, label, note) => (
    <button key={q} onClick={() => setQuality(q)} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer',
      padding: '14px 14px', borderRadius: 12, marginBottom: 8, color: '#fff',
      background: quality === q ? 'rgba(229,9,20,.1)' : 'rgba(255,255,255,.04)',
      border: `1.5px solid ${quality === q ? '#e50914' : 'rgba(255,255,255,.08)'}`,
    }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${quality === q ? '#e50914' : 'rgba(255,255,255,.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {quality === q && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e50914' }} />}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontWeight: 800, fontSize: '.92rem' }}>{label}</span>
        <span style={{ display: 'block', fontSize: '.75rem', color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{note}</span>
      </span>
      <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.55)' }}>{estimateSize(item.durationMins, q)}</span>
    </button>
  );
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#141414', borderRadius: '18px 18px 0 0', borderTop: '1px solid rgba(255,255,255,.1)', padding: '1.3rem 1.2rem calc(1.2rem + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(255,255,255,.2)', margin: '0 auto 1rem' }} />
        <div style={{ fontFamily: COND, fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>Download to watch offline</div>
        <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '1rem', lineHeight: 1.5 }}>{item.title}</div>
        {err?.code === 'subscribe' ? (
          <>
            <p style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.6, margin: '0 0 1rem' }}>{err.error}</p>
            <button onClick={() => { onClose(); navigate('/subscribe'); }} style={{ width: '100%', padding: '.9rem', background: '#e50914', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '.95rem', cursor: 'pointer' }}>See plans</button>
          </>
        ) : (
          <>
            {opt('480p', 'Standard', 'Saves data and storage')}
            {opt('720p', 'High (HD)', 'Sharper picture, about twice the size')}
            {err && (
              <div style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.3)', color: '#ff7b7b', borderRadius: 10, padding: '10px 12px', fontSize: '.82rem', margin: '4px 0 10px' }}>
                {err.error}
                {err.code === 'limit' && <button onClick={() => { onClose(); navigate('/downloads'); }} style={{ display: 'block', marginTop: 6, background: 'none', border: 'none', color: '#fff', fontWeight: 800, padding: 0, cursor: 'pointer' }}>Manage downloads →</button>}
              </div>
            )}
            <button onClick={go} disabled={busy} style={{ width: '100%', padding: '.9rem', marginTop: 4, background: '#e50914', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '.95rem', cursor: 'pointer', opacity: busy ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <DlIcon size={18} />{busy ? 'Starting…' : 'Download'}
            </button>
            <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              Plays only inside Showmine on this phone · works offline for 10 days, then connect once to renew
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Big round action button for the title page. */
export function DownloadAction({ type, id, title, durationMins, ActionBtn }) {
  const navigate = useNavigate();
  const [d] = useDownload(type, id);
  const [sheet, setSheet] = useState(false);
  if (!downloadsSupported()) return null;
  const busy = d && (d.status === 'queued' || d.status === 'downloading');
  const done = d && d.status === 'done';
  const label = done ? 'Downloaded' : busy ? `${d.progress || 0}%` : d?.status === 'failed' ? 'Retry' : 'Download';
  const icon = busy ? <Ring pct={d.progress || 0} /> : done ? <DoneIcon /> : <DlIcon />;
  return (
    <>
      <ActionBtn label={label} active={done} color="#4ade80" icon={icon}
        onClick={() => (done || busy || d?.status === 'failed') ? navigate('/downloads') : setSheet(true)} />
      {sheet && <DownloadSheet item={{ type, id, title, durationMins }} onClose={() => setSheet(false)} />}
    </>
  );
}

/** Small icon button for an episode row. */
export function EpisodeDownload({ id, title, durationMins }) {
  const navigate = useNavigate();
  const [d] = useDownload('episode', id);
  const [sheet, setSheet] = useState(false);
  if (!downloadsSupported()) return null;
  const busy = d && (d.status === 'queued' || d.status === 'downloading');
  const done = d && d.status === 'done';
  return (
    <>
      <button aria-label="Download episode" onClick={(e) => { e.stopPropagation(); (done || busy || d?.status === 'failed') ? navigate('/downloads') : setSheet(true); }} style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: done ? '#4ade80' : 'rgba(255,255,255,.8)',
      }}>
        {busy ? <Ring pct={d.progress || 0} size={20} /> : done ? <DoneIcon size={17} /> : <DlIcon size={17} />}
      </button>
      {sheet && <div onClick={e => e.stopPropagation()}><DownloadSheet item={{ type: 'episode', id, title, durationMins }} onClose={() => setSheet(false)} /></div>}
    </>
  );
}
