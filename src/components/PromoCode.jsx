import { useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const COND = "'Barlow Condensed', sans-serif";

export default function PromoCode() {
  const { setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const redeem = async (e) => {
    e?.preventDefault();
    const c = code.trim();
    if (!c || busy) return;
    setBusy(true); setError('');
    try {
      const res = await client.post('/subscribe.php?action=redeem', { code: c });
      if (res.data?.ok) {
        setDone(res.data);
        try {
          const me = await client.get('/auth.php?action=me');
          if (me.data?.ok) { setUser(me.data.user); localStorage.setItem('showmine_user', JSON.stringify(me.data.user)); }
        } catch { /* refreshes on next focus */ }
      } else setError(res.data?.error || 'That code did not work.');
    } catch { setError('Network error. Please try again.'); }
    finally { setBusy(false); }
  };

  if (done) {
    const until = new Date(done.expires_at.replace(' ', 'T'));
    return (
      <div style={{ margin: '0 auto 2rem', maxWidth: 480, padding: '18px 20px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(34,197,94,.14), rgba(34,197,94,.04))', border: '1px solid rgba(34,197,94,.35)', textAlign: 'center', animation: 'pcIn .35s ease-out' }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>🎉</div>
        <div style={{ fontFamily: COND, fontSize: '1.35rem', fontWeight: 900 }}>Code applied!</div>
        <div style={{ fontSize: '.86rem', color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
          You've got <b>{done.granted}</b> of {done.plan_name}{isNaN(until) ? '' : <> · until {until.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</>}.
        </div>
        <button onClick={() => { window.location.href = '/'; }} style={{ marginTop: 14, background: '#22c55e', color: '#000', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 800, cursor: 'pointer' }}>Start watching</button>
        <style>{'@keyframes pcIn{from{opacity:0;transform:scale(.96)}}'}</style>
      </div>
    );
  }

  return (
    <div style={{ margin: '0 auto 2rem', maxWidth: 480 }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto', background: 'none', border: '1px dashed rgba(255,255,255,.25)', color: 'rgba(255,255,255,.75)', borderRadius: 10, padding: '10px 16px', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>
          Have a promo code?
        </button>
      ) : (
        <form onSubmit={redeem} style={{ display: 'flex', gap: 8, animation: 'pcIn .25s ease-out' }}>
          <input autoFocus value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }} placeholder="Enter code" maxLength={40}
            style={{ flex: 1, minWidth: 0, padding: '12px 14px', background: '#111', border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,.15)'}`, borderRadius: 10, color: '#fff', fontSize: '.95rem', letterSpacing: '.08em', fontWeight: 700, outline: 'none', fontFamily: 'inherit' }} />
          <button type="submit" disabled={busy || !code.trim()} style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: 10, padding: '0 20px', fontWeight: 800, cursor: 'pointer', opacity: busy || !code.trim() ? .6 : 1 }}>{busy ? '…' : 'Apply'}</button>
        </form>
      )}
      {error && <div style={{ color: '#f87171', fontSize: '.8rem', marginTop: 8, textAlign: 'center' }}>{error}</div>}
      <style>{'@keyframes pcIn{from{opacity:0;transform:translateY(4px)}}'}</style>
    </div>
  );
}
