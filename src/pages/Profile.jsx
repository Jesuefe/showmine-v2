import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const planName = user?.sub?.plan || 'Free';
  const initial = user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 40px' }}>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>My Account</h1>

      {/* Avatar & name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '2rem', padding: '20px', background: '#111', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
          {initial}
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{user?.full_name || user?.username}</div>
          <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginTop: 3 }}>{user?.email}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ background: planName === 'Free' ? 'rgba(255,255,255,.08)' : 'rgba(229,9,20,.15)', color: planName === 'Free' ? 'rgba(255,255,255,.5)' : '#e50914', border: `1px solid ${planName === 'Free' ? 'rgba(255,255,255,.1)' : 'rgba(229,9,20,.3)'}`, fontSize: '.65rem', fontWeight: 800, padding: '2px 10px', borderRadius: 20, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {planName}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div style={{ background: '#111', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', padding: '20px', marginBottom: '1rem' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 12 }}>Subscription</div>
        {user?.sub ? (
          <div>
            <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{user.sub.plan} Plan</div>
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', marginBottom: 12 }}>
              {user.sub.expires_at ? `Expires: ${new Date(user.sub.expires_at).toLocaleDateString()}` : 'Active'}
            </div>
            <button onClick={() => navigate('/subscribe')} style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.25)', color: '#e50914', borderRadius: 8, padding: '.5rem 1rem', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}>
              Manage Subscription
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>You are on the Free plan.</div>
            <button onClick={() => navigate('/subscribe')} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '.6rem 1.2rem', fontSize: '.82rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.04em', textTransform: 'uppercase' }}>
              Upgrade Now
            </button>
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={{ background: '#111', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', marginBottom: '1rem' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 12 }}>Settings</div>
          {[
            { label: 'Edit Profile', action: () => {} },
            { label: 'Change Password', action: () => {} },
            { label: 'Watchlist', action: () => navigate('/watchlist') },
            { label: 'Coming Soon', action: () => navigate('/coming-soon') },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,.04)', color: 'rgba(255,255,255,.7)', fontSize: '.85rem', cursor: 'pointer', textAlign: 'left' }}>
              {item.label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button onClick={logout} style={{ width: '100%', padding: '14px', background: 'rgba(229,9,20,.08)', border: '1px solid rgba(229,9,20,.2)', borderRadius: 12, color: '#e50914', fontSize: '.9rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase' }}>
        Sign Out
      </button>

      {msg && <p style={{ color: '#22c55e', fontSize: '.8rem', marginTop: '1rem', textAlign: 'center' }}>{msg}</p>}
    </div>
  );
}
