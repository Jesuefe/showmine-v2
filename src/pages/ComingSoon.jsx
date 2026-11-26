import { useState, useEffect } from 'react';
import client from '../api/client';
import { TrailerModal, getYouTubeId } from '../components/WatchDetails';
import { PageHeader } from '../components/ui';

const COND = "'Barlow Condensed', sans-serif";

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function useNow(enabled) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [enabled]);
  return now;
}

function Countdown({ date }) {
  const now = useNow(true);
  const diff = date.getTime() - now;
  if (diff <= 0) return <div style={{ fontFamily: COND, fontWeight: 900, color: '#4ade80', letterSpacing: '.1em' }}>OUT NOW</div>;
  const parts = [
    [Math.floor(diff / 86400000), 'Days'],
    [Math.floor(diff / 3600000) % 24, 'Hrs'],
    [Math.floor(diff / 60000) % 60, 'Min'],
    [Math.floor(diff / 1000) % 60, 'Sec'],
  ];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {parts.map(([v, l]) => (
        <div key={l} style={{ minWidth: 52, textAlign: 'center', padding: '8px 6px', borderRadius: 10, background: 'rgba(0,0,0,.45)', border: '1px solid rgba(255,255,255,.15)', backdropFilter: 'blur(8px)' }}>
          <div style={{ fontFamily: COND, fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>{String(v).padStart(2, '0')}</div>
          <div style={{ fontSize: '.56rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginTop: 3 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function RemindButton({ notified, busy, onClick, big }) {
  return (
    <button onClick={onClick} className="cs-press" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: notified ? 'default' : 'pointer',
      padding: big ? '13px 18px' : '9px 14px', borderRadius: 10, flex: big ? 1 : undefined,
      background: notified ? 'rgba(34,197,94,.14)' : '#fff', color: notified ? '#4ade80' : '#000',
      border: notified ? '1px solid rgba(34,197,94,.4)' : 'none', fontFamily: COND, fontWeight: 900, fontSize: big ? '1rem' : '.85rem', letterSpacing: '.05em', textTransform: 'uppercase',
    }}>
      {notified
        ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Reminder set</>
        : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> {busy ? 'Saving…' : 'Remind me'}</>}
    </button>
  );
}

export default function ComingSoon() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notified, setNotified] = useState({});
  const [counts, setCounts] = useState({});
  const [busy, setBusy] = useState({});
  const [trailer, setTrailer] = useState(null);

  useEffect(() => {
    client.get('/movies.php?action=coming_soon')
      .then(res => {
        if (!res.data.ok) return;
        const list = res.data.movies || [];
        setMovies(list);
        setNotified(Object.fromEntries(list.filter(m => m.user_notified).map(m => [m.id, true])));
        setCounts(Object.fromEntries(list.map(m => [m.id, m.notify_count || 0])));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remind = async (m) => {
    if (notified[m.id] || busy[m.id]) return;
    setBusy(b => ({ ...b, [m.id]: true }));
    try {
      const res = await client.post('/movies.php?action=notify_me', { upcoming_id: m.id });
      if (res.data.ok) {
        setNotified(n => ({ ...n, [m.id]: true }));
        setCounts(c => ({ ...c, [m.id]: (c[m.id] || 0) + 1 }));
        navigator.vibrate?.(15);
      }
    } catch { /* ignore */ }
    setBusy(b => ({ ...b, [m.id]: false }));
  };

  const [hero, ...rest] = movies;
  const heroDate = hero && parseDate(hero.release_date);

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 50 }}>
      {loading ? (
        <div style={{ padding: 16 }}>
          <div className="cs-skel" style={{ height: 420, borderRadius: 18, marginBottom: 16 }} />
          <div className="cs-skel" style={{ height: 120, borderRadius: 14 }} />
        </div>
      ) : !hero ? (
        <>
          <PageHeader title="Coming soon" />
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎬</div>
            <div style={{ fontFamily: COND, fontSize: '1.4rem', fontWeight: 800 }}>New titles are on the way</div>
            <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.5)', marginTop: 6 }}>Check back soon for the next big African premieres.</div>
          </div>
        </>
      ) : (
        <>
          {/* Featured premiere */}
          <div style={{ position: 'relative', minHeight: 480, aspectRatio: '4/5', maxHeight: '80vh', overflow: 'hidden' }}>
            {hero.image && <img src={hero.image} alt={hero.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,#000 0%,rgba(0,0,0,.75) 35%,rgba(0,0,0,.1) 70%,rgba(0,0,0,.5) 100%)' }} />
            <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 18px)', left: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="cs-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#e50914' }} />
              <span style={{ fontFamily: COND, fontSize: '.72rem', fontWeight: 900, letterSpacing: '.22em', color: '#fff' }}>COMING SOON</span>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 20px 22px' }}>
              <div style={{ fontFamily: COND, fontSize: '.75rem', fontWeight: 800, letterSpacing: '.18em', color: '#e50914', marginBottom: 6 }}>
                {hero.genre ? hero.genre.toUpperCase() + ' · ' : ''}{heroDate ? heroDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() : (hero.release_date || 'DATE TBA').toUpperCase()}
              </div>
              <h1 style={{ fontFamily: COND, fontSize: 'clamp(2.2rem,9vw,3.6rem)', fontWeight: 900, lineHeight: .92, margin: '0 0 10px' }}>{hero.title}</h1>
              {hero.description && <p style={{ fontSize: '.86rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.6, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{hero.description}</p>}
              {heroDate && <div style={{ marginBottom: 16 }}><Countdown date={heroDate} /></div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <RemindButton notified={notified[hero.id]} busy={busy[hero.id]} onClick={() => remind(hero)} big />
                {getYouTubeId(hero.trailer_url) && (
                  <button onClick={() => setTrailer(hero)} className="cs-press" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '13px 16px', borderRadius: 10, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontFamily: COND, fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>▶ Trailer</button>
                )}
              </div>
              {counts[hero.id] > 0 && <div style={{ fontSize: '.74rem', color: 'rgba(255,255,255,.5)', marginTop: 10 }}>🔔 {counts[hero.id].toLocaleString()} {counts[hero.id] === 1 ? 'person is' : 'people are'} waiting</div>}
            </div>
          </div>

          {/* Timeline */}
          {rest.length > 0 && (
            <div style={{ padding: '24px 16px 0' }}>
              <div style={{ fontFamily: COND, fontSize: '1.15rem', fontWeight: 800, marginBottom: 14, paddingLeft: 4 }}>Also on the way</div>
              {rest.map(m => {
                const d = parseDate(m.release_date);
                return (
                  <div key={m.id} style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
                    <div style={{ width: 46, flexShrink: 0, textAlign: 'center', paddingTop: 4 }}>
                      <div style={{ fontFamily: COND, fontSize: '.7rem', fontWeight: 800, color: '#e50914', letterSpacing: '.1em' }}>{d ? d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : 'TBA'}</div>
                      <div style={{ fontFamily: COND, fontSize: '1.7rem', fontWeight: 900, lineHeight: 1 }}>{d ? d.getDate() : '—'}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', background: '#141414', marginBottom: 10 }}>
                        {m.image && <img src={m.image} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        {getYouTubeId(m.trailer_url) && (
                          <button onClick={() => setTrailer(m)} aria-label="Play trailer" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,.55)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><polygon points="7 4 20 12 7 20 7 4"/></svg>
                            </span>
                          </button>
                        )}
                      </div>
                      <div style={{ fontFamily: COND, fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.05 }}>{m.title}</div>
                      {m.genre && <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', margin: '3px 0 6px' }}>{m.genre}</div>}
                      {m.description && <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.55, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.description}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <RemindButton notified={notified[m.id]} busy={busy[m.id]} onClick={() => remind(m)} />
                        {counts[m.id] > 0 && <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.4)' }}>🔔 {counts[m.id]} waiting</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {trailer && <TrailerModal url={trailer.trailer_url} title={trailer.title} onClose={() => setTrailer(null)} />}
      <style>{`
        .cs-press{transition:transform .12s}.cs-press:active{transform:scale(.96)}
        @keyframes csPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}.cs-pulse{animation:csPulse 1.4s infinite}
        @keyframes csSh{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .cs-skel{background:linear-gradient(90deg,#111,#1c1c1c,#111);background-size:800px 100%;animation:csSh 1.2s linear infinite}
      `}</style>
    </div>
  );
}
