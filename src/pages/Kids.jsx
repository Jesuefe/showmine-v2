import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKids } from '../context/KidsContext';
import { PinDialog, ForgotPinDialog } from '../components/PinPad';
import Icon, { IconBadge } from '../components/Icon';
import { AvatarArt } from '../components/Avatar';
import { kidsApi, blockedReason, KFONT, KBG } from '../kids/api';
import KidsTimeGate from '../kids/KidsTimeGate';
import { KidRail, kidPressCss } from '../kids/KidCard';
import { tapHaptic } from '../utils/feel';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function fmtLeft(time) {
  if (!time || !time.limit_secs) return null;
  const m = Math.ceil((time.left_secs || 0) / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m left` : `${m} min left`;
}

function Featured({ items }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const timer = useRef();
  useEffect(() => {
    if (items.length < 2) return undefined;
    timer.current = setInterval(() => setIdx(i => (i + 1) % items.length), 5500);
    return () => clearInterval(timer.current);
  }, [items.length]);
  if (!items.length) return null;
  const colors = ['#facc15', '#38bdf8', '#f472b6', '#4ade80', '#a78bfa'];
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', aspectRatio: '16/9', background: '#1b1f3a', border: `3px solid ${colors[idx % colors.length]}`, boxShadow: `0 16px 44px ${colors[idx % colors.length]}40`, transition: 'border-color .5s, box-shadow .5s' }}>
        {items.map((m, i) => (
          <div key={m.id} onClick={() => navigate(`/watch/${m.slug}`)} style={{ position: 'absolute', inset: 0, cursor: 'pointer', opacity: i === idx ? 1 : 0, transition: 'opacity .7s ease', pointerEvents: i === idx ? 'auto' : 'none' }}>
            {(m.banner_image || m.cover_image) && <img src={m.banner_image || m.cover_image} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: i === idx ? 'scale(1.06)' : 'scale(1)', transition: 'transform 6s linear' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,38,.95) 0%, rgba(11,16,38,.15) 55%, transparent 100%)' }} />
            <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: colors[i % colors.length], color: '#1a1033', fontSize: '.68rem', fontWeight: 900, padding: '3px 10px', borderRadius: 999, marginBottom: 6 }}>
                  <Icon name="star" size={11} stroke={2.4} style={{ fill: 'currentColor' }} />TOP PICK
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
              </div>
              <div style={{ flexShrink: 0, width: 58, height: 58, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,.4)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a1033"><polygon points="7 4 20 12 7 20 7 4"/></svg>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {items.map((m, i) => <button key={m.id} aria-label={`Show ${m.title}`} data-nohaptic onClick={() => { clearInterval(timer.current); setIdx(i); }} style={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 4, border: 'none', padding: 0, background: i === idx ? '#fff' : 'rgba(255,255,255,.3)', transition: 'width .3s', cursor: 'pointer' }} />)}
        </div>
      )}
    </div>
  );
}

export default function Kids() {
  const navigate = useNavigate();
  const { refresh } = useKids();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [dialog, setDialog] = useState(null); // 'pin' | 'forgot'

  // Not in Kids Mode → this page is the parent's setup screen instead.
  useEffect(() => {
    refresh().then(s => { if (s?.ok && !s.is_kids_mode) navigate('/kids-setup', { replace: true }); });
  }, [refresh, navigate]);

  const load = useCallback(() => {
    setError(false);
    kidsApi.home().then(r => (r.ok ? setData(r) : setError(true))).catch(() => setError(true));
  }, []);
  useEffect(() => { load(); }, [load]);

  const onFav = (m, on) => setData(d => d && ({
    ...d,
    favorites: on ? [{ ...m, favorite: true }, ...(d.favorites || []).filter(x => x.id !== m.id)] : (d.favorites || []).filter(x => x.id !== m.id),
  }));

  const profile = data?.profile || {};
  const time = data?.time;
  const reason = blockedReason(time);
  if (reason) return <KidsTimeGate reason={reason} name={profile.child_name} onExtended={(t) => setData(d => ({ ...d, time: t }))} />;

  const left = fmtLeft(time);
  const name = profile.child_name;

  return (
    <div style={{ minHeight: '100vh', fontFamily: KFONT, color: '#fff', paddingBottom: 50, background: KBG }}>
      <style>{kidPressCss}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(env(safe-area-inset-top) + 18px) 20px 6px' }}>
        <div style={{ animation: 'kidIn .5s ease both' }}>
          <AvatarArt style={profile.avatar || 'lion'} size={54} radius={18} ring />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', fontWeight: 700 }}>{greeting()}{name ? ',' : '!'}</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name ? `${name}!` : 'What shall we watch?'}</div>
        </div>
        <button onClick={() => setDialog('pin')} aria-label="Grown-ups" style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 14,
          background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
          color: 'rgba(255,255,255,.7)', fontSize: '.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: KFONT,
        }}>
          <Icon name="lock" size={13} stroke={2.4} />Grown-ups
        </button>
      </div>

      {/* Search + time */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 20px 18px', alignItems: 'center' }}>
        <button onClick={() => navigate('/kids/search')} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 18, border: '2px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.6)', fontFamily: KFONT, fontWeight: 800, fontSize: '.95rem', cursor: 'pointer', textAlign: 'left' }}>
          <Icon name="search" size={19} stroke={2.4} />Find a show…
        </button>
        {left && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px', borderRadius: 18, background: time.left_secs < 600 ? '#fb923c33' : '#4ade8026', border: `2px solid ${time.left_secs < 600 ? '#fb923c' : '#4ade80'}`, fontWeight: 900, fontSize: '.8rem' }}>
            <Icon name="history" size={15} stroke={2.4} />{left}
          </div>
        )}
      </div>

      {!data && !error && (
        <div style={{ padding: '0 20px' }}>
          <div className="kid-skel" style={{ aspectRatio: '16/9', borderRadius: 28 }} />
          <div style={{ display: 'flex', gap: 14, marginTop: 26 }}>{[0, 1, 2].map(i => <div key={i} className="kid-skel" style={{ width: 132, aspectRatio: '2/3', borderRadius: 22 }} />)}</div>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <IconBadge name="smile" size={72} color="#facc15" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>Oops! Couldn't load your shows.</div>
          <button onClick={load} style={{ marginTop: 16, padding: '12px 22px', borderRadius: 18, border: 'none', background: '#facc15', color: '#1a1033', fontWeight: 900, fontFamily: KFONT, cursor: 'pointer' }}>Try again</button>
        </div>
      )}

      {data && (
        <>
          <Featured items={data.featured || []} />

          {/* Play & Learn */}
          <div style={{ padding: '22px 20px 0' }}>
            <button onClick={() => { tapHaptic('light'); navigate('/kids/play'); }} className="kid-press" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24, border: 'none', cursor: 'pointer', background: 'linear-gradient(120deg,#f472b6,#a78bfa 50%,#38bdf8)', color: '#1a1033', fontFamily: KFONT, textAlign: 'left', boxShadow: '0 12px 30px rgba(167,139,250,.35)' }}>
              <div style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="puzzle" size={30} stroke={2.4} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>Play & Learn</div>
                <div style={{ fontSize: '.85rem', fontWeight: 800, opacity: .75 }}>Count, colours and shapes games</div>
              </div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <KidRail title="Keep watching" icon="history" color="#38bdf8" items={data.continue} onFav={onFav} />
          <KidRail title="My favourites" icon="heart" color="#f472b6" items={data.favorites} onFav={onFav} onMore={() => navigate('/kids/c/favorites')} />

          {/* Category tiles */}
          {data.categories?.length > 0 && (
            <section style={{ marginTop: 26, padding: '0 20px' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 900 }}>Pick a world</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                {data.categories.map((c, i) => (
                  <button key={c.id} onClick={() => navigate(`/kids/c/${c.id}`)} className="kid-press" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 14, minHeight: 96, borderRadius: 22, border: 'none', cursor: 'pointer', background: c.color, color: '#1a1033', fontFamily: KFONT, textAlign: 'left', animation: `kidIn .4s ease ${i * .05}s both` }}>
                    <span style={{ position: 'absolute', right: -14, bottom: -14, opacity: .25 }}><Icon name={c.icon} size={80} stroke={2} /></span>
                    <Icon name={c.icon} size={26} stroke={2.4} />
                    <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>{c.label}</span>
                    <span style={{ fontSize: '.72rem', fontWeight: 800, opacity: .7 }}>{c.count} {c.count === 1 ? 'show' : 'shows'}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <KidRail title="Brand new" icon="star" color="#facc15" items={data.newest} onFav={onFav} />
          {(data.categories || []).map(c => (
            <KidRail key={c.id} title={c.label} icon={c.icon} color={c.color} items={c.items} onFav={onFav} onMore={() => navigate(`/kids/c/${c.id}`)} />
          ))}

          {!data.total && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <IconBadge name="smile" size={72} color="#facc15" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>New shows are on the way!</div>
              <div style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.55)', marginTop: 6 }}>Try Play & Learn while you wait.</div>
            </div>
          )}

        </>
      )}

      {dialog === 'pin' && (
        <PinDialog
          title="Grown-ups only"
          subtitle="Enter your parental PIN"
          onSubmit={async (pin) => {
            const r = await kidsApi.verifyPin(pin);
            if (r.ok) { setDialog(null); navigate('/kids/parents', { state: { pin } }); }
            return r;
          }}
          onCancel={() => setDialog(null)}
          onForgot={() => setDialog('forgot')}
        />
      )}
      {dialog === 'forgot' && (
        <ForgotPinDialog
          onClose={() => setDialog(null)}
          onDone={() => { setDialog(null); navigate('/kids-setup', { replace: true, state: { reset: true } }); }}
        />
      )}
    </div>
  );
}
