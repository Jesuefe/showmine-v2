import { useState, useEffect, useCallback } from 'react';
import { devices as devicesApi } from '../api/extras';
import { PageHeader } from '../components/ui';
import { timeAgo } from '../components/ui';

const H = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800 };
const FLAGS = (cc) => cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : '';

function DeviceIcon({ platform, model }) {
  const isPc = platform === 'web' && /PC|Mac|browser/i.test(model || '');
  return (
    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {isPc
        ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        : platform === 'ios'
          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M16.5 12.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.7c1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.6 1.3-2.7 0 0-2.4-.9-2.4-3.9zM14.1 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="2.5"/><line x1="11" y1="18" x2="13" y2="18"/></svg>}
    </div>
  );
}

function activeLabel(iso, current) {
  if (current) return 'Active now';
  if (!iso) return 'Unknown';
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 5) return 'Active now';
  return `Active ${timeAgo(iso)}`;
}

export default function Sessions() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null); // device | 'others'

  const load = useCallback(async () => {
    try {
      const r = await devicesApi.list();
      if (r.ok) { setData(r); setError(''); } else setError(r.error || 'Could not load devices');
    } catch { setError('No connection. Pull down to try again.'); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // keep "active now" honest
    return () => clearInterval(t);
  }, [load]);

  const revoke = async () => {
    const target = confirm; setConfirm(null);
    setBusy(target === 'others' ? 'others' : target.id);
    try {
      const r = target === 'others' ? await devicesApi.revokeOthers() : await devicesApi.revoke(target.id);
      if (!r.ok) setError(r.error || 'Could not sign out device');
    } catch { setError('No connection'); }
    setBusy(null); load();
  };

  const list = data?.devices || [];
  const others = list.filter(d => !d.is_current);

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader title="Active devices" />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '4px 16px' }}>
        <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6, margin: '0 4px 16px' }}>
          Every phone, tablet or computer signed in to your Showmine account. If you don’t recognise one, sign it out and change your password.
        </p>

        {error && <div style={{ background: 'rgba(229,9,20,.08)', border: '1px solid rgba(229,9,20,.3)', color: '#ff8080', borderRadius: 12, padding: '10px 14px', fontSize: '.8rem', marginBottom: 12 }}>{error}</div>}

        {!data && !error && [0, 1].map(i => <div key={i} className="dv-skel" style={{ height: 92, borderRadius: 16, marginBottom: 10 }} />)}

        {list.map(d => {
          const title = [d.manufacturer, d.model].filter(Boolean).join(' ') || (d.platform === 'web' ? 'Web browser' : 'Unknown device');
          const os = d.platform === 'android' ? `Android ${d.os_version || ''}` : d.platform === 'ios' ? `iOS ${d.os_version || ''}` : 'Web';
          const live = d.is_current || (d.last_active && Date.now() - new Date(d.last_active).getTime() < 5 * 60000);
          return (
            <div key={d.id} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start', padding: 16, marginBottom: 10, borderRadius: 16,
              background: d.is_current ? 'linear-gradient(135deg,rgba(229,9,20,.12),rgba(229,9,20,.03))' : '#101013',
              border: `1px solid ${d.is_current ? 'rgba(229,9,20,.35)' : 'rgba(255,255,255,.06)'}`,
            }}>
              <DeviceIcon platform={d.platform} model={d.model} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '.95rem' }}>{d.name && d.name !== d.model ? d.name : title}</span>
                  {d.is_current && <span style={{ fontSize: '.6rem', fontWeight: 900, background: '#e50914', color: '#fff', padding: '2px 8px', borderRadius: 20, letterSpacing: '.06em' }}>THIS DEVICE</span>}
                </div>
                {d.name && d.name !== d.model && <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{title}</div>}
                <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', marginTop: 4 }}>
                  {os}{d.app_version ? ` · App ${d.app_version}` : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', marginTop: 6, color: live ? '#4ade80' : 'rgba(255,255,255,.45)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: live ? '#4ade80' : 'rgba(255,255,255,.25)', boxShadow: live ? '0 0 8px #4ade80' : 'none' }} />
                  {activeLabel(d.last_active, d.is_current)}
                  <span style={{ color: 'rgba(255,255,255,.3)' }}>· {FLAGS(d.country)} {d.ip}</span>
                </div>
                <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.3)', marginTop: 3 }}>Signed in {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</div>
              </div>
              {!d.is_current && (
                <button onClick={() => setConfirm(d)} disabled={busy === d.id} style={{
                  flexShrink: 0, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#ff6b6b',
                  borderRadius: 10, padding: '7px 12px', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
                }}>{busy === d.id ? '…' : 'Sign out'}</button>
              )}
            </div>
          );
        })}

        {data && list.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.45)', padding: '2rem 0', fontSize: '.85rem' }}>
            No app devices recorded yet. Devices appear here after they sign in with this version of the app.
          </div>
        )}

        {others.length > 0 && (
          <button onClick={() => setConfirm('others')} disabled={busy === 'others'} style={{
            width: '100%', marginTop: 8, padding: 14, borderRadius: 14, background: 'rgba(229,9,20,.07)', border: '1px solid rgba(229,9,20,.25)',
            color: '#ff4d57', ...H, fontSize: '.95rem', letterSpacing: '.05em', textTransform: 'uppercase', cursor: 'pointer',
          }}>{busy === 'others' ? 'Signing out…' : `Sign out all other devices (${others.length})`}</button>
        )}
      </div>

      {confirm && (
        <div onClick={() => setConfirm(null)} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#141418', borderRadius: '22px 22px 0 0', padding: '22px 20px calc(env(safe-area-inset-bottom) + 20px)' }}>
            <div style={{ ...H, fontSize: '1.3rem', marginBottom: 6 }}>{confirm === 'others' ? 'Sign out all other devices?' : `Sign out ${[confirm.manufacturer, confirm.model].filter(Boolean).join(' ') || 'this device'}?`}</div>
            <div style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.55)', marginBottom: 18 }}>They’ll be signed out the next time the app connects, and will need your password to sign in again.</div>
            <button onClick={revoke} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e50914', color: '#fff', ...H, fontSize: '1rem', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 10 }}>Sign out</button>
            <button onClick={() => setConfirm(null)} style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      <style>{`@keyframes dvSh{0%{background-position:-400px 0}100%{background-position:400px 0}} .dv-skel{background:linear-gradient(90deg,#101013,#1a1a1f,#101013);background-size:800px 100%;animation:dvSh 1.3s linear infinite}`}</style>
    </div>
  );
}
