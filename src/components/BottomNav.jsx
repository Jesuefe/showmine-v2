import { Link, useLocation } from 'react-router-dom';

const navItems = [
  {
    path: '/', label: 'Home',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  },
  {
    path: '/browse', label: 'Browse',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  },
  {
    path: '/live', label: 'Live',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48 0a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
  },
  {
    path: '/profile', label: 'Profile',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  },
  {
    path: '/watchlist', label: 'My List',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
  },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(9,9,9,.97)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,.06)',
      display: 'flex', alignItems: 'center',
      height: 64, paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    }}>
      {navItems.map(item => {
        const active = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            textDecoration: 'none', padding: '8px 0',
            color: active ? '#e50914' : 'rgba(255,255,255,.4)',
            transition: 'color .15s'
          }}>
            {item.icon}
            <span style={{
              fontSize: '.6rem', fontWeight: active ? 700 : 500,
              letterSpacing: '.02em'
            }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}