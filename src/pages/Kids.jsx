import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useKids } from '../context/KidsContext';
import { PinDialog, ForgotPinDialog } from '../components/PinPad';

const SECTIONS = [
  { id: 'all',       label: 'Everything', icon: 'star', color: '#facc15' },
  { id: 'animation', label: 'Cartoons',   icon: 'palette', color: '#f472b6' },
  { id: 'education', label: 'Learn',      icon: 'book', color: '#38bdf8' },
  { id: 'quizzes',   label: 'Quizzes',    icon: 'puzzle', color: '#4ade80' },
];
const CARD_COLORS = ['#f472b6', '#38bdf8', '#facc15', '#4ade80', '#a78bfa', '#fb923c'];
const FONT = "'Nunito', 'Baloo 2', ui-rounded, 'SF Pro Rounded', system-ui, sans-serif";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SkeletonGrid() {
  return (
    <div style={grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="kid-skel" style={{ aspectRatio: '2/3', borderRadius: 22 }} />
      ))}
    </div>
  );
}

const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 };

export default function Kids() {
  const navigate = useNavigate();
  const { refresh, exit } = useKids();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('all');
  const [dialog, setDialog] = useState(null); // 'pin' | 'forgot'

  // Not in Kids Mode → this page is the parent's setup screen instead.
  useEffect(() => {
    refresh().then(s => { if (s?.ok && !s.is_kids_mode) navigate('/kids-setup', { replace: true }); });
  }, [refresh, navigate]);

  useEffect(() => {
    let alive = true;
    client.get(`/kids.php?action=content&section=${section}`)
      .then(r => { if (alive && r.data.ok) setMovies(r.data.movies || []); })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [section]);

  const hero = movies[0];
  const rest = hero ? movies.slice(1) : movies;
  const current = SECTIONS.find(s => s.id === section);

  return (
    <div style={{
      minHeight: '100vh', fontFamily: FONT, color: '#fff', paddingBottom: 40,
      background: 'radial-gradient(1200px 600px at 10% -10%, #3b1d6e 0%, transparent 60%), radial-gradient(900px 500px at 110% 10%, #0e4a6b 0%, transparent 55%), #0b1026',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top) + 18px) 20px 6px' }}>
        <div>
          <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', fontWeight: 700 }}>{greeting()}!</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 900, lineHeight: 1.15 }}>What shall we watch?</div>
        </div>
        <button onClick={() => setDialog('pin')} aria-label="Grown-ups: exit Kids Mode" style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 14,
          background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
          color: 'rgba(255,255,255,.7)', fontSize: '.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: FONT,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Grown-ups
        </button>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 20px 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {SECTIONS.map(s => {
          const on = s.id === section;
          return (
            <button key={s.id} onClick={() => { if (s.id !== section) { setLoading(true); setSection(s.id); } }} className="kid-press" style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999,
              background: on ? s.color : 'rgba(255,255,255,.08)', color: on ? '#1a1033' : '#fff',
              border: `2px solid ${on ? s.color : 'rgba(255,255,255,.1)'}`,
              fontSize: '.95rem', fontWeight: 900, cursor: 'pointer', fontFamily: FONT,
              boxShadow: on ? `0 8px 24px ${s.color}55` : 'none', transition: 'all .2s',
            }}>
              <Icon name={s.icon} size={18} stroke={2.2} />{s.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '10px 20px 0' }}>
        {loading ? <SkeletonGrid /> : movies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <IconBadge name="smile" size={72} color="#facc15" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>Nothing here yet!</div>
            <div style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.55)', marginTop: 6 }}>New {current?.label.toLowerCase()} are coming soon.</div>
          </div>
        ) : (
          <>
            {/* Featured */}
            {hero && (
              <div onClick={() => navigate(`/watch/${hero.slug}`)} className="kid-press" style={{
                position: 'relative', borderRadius: 26, overflow: 'hidden', aspectRatio: '16/9', marginBottom: 22, cursor: 'pointer',
                border: `3px solid ${current?.color || '#facc15'}`, boxShadow: `0 14px 40px ${(current?.color || '#facc15')}40`, background: '#1b1f3a',
              }}>
                {(hero.banner_image || hero.cover_image) && (
                  <img src={hero.banner_image || hero.cover_image} alt={hero.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,38,.95) 0%, rgba(11,16,38,.2) 55%, transparent 100%)' }} />
                <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'inline-block', background: current?.color, color: '#1a1033', fontSize: '.68rem', fontWeight: 900, padding: '3px 10px', borderRadius: 999, marginBottom: 6 }}><Icon name="star" size={11} stroke={2.4} style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: 4, fill: 'currentColor' }} />TOP PICK</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hero.title}</div>
                  </div>
                  <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,.4)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a1033"><polygon points="7 4 20 12 7 20 7 4"/></svg>
                  </div>
                </div>
              </div>
            )}

            {rest.length > 0 && (
              <div style={grid}>
                {rest.map((m, i) => {
                  const c = CARD_COLORS[i % CARD_COLORS.length];
                  return (
                    <div key={m.id} onClick={() => navigate(`/watch/${m.slug}`)} className="kid-press" style={{ cursor: 'pointer' }}>
                      <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 22, overflow: 'hidden', border: `3px solid ${c}`, background: '#1b1f3a', boxShadow: `0 10px 26px ${c}33` }}>
                        {m.cover_image
                          ? <img src={m.cover_image} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.35)' }}><Icon name="film" size={34} /></div>}
                        <div style={{ position: 'absolute', right: 8, bottom: 8, width: 34, height: 34, borderRadius: '50%', background: c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1a1033"><polygon points="7 4 20 12 7 20 7 4"/></svg>
                        </div>
                      </div>
                      <div style={{ fontSize: '.88rem', fontWeight: 800, padding: '8px 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {dialog === 'pin' && (
        <PinDialog
          title="Grown-ups only"
          subtitle="Enter your parental PIN to leave Kids Mode"
          onSubmit={async (pin) => {
            const r = await exit(pin);
            if (r.ok) { setDialog(null); navigate('/', { replace: true }); }
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

      <style>{`
        @keyframes kidShimmer { 0%{background-position:-300px 0} 100%{background-position:300px 0} }
        .kid-skel { background: linear-gradient(90deg, rgba(255,255,255,.06) 0%, rgba(255,255,255,.13) 50%, rgba(255,255,255,.06) 100%); background-size: 600px 100%; animation: kidShimmer 1.3s linear infinite; }
        .kid-press { transition: transform .15s ease; }
        .kid-press:active { transform: scale(.96); }
      `}</style>
    </div>
  );
}
