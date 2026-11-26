import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  downloadsSupported, listDownloads, onDownloadChange, removeDownload, retryDownload,
  playDownload, renewLicences, fmtBytes, fmtExpiry,
} from '../utils/downloads';
import { DlIcon } from '../components/DownloadButton';
import { useOnline } from '../components/OfflineGate';

const COND = "'Barlow Condensed', sans-serif";

export default function Downloads() {
  const navigate = useNavigate();
  const online = useOnline();
  const [items, setItems] = useState([]);
  const [free, setFree] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(null);

  const refresh = useCallback(async () => {
    const r = await listDownloads();
    setItems(r.items); setFree(r.freeBytes); setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
    if (online) renewLicences().then(refresh);
    const off = onDownloadChange(d => setItems(list => {
      const i = list.findIndex(x => x.key === d.key);
      if (i < 0) { refresh(); return list; }
      const copy = list.slice(); copy[i] = { ...copy[i], ...d, poster: d.poster || copy[i].poster }; return copy;
    }));
    return off;
  }, [online, refresh]);

  const play = async (d) => {
    setMsg('');
    const r = await playDownload(d);
    if (!r.ok) setMsg(r.error);
  };

  const used = items.reduce((s, d) => s + (d.bytes || 0), 0);

  if (!downloadsSupported()) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 340 }}>
          <div style={{ color: '#e50914', marginBottom: 12, display: 'flex', justifyContent: 'center' }}><DlIcon size={34} /></div>
          <h2 style={{ fontFamily: COND, fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Downloads live in the app</h2>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.88rem', lineHeight: 1.6 }}>Get Showmine TV on Android to download movies and episodes and watch them without internet.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '18px 16px 100px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: COND, fontSize: '.66rem', fontWeight: 800, letterSpacing: '.2em', color: '#e50914' }}>OFFLINE</div>
            <h1 style={{ fontFamily: COND, fontSize: '1.9rem', fontWeight: 900, margin: 0 }}>My Downloads</h1>
          </div>
          <div style={{ textAlign: 'right', fontSize: '.72rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.5 }}>
            {items.length}/10 titles · {fmtBytes(used)}<br />{fmtBytes(free)} free on phone
          </div>
        </div>

        {!online && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(250,204,21,.08)', border: '1px solid rgba(250,204,21,.25)', color: '#fde68a', borderRadius: 12, padding: '10px 12px', fontSize: '.8rem', marginBottom: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>
            You’re offline. Your downloads still play.
          </div>
        )}
        {msg && <div style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.3)', color: '#ff8080', borderRadius: 12, padding: '10px 12px', fontSize: '.82rem', marginBottom: 14 }}>{msg}</div>}

        {loaded && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'rgba(255,255,255,.5)' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'rgba(255,255,255,.6)' }}><DlIcon size={30} /></div>
            <div style={{ fontFamily: COND, fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>Nothing downloaded yet</div>
            <p style={{ fontSize: '.85rem', lineHeight: 1.6, maxWidth: 320, margin: '0 auto 18px' }}>Tap Download on any movie or episode to watch it later without internet.</p>
            {online && <button onClick={() => navigate('/browse')} style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 800, cursor: 'pointer' }}>Find something to watch</button>}
          </div>
        )}

        {items.map(d => {
          const busy = d.status === 'queued' || d.status === 'downloading';
          const expired = d.status === 'done' && d.expires <= Date.now();
          return (
            <div key={d.key} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, borderRadius: 14, marginBottom: 10, background: '#0f0f12', border: '1px solid rgba(255,255,255,.07)' }}>
              <button onClick={() => d.status === 'done' && play(d)} style={{ position: 'relative', width: 128, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#1a1a1e', border: 'none', padding: 0, cursor: d.status === 'done' ? 'pointer' : 'default' }}>
                {d.poster && <img src={d.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: expired ? .4 : 1 }} />}
                {d.status === 'done' && !expired && (
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.25)' }}>
                    <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: '1.5px solid rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                    </span>
                  </span>
                )}
                {busy && <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: 'rgba(255,255,255,.15)' }}><span style={{ display: 'block', height: '100%', width: `${d.progress || 0}%`, background: '#e50914', transition: 'width .3s' }} /></span>}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '.9rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.title}</div>
                <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', marginTop: 4 }}>
                  {busy && (d.status === 'queued' ? 'Waiting…' : `Downloading · ${d.progress || 0}%`)}
                  {d.status === 'failed' && <span style={{ color: '#ff7b7b' }}>{d.error || 'Download failed'}</span>}
                  {d.status === 'done' && <>{d.quality === '720p' ? 'HD' : 'SD'} · {fmtBytes(d.bytes)} · <span style={{ color: expired ? '#fbbf24' : 'inherit' }}>{fmtExpiry(d.expires)}</span></>}
                </div>
                {d.status === 'failed' && online && (
                  <button onClick={() => retryDownload(d).then(refresh)} style={{ marginTop: 6, background: 'none', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: '.72rem', fontWeight: 700, cursor: 'pointer' }}>Try again</button>
                )}
              </div>
              <button aria-label="Delete download" onClick={() => setConfirm(d)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {busy
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>}
              </button>
            </div>
          );
        })}

        {items.length > 0 && (
          <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)', textAlign: 'center', lineHeight: 1.6, marginTop: 18 }}>
            Downloads are encrypted and play only inside Showmine on this phone. They work offline for up to 10 days, then connect once to renew.
          </p>
        )}
      </div>

      {confirm && (
        <div onClick={() => setConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#141414', borderRadius: '18px 18px 0 0', padding: '1.4rem 1.2rem calc(1.2rem + env(safe-area-inset-bottom, 0px))', textAlign: 'center' }}>
            <div style={{ fontFamily: COND, fontSize: '1.25rem', fontWeight: 800, marginBottom: 6 }}>{confirm.status === 'done' ? 'Delete this download?' : 'Cancel this download?'}</div>
            <div style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.55)', marginBottom: 16 }}>{confirm.title}</div>
            <button onClick={async () => { const d = confirm; setConfirm(null); await removeDownload(d); refresh(); }} style={{ width: '100%', padding: '.85rem', background: '#e50914', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, marginBottom: 8, cursor: 'pointer' }}>{confirm.status === 'done' ? 'Delete' : 'Cancel download'}</button>
            <button onClick={() => setConfirm(null)} style={{ width: '100%', padding: '.75rem', background: 'none', color: 'rgba(255,255,255,.6)', border: 'none', cursor: 'pointer' }}>Keep</button>
          </div>
        </div>
      )}
    </div>
  );
}
