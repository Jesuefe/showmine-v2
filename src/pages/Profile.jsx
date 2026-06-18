import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');

  const planName = user?.sub?.plan || 'Free';
  const initial = user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 40px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>My Account</h1>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.5rem', padding: '20px', background: '#111', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
          {initial}
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800 }}>{user?.full_name || user?.username}</div>
          <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{user?.email}</div>
          <span style={{ marginTop: 6, display: 'inline-block', background: planName === 'Free' ? 'rgba(255,255,255,.08)' : 'rgba(229,9,20,.15)', color: planName === 'Free' ? 'rgba(255,255,255,.5)' : '#e50914', border: `1px solid ${planName === 'Free' ? 'rgba(255,255,255,.1)' : 'rgba(229,9,20,.3)'}`, fontSize: '.62rem', fontWeight: 800, padding: '2px 10px', borderRadius: 20, letterSpacing: '.06em', textTransform: 'uppercase' }}>
            {planName}
          </span>
        </div>
      </div>

      {/* Subscription */}
      <div style={{ background: '#111', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', padding: '20px', marginBottom: '1rem' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.62rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 12 }}>Subscription</div>
        {user?.sub ? (
          <div>
            <div style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: 4 }}>{user.sub.plan} Plan</div>
            {user.sub.expires_at && <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 12 }}>Expires: {new Date(user.sub.expires_at).toLocaleDateString()}</div>}
            <button onClick={() => navigate('/subscribe')} style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.25)', color: '#e50914', borderRadius: 8, padding: '.5rem 1rem', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}>
              Manage Subscription
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>You are on the Free plan.</div>
            <button onClick={() => navigate('/subscribe')} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '.6rem 1.4rem', fontSize: '.82rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.04em', textTransform: 'uppercase' }}>
              Upgrade Now
            </button>
          </div>
        )}
      </div>

      {/* Menu items */}
      <div style={{ background: '#111', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', marginBottom: '1rem' }}>
        {[
          { label: 'My Watchlist', path: '/watchlist' },
          { label: 'Coming Soon', path: '/coming-soon' },
          { label: 'Browse Content', path: '/browse' },
          { label: 'Live TV', path: '/live' },
          { label: 'Sign In on TV / Desktop', path: '/scan-login' },
          { label: 'Kids Mode', path: '/kids-setup' },
          { label: 'Data Usage', path: '/data-usage' },
          { label: 'Active Devices', path: '/sessions' },
        ].map((item, i, arr) => (
          <button key={item.label} onClick={() => navigate(item.path)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '14px 20px', background: 'none',
            border: 'none', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
            color: 'rgba(255,255,255,.7)', fontSize: '.85rem', cursor: 'pointer', textAlign: 'left'
          }}>
            {item.label}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>

      {/* Legal */}
      <div style={{ background: '#111', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', marginBottom: '1.5rem' }}>
        {[
          { label: 'Terms of Service', path: '/terms' },
          { label: 'Privacy Policy', path: '/privacy' },
        ].map((item, i, arr) => (
          <button key={item.label} onClick={() => navigate(item.path)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '14px 20px', background: 'none',
            border: 'none', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
            color: 'rgba(255,255,255,.5)', fontSize: '.82rem', cursor: 'pointer', textAlign: 'left'
          }}>
            {item.label}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={logout} style={{ width: '100%', padding: '14px', background: 'rgba(229,9,20,.08)', border: '1px solid rgba(229,9,20,.2)', borderRadius: 12, color: '#e50914', fontSize: '.9rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase' }}>
        Sign Out
      </button>

      {msg && <p style={{ color: '#22c55e', fontSize: '.8rem', marginTop: '1rem', textAlign: 'center' }}>{msg}</p>}
    </div>
  );
}
