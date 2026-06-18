import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr.replace(' ', 'T') + 'Z')) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function Sessions() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState({});

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    client.get('/sessions.php?action=list')
      .then(res => { if (res.data.ok) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const revoke = async (sessionId) => {
    setRevoking(r => ({ ...r, [sessionId]: true }));
    try {
      await client.post('/sessions.php?action=revoke', { session_id: sessionId });
      setData(d => ({ ...d, sessions: d.sessions.filter(s => s.id !== sessionId), active_count: d.active_count - 1 }));
    } catch {}
    setRevoking(r => ({ ...r, [sessionId]: false }));
  };

  const deviceIcon = (name) => {
    if (name.includes('iPhone') || name.includes('Android')) {
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>;
    }
    if (name.includes('iPad')) {
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>;
    }
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 60px', maxWidth: 700, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem', marginBottom: '1.5rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.6rem', fontWeight: 900, marginBottom: 4 }}>Active Devices</h1>
      <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.4)', marginBottom: '1.5rem' }}>
        {data?.active_count} of {data?.max_devices} device{data?.max_devices !== 1 ? 's' : ''} signed in
      </p>

      {/* Device limit bar */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '18px 20px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)' }}>Devices used</span>
          <span style={{ fontSize: '.8rem', fontWeight: 700 }}>{data?.active_count} / {data?.max_devices}</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (data?.active_count / data?.max_devices) * 100)}%`,
            background: data?.active_count >= data?.max_devices ? '#e50914' : '#22c55e',
            transition: 'width .2s'
          }} />
        </div>
      </div>

      {/* Sessions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data?.sessions?.map(s => (
          <div key={s.id} style={{
            background: '#111', border: `1px solid ${s.is_current ? 'rgba(34,197,94,.25)' : 'rgba(255,255,255,.07)'}`,
            borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.5)', flexShrink: 0 }}>
              {deviceIcon(s.device_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '.88rem', fontWeight: 700 }}>{s.device_name}</span>
                {s.is_current && (
                  <span style={{ fontSize: '.6rem', background: 'rgba(34,197,94,.15)', color: '#22c55e', padding: '2px 8px', borderRadius: 10, fontWeight: 800, textTransform: 'uppercase' }}>This device</span>
                )}
              </div>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)', marginTop: 3 }}>
                {s.ip_address} · Active {timeAgo(s.last_active)}
              </div>
            </div>
            {!s.is_current && (
              <button onClick={() => revoke(s.id)} disabled={revoking[s.id]} style={{
                background: 'rgba(229,9,20,.08)', border: '1px solid rgba(229,9,20,.2)',
                color: '#e50914', borderRadius: 8, padding: '7px 14px',
                fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0
              }}>{revoking[s.id] ? '...' : 'Sign Out'}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
