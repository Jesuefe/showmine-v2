import { useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';
import { C, COND, Toaster, ConfirmHost, confirmDialog, Logo } from './ui';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Content from './screens/Content';
import Users from './screens/Users';
import Support from './screens/Support';
import LivePush from './screens/LivePush';

const TABS = [
  { id: 'home', label: 'Dashboard', icon: <path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z" /> },
  { id: 'content', label: 'Content', icon: <><rect x="2" y="4" width="20" height="16" rx="2" fill="none" strokeWidth="2" stroke="currentColor" /><path d="M10 9l5 3-5 3z" /></> },
  { id: 'users', label: 'Users', icon: <path d="M16 11a4 4 0 10-4-4 4 4 0 004 4zm-8 1a3 3 0 10-3-3 3 3 0 003 3zm8 2c-3 0-8 1.5-8 4v2h16v-2c0-2.5-5-4-8-4zM8 14c-.6 0-1.3.05-2 .14C3.7 14.5 0 15.6 0 18v2h6v-2c0-1.5.8-2.7 2-3.6z" /> },
  { id: 'support', label: 'Support', icon: <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" /> },
  { id: 'live', label: 'Live & Push', icon: <><circle cx="12" cy="12" r="3" /><path d="M6.3 6.3a8 8 0 000 11.4M17.7 6.3a8 8 0 010 11.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></> },
];

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [booting, setBooting] = useState(!!getToken());
  const [tab, setTab] = useState('home');
  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    setUnauthorizedHandler(() => setAdmin(null));
    if (!getToken()) return;
    api.get('me').then(d => setAdmin(d.admin)).catch(() => setToken('')).finally(() => setBooting(false));
  }, []);

  // Android back button: close sheets first, then go to dashboard, then exit
  useEffect(() => {
    let sub;
    import('@capacitor/app').then(({ App: CapApp }) => {
      sub = CapApp.addListener('backButton', () => {
        if (window.__smSheetBack) window.__smSheetBack();
        else if (tab !== 'home') setTab('home');
        else CapApp.exitApp();
      });
    }).catch(() => {});
    return () => { sub?.then?.(s => s.remove()); };
  }, [tab]);

  const logout = async () => {
    if (!(await confirmDialog({ title: 'Sign out?', message: 'You will need your admin password to sign back in.', confirm: 'Sign out', danger: true }))) return;
    try { await api.post('logout'); } catch { /* ignore */ }
    setToken(''); setAdmin(null); setTab('home');
  };

  if (booting) return <Splash />;
  if (!admin) return <><Login onDone={(a) => { setAdmin(a); setTab('home'); }} /><Toaster /></>;

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11,11,13,.92)', backdropFilter: 'blur(14px)', padding: 'calc(env(safe-area-inset-top) + 12px) 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={30} />
          <div>
            <div style={{ fontFamily: COND, fontWeight: 900, fontSize: '1.15rem', letterSpacing: '.06em', lineHeight: 1 }}>SHOWMINE <span style={{ color: C.red }}>ADMIN</span></div>
            <div style={{ fontSize: '.68rem', color: C.faint, marginTop: 2 }}>{TABS.find(t => t.id === tab)?.label}</div>
          </div>
        </div>
        <button onClick={logout} className="press" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.06)', border: `1px solid ${C.line}`, color: '#fff', borderRadius: 999, padding: '6px 12px 6px 6px', cursor: 'pointer' }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 900 }}>{(admin.username || 'A')[0].toUpperCase()}</span>
          <span style={{ fontSize: '.76rem', fontWeight: 700 }}>{admin.username}</span>
        </button>
      </header>

      <main key={tab} className="rise" style={{ padding: '6px 14px calc(96px + env(safe-area-inset-bottom))', maxWidth: 760, margin: '0 auto' }}>
        {tab === 'home' && <Dashboard go={setTab} onTickets={setOpenTickets} />}
        {tab === 'content' && <Content />}
        {tab === 'users' && <Users />}
        {tab === 'support' && <Support onCount={setOpenTickets} />}
        {tab === 'live' && <LivePush />}
      </main>

      <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, background: 'rgba(14,14,17,.96)', backdropFilter: 'blur(16px)', borderTop: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-around', padding: '8px 4px calc(8px + env(safe-area-inset-bottom))' }}>
        {TABS.map(t => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="press" style={{ position: 'relative', flex: 1, background: 'none', border: 'none', color: on ? '#fff' : C.faint, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 0' }}>
              <span style={{ width: 44, height: 28, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'rgba(229,9,20,.18)' : 'transparent', transition: 'background .2s' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: on ? C.red : 'inherit' }}>{t.icon}</svg>
              </span>
              <span style={{ fontSize: '.62rem', fontWeight: 700 }}>{t.label}</span>
              {t.id === 'support' && openTickets > 0 && <span style={{ position: 'absolute', top: 0, right: '22%', minWidth: 16, height: 16, borderRadius: 8, background: C.red, color: '#fff', fontSize: '.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{openTickets}</span>}
            </button>
          );
        })}
      </nav>
      <Toaster />
      <ConfirmHost />
    </div>
  );
}

function Splash() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ animation: 'pulse 1.2s ease-in-out infinite' }}><Logo size={64} /></div>
    </div>
  );
}
