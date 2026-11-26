import { useState, useEffect } from 'react';
import SvgIcon from '../components/Icon';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useKids } from '../context/KidsContext';
import client from '../api/client';
import { progress as progressApi } from '../api/extras';

const H = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800 };

const ICONS = {
  list: <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  kids: <><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>,
  tv: <><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></>,
  qr: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></>,
  devices: <><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>,
  data: <><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/></>,
  gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  doc: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  help: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  live: <><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14"/></>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
};

function Icon({ name, size = 18, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[name]}</svg>;
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ ...H, fontSize: '.68rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', padding: '0 6px 8px' }}>{title}</div>
      <div style={{ background: '#101013', borderRadius: 16, border: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function Row({ icon, label, hint, onClick, last, tint = 'rgba(255,255,255,.75)', badge }) {
  return (
    <button onClick={onClick} className="pf-row" style={{
      display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 16px', background: 'none', border: 'none',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,.045)', color: '#fff', cursor: 'pointer', textAlign: 'left',
    }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tint, flexShrink: 0 }}>
        <Icon name={icon} size={17} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '.88rem', fontWeight: 600 }}>{label}</span>
        {hint && <span style={{ display: 'block', fontSize: '.72rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{hint}</span>}
      </span>
      {badge}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  );
}

function daysLeft(date) {
  if (!date) return null;
  const d = Math.ceil((new Date(date) - Date.now()) / 86400000);
  return Number.isFinite(d) ? d : null;
}

export default function Profile() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { active: kidsOn, planOk: kidsPlanOk } = useKids();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ list: null, progress: null });
  const [confirmOut, setConfirmOut] = useState(false);
  const [version, setVersion] = useState('');

  useEffect(() => {
    client.get('/movies.php?action=watchlist_get')
      .then(r => r.data.ok && setStats(s => ({ ...s, list: (r.data.movies || []).length }))).catch(() => {});
    progressApi.continueList()
      .then(r => r.ok && setStats(s => ({ ...s, progress: (r.items || []).length }))).catch(() => {});
    if (window.Capacitor?.isNativePlatform?.()) {
      import('@capacitor/app').then(({ App }) => App.getInfo()).then(i => setVersion(`${i.version} (${i.build})`)).catch(() => {});
    }
  }, []);

  const sub = user?.sub;
  const planName = sub?.plan || 'Free';
  const isFree = !sub || /free/i.test(planName);
  const name = user?.full_name || user?.username || 'Viewer';
  const initials = name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const left = daysLeft(sub?.expires_at);

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 40 }}>
      {/* Hero header */}
      <div style={{
        position: 'relative', padding: '28px 20px 22px',
        background: 'radial-gradient(500px 220px at 0% 0%, rgba(229,9,20,.35), transparent 70%), radial-gradient(400px 200px at 100% 0%, rgba(120,40,200,.22), transparent 70%)',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#e50914,#7a0a10)', fontSize: '1.6rem', fontWeight: 900, color: '#fff',
            boxShadow: '0 10px 30px rgba(229,9,20,.4)', ...H,
          }}>{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ ...H, fontSize: '1.55rem', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            <span style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
              background: isFree ? 'rgba(255,255,255,.08)' : 'linear-gradient(90deg,#f5c542,#e0a100)',
              color: isFree ? 'rgba(255,255,255,.6)' : '#1a1200', fontSize: '.64rem', fontWeight: 900,
              padding: '3px 10px', borderRadius: 20, letterSpacing: '.08em', textTransform: 'uppercase',
            }}>{!isFree && <SvgIcon name="star" size={11} style={{ display: 'inline-block', verticalAlign: '-1px', fill: 'currentColor' }} />} {planName}</span>
          </div>
          <button aria-label={t('settings')} onClick={() => navigate('/settings')} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.08)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="gear" />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { v: stats.list, l: 'In My List', go: '/watchlist' },
            { v: stats.progress, l: 'In progress', go: '/' },
            { v: kidsOn ? 'On' : 'Off', l: 'Kids Mode', go: '/kids-setup' },
          ].map(s => (
            <button key={s.l} onClick={() => navigate(s.go)} style={{ background: '#101013', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: '14px 8px', color: '#fff', cursor: 'pointer' }}>
              <div style={{ ...H, fontSize: '1.5rem', lineHeight: 1 }}>{s.v ?? '–'}</div>
              <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.45)', marginTop: 5, fontWeight: 600 }}>{s.l}</div>
            </button>
          ))}
        </div>

        {/* Plan card */}
        <div style={{
          borderRadius: 18, padding: '18px', marginBottom: 22, position: 'relative', overflow: 'hidden',
          background: isFree ? 'linear-gradient(135deg,#2a0508,#120203)' : 'linear-gradient(135deg,#1d1606,#0e0b03)',
          border: `1px solid ${isFree ? 'rgba(229,9,20,.35)' : 'rgba(245,197,66,.3)'}`,
        }}>
          <div style={{ ...H, fontSize: '.66rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>{t('subscription')}</div>
          {isFree ? (
            <>
              <div style={{ ...H, fontSize: '1.3rem', marginBottom: 4 }}>Unlock everything on Showmine</div>
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.5, marginBottom: 14 }}>Full movie library, live sports, HD streaming and Kids Mode.</div>
              <button onClick={() => navigate('/subscribe')} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 10, padding: '11px 20px', ...H, fontSize: '.9rem', letterSpacing: '.05em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 6px 20px rgba(229,9,20,.4)' }}>Upgrade now</button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ ...H, fontSize: '1.35rem' }}>{planName} plan</div>
                {left !== null && <div style={{ fontSize: '.75rem', color: left <= 5 ? '#fbbf24' : 'rgba(255,255,255,.55)', fontWeight: 700 }}>{left > 0 ? `${left} day${left === 1 ? '' : 's'} left` : 'Expired'}</div>}
              </div>
              {sub?.expires_at && (
                <>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.08)', margin: '10px 0 6px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(4, Math.min(100, ((left ?? 0) / 30) * 100))}%`, height: '100%', background: 'linear-gradient(90deg,#f5c542,#e0a100)' }} />
                  </div>
                  <div style={{ fontSize: '.74rem', color: 'rgba(255,255,255,.45)', marginBottom: 12 }}>{t('expires')}: {new Date(sub.expires_at).toLocaleDateString()}</div>
                </>
              )}
              <button onClick={() => navigate('/subscribe')} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', color: '#fff', borderRadius: 10, padding: '9px 16px', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}>{t('manage_subscription')}</button>
            </>
          )}
        </div>

        <Section title="Watching">
          <Row icon="list" label={t('my_watchlist')} onClick={() => navigate('/watchlist')} />
          <Row icon="clock" label={t('coming_soon')} onClick={() => navigate('/coming-soon')} />
          <Row icon="live" label={t('live_tv')} onClick={() => navigate('/live')} />
          <Row icon="kids" label={t('kids_mode')} hint={kidsPlanOk === false ? 'Needs Standard plan — tap to see' : 'Safe, PIN-locked space for children'} tint="#f472b6" last
            onClick={() => navigate('/kids-setup')}
            badge={kidsPlanOk === false
              ? <span style={{ fontSize: '.6rem', fontWeight: 900, padding: '3px 8px', borderRadius: 20, background: 'linear-gradient(90deg,#f5c542,#e0a100)', color: '#1a1200', display: 'inline-flex', alignItems: 'center', gap: 4 }}><SvgIcon name="lock" size={10} stroke={2.4} />STANDARD</span>
              : <span style={{ fontSize: '.62rem', fontWeight: 900, padding: '3px 8px', borderRadius: 20, background: kidsOn ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.07)', color: kidsOn ? '#4ade80' : 'rgba(255,255,255,.45)' }}>{kidsOn ? 'ON' : 'OFF'}</span>} />
        </Section>

        <Section title="Devices">
          <Row icon="qr" label={t('sign_in_tv_desktop')} hint="Scan a QR code on your TV or computer" onClick={() => navigate('/scan-login')} />
          <Row icon="devices" label={t('active_devices')} onClick={() => navigate('/sessions')} />
          <Row icon="data" label={t('data_usage')} last onClick={() => navigate('/data-usage')} />
        </Section>

        <Section title="Account">
          <Row icon="gear" label={t('settings')} hint="Name, language, password" onClick={() => navigate('/settings')} />
          <Row icon="help" label="Help & support" hint="Message our team · or shake your phone" tint="#f5c542" onClick={() => navigate('/support')} />
          <Row icon="doc" label={t('terms_of_service')} onClick={() => navigate('/terms')} />
          <Row icon="shield" label={t('privacy_policy')} last onClick={() => navigate('/privacy')} />
        </Section>

        <button onClick={() => setConfirmOut(true)} style={{
          width: '100%', padding: '14px', background: 'rgba(229,9,20,.07)', border: '1px solid rgba(229,9,20,.22)', borderRadius: 14,
          color: '#ff4d57', fontSize: '.95rem', cursor: 'pointer', ...H, letterSpacing: '.06em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Icon name="logout" size={17} /> {t('sign_out')}
        </button>

        <div style={{ textAlign: 'center', fontSize: '.68rem', color: 'rgba(255,255,255,.22)', marginTop: 18 }}>
          Showmine TV{version ? ` · v${version}` : ''}
        </div>
      </div>

      {confirmOut && (
        <div onClick={() => setConfirmOut(false)} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#141418', borderRadius: '22px 22px 0 0', padding: '22px 20px calc(env(safe-area-inset-bottom) + 20px)', border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 16px' }} />
            <div style={{ ...H, fontSize: '1.3rem', marginBottom: 6 }}>Sign out?</div>
            <div style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.55)', marginBottom: 18 }}>You’ll need to sign in again to keep watching on this device.</div>
            <button onClick={logout} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e50914', color: '#fff', ...H, fontSize: '1rem', letterSpacing: '.05em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 10 }}>{t('sign_out')}</button>
            <button onClick={() => setConfirmOut(false)} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: '#fff', fontSize: '.9rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <style>{`.pf-row:active { background: rgba(255,255,255,.04) !important; }`}</style>
    </div>
  );
}
