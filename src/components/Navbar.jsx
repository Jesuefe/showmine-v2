import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/browse', label: 'Browse' },
    { path: '/live', label: 'Live TV' },
    { path: '/coming-soon', label: 'Coming Soon' },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 60,
        background: 'linear-gradient(to bottom, rgba(0,0,0,.95) 0%, rgba(0,0,0,.6) 70%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', zIndex: 1000,
        backdropFilter: 'blur(0px)',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '1.4rem', fontWeight: 900,
          letterSpacing: '.1em', color: '#e50914',
          textDecoration: 'none', flexShrink: 0
        }}>SHOWMINE</Link>

        {/* Desktop nav links */}
        <div style={{
          display: 'flex', gap: '1.5rem', alignItems: 'center',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)'
        }} className="desktop-nav">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{
              fontSize: '.85rem', fontWeight: 600,
              color: location.pathname === item.path ? '#fff' : 'rgba(255,255,255,.6)',
              textDecoration: 'none', transition: 'color .15s',
              borderBottom: location.pathname === item.path ? '2px solid #e50914' : '2px solid transparent',
              paddingBottom: 2
            }}>{item.label}</Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/search" style={{ color: 'rgba(255,255,255,.7)', display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </Link>
          <div
            onClick={() => setShowMenu(!showMenu)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#e50914', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '.85rem', fontWeight: 900,
              cursor: 'pointer', flexShrink: 0, position: 'relative',
              color: '#fff', letterSpacing: '.02em'
            }}>
            {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}

            {/* Dropdown */}
            {showMenu && (
              <div style={{
                position: 'absolute', top: '110%', right: 0,
                background: '#161616', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 10, padding: '8px 0', minWidth: 160,
                boxShadow: '0 8px 32px rgba(0,0,0,.5)'
              }}>
                <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', marginBottom: 4 }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#fff' }}>{user?.full_name || user?.username}</div>
                  <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{user?.email}</div>
                </div>
                <Link to="/profile" onClick={() => setShowMenu(false)} style={{
                  display: 'block', padding: '8px 16px', fontSize: '.8rem',
                  color: 'rgba(255,255,255,.7)', textDecoration: 'none'
                }}>Profile</Link>
                <Link to="/watchlist" onClick={() => setShowMenu(false)} style={{
                  display: 'block', padding: '8px 16px', fontSize: '.8rem',
                  color: 'rgba(255,255,255,.7)', textDecoration: 'none'
                }}>My List</Link>
                <Link to="/subscribe" onClick={() => setShowMenu(false)} style={{
                  display: 'block', padding: '8px 16px', fontSize: '.8rem',
                  color: 'rgba(255,255,255,.7)', textDecoration: 'none'
                }}>Subscription</Link>
                <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '4px 0' }} />
                <button onClick={logout} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 16px', fontSize: '.8rem', color: '#e50914',
                  background: 'none', border: 'none', cursor: 'pointer'
                }}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Click outside to close menu */}
      {showMenu && (
        <div onClick={() => setShowMenu(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
      )}

      <style>{`
        .desktop-nav { display: none !important; }
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}