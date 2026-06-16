import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function useIsMobile() {
  // Use touch capability + screen size to detect mobile
  // This prevents landscape mode from switching to desktop layout
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = Math.min(window.screen.width, window.screen.height) < 768;
  const [mobile, setMobile] = useState(isTouchDevice && isSmallScreen);
  useEffect(() => {
    const fn = () => {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const small = Math.min(window.screen.width, window.screen.height) < 768;
      setMobile(touch && small);
    };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

const MAIN_NAV = [
  { path: '/', label: 'Home', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { path: '/browse', label: 'Browse', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { path: '/live', label: 'Live TV', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48 0a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg> },
  { path: '/watchlist', label: 'My List', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> },
  { path: '/search', label: 'Search', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> },
];

const SECTIONS = [
  { path: '/browse', label: 'African Movies' },
  { path: '/browse', label: 'International' },
  { path: '/browse', label: 'Sports' },
  { path: '/browse', label: 'Documentaries' },
  { path: '/browse', label: 'Religious' },
];

const BOTTOM_NAV = [
  { path: '/', label: 'Home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { path: '/browse', label: 'Browse', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { path: '/live', label: 'Live', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48 0a6 6 0 010-8.49"/></svg> },
  { path: '/profile', label: 'Profile', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { path: '/watchlist', label: 'My List', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> },
];

function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 220,
      background: '#090909', borderRight: '1px solid rgba(255,255,255,.05)',
      display: 'flex', flexDirection: 'column', zIndex: 900,
      overflowY: 'auto', scrollbarWidth: 'none'
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 20px' }}>
        <Link to="/" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '1.5rem', fontWeight: 900,
          letterSpacing: '.1em', color: '#e50914', textDecoration: 'none'
        }}>SHOWMINE</Link>
      </div>

      {/* Main nav */}
      <div style={{ padding: '0 10px', marginBottom: 16 }}>
        <p style={{
          fontSize: '.58rem', fontWeight: 800, letterSpacing: '.14em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,.2)',
          padding: '0 10px 6px', margin: 0
        }}>Main</p>
        {MAIN_NAV.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8, marginBottom: 1,
              textDecoration: 'none', transition: 'all .15s',
              background: active ? 'rgba(229,9,20,.1)' : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,.45)',
              borderLeft: `2px solid ${active ? '#e50914' : 'transparent'}`
            }}>
              <span style={{ color: active ? '#e50914' : 'rgba(255,255,255,.3)', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: '.82rem', fontWeight: active ? 700 : 500 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Sections */}
      <div style={{ padding: '0 10px', marginBottom: 16 }}>
        <p style={{
          fontSize: '.58rem', fontWeight: 800, letterSpacing: '.14em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,.2)',
          padding: '0 10px 6px', margin: 0
        }}>Sections</p>
        {SECTIONS.map(item => (
          <Link key={item.label} to={item.path} style={{
            display: 'block', padding: '8px 10px', borderRadius: 8,
            textDecoration: 'none', color: 'rgba(255,255,255,.38)',
            fontSize: '.8rem', marginBottom: 1
          }}>{item.label}</Link>
        ))}
      </div>

      {/* Account */}
      <div style={{
        padding: '12px 10px 16px', marginTop: 'auto',
        borderTop: '1px solid rgba(255,255,255,.05)'
      }}>
        <p style={{
          fontSize: '.58rem', fontWeight: 800, letterSpacing: '.14em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,.2)',
          padding: '0 10px 6px', margin: 0
        }}>Account</p>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#e50914',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.82rem', fontWeight: 900, color: '#fff', flexShrink: 0
          }}>
            {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || user?.username}
            </div>
            <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.sub ? user.sub.plan : 'Free'}
            </div>
          </div>
        </div>

        <Link to="/profile" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 8, marginBottom: 1,
          textDecoration: 'none', color: 'rgba(255,255,255,.45)', fontSize: '.82rem'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          My Account
        </Link>
        <Link to="/subscribe" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 8, marginBottom: 1,
          textDecoration: 'none', color: 'rgba(255,255,255,.45)', fontSize: '.82rem'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Subscription
        </Link>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 8, width: '100%',
          background: 'none', border: 'none', color: '#e50914',
          fontSize: '.82rem', cursor: 'pointer', textAlign: 'left'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function MobileTopNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHeroPage = location.pathname === '/' || location.pathname.startsWith('/watch/');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 60,
      background: isHeroPage
        ? 'linear-gradient(to bottom, rgba(0,0,0,.85) 0%, transparent 100%)'
        : 'rgba(9,9,9,.97)',
      borderBottom: isHeroPage ? 'none' : '1px solid rgba(255,255,255,.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', zIndex: 1000
    }}>
      <Link to="/" style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '1.3rem', fontWeight: 900,
        letterSpacing: '.1em', color: '#e50914', textDecoration: 'none'
      }}>SHOWMINE</Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/search')} style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,.7)', cursor: 'pointer', display: 'flex'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
        <div onClick={() => navigate('/profile')} style={{
          width: 32, height: 32, borderRadius: '50%', background: '#e50914',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '.82rem', fontWeight: 900, color: '#fff', cursor: 'pointer'
        }}>
          {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </div>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
      background: 'rgba(9,9,9,.97)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,.06)',
      display: 'flex', alignItems: 'center', zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    }}>
      {BOTTOM_NAV.map(item => {
        const active = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3, textDecoration: 'none', padding: '8px 0',
            color: active ? '#e50914' : 'rgba(255,255,255,.35)',
            transition: 'color .15s'
          }}>
            {item.icon}
            <span style={{ fontSize: '.58rem', fontWeight: active ? 800 : 500, letterSpacing: '.02em' }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Layout({ children }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isHeroPage = location.pathname === '/' || location.pathname.startsWith('/watch/');

  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex' }}>

      {/* Desktop sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main content */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : 220,
        minWidth: 0,
        overflowX: 'hidden',
        paddingTop: isMobile && !isHeroPage ? 60 : 0,
        paddingBottom: isMobile ? 64 : 40,
      }}>
        {/* Mobile top nav */}
        {isMobile && <MobileTopNav />}

        {children}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <MobileBottomNav />}

      <style>{`
        * { scrollbar-width: none; -ms-overflow-style: none; }
        *::-webkit-scrollbar { display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}