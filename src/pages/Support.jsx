import { useState, useEffect, useRef, useCallback } from 'react';
import { IconBadge } from '../components/Icon';
import { isNativeApp } from '../utils/platform';
import { useNavigate, useParams } from 'react-router-dom';
import { support as supportApi } from '../api/extras';
import { useSupport } from '../context/SupportContext';
import { PageHeader, timeAgo } from '../components/ui';

const STATUS = {
  open: { label: 'Open', color: '#60a5fa' },
  in_review: { label: 'In review', color: '#60a5fa' },
  escalated: { label: 'In review', color: '#60a5fa' },
  pending_user: { label: 'New reply', color: '#e50914' },
  resolved: { label: 'Resolved', color: '#4ade80' },
  closed: { label: 'Closed', color: 'rgba(255,255,255,.4)' },
};
const CAT = { technical: 'wrench', billing: 'card', account: 'user', content: 'film', ads: 'megaphone', other: 'message' };

function Badge({ status }) {
  const s = STATUS[status] || STATUS.open;
  return <span style={{ fontSize: '.62rem', fontWeight: 900, letterSpacing: '.05em', textTransform: 'uppercase', color: s.color, border: `1px solid ${s.color}`, padding: '2px 8px', borderRadius: 20 }}>{s.label}</span>;
}

export function SupportList() {
  const navigate = useNavigate();
  const { openSupport, shakeOn, setShake } = useSupport();
  const [tickets, setTickets] = useState(null);

  useEffect(() => {
    supportApi.list().then(r => setTickets(r.ok ? r.tickets : [])).catch(() => setTickets([]));
  }, []);

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 40 }}>
      <PageHeader title="Help & support" />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '4px 16px' }}>
        <div style={{ borderRadius: 20, padding: 20, marginBottom: 16, background: 'radial-gradient(400px 200px at 0% 0%, rgba(229,9,20,.35), transparent 70%), #101013', border: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', fontWeight: 800 }}>How can we help?</div>
          <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.55)', margin: '4px 0 14px' }}>Message the Showmine team about playback, payments or your account.</div>
          <button onClick={() => openSupport('manual')} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 12, padding: '12px 20px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', cursor: 'pointer' }}>New message</button>
        </div>

        {isNativeApp() && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: '#101013', border: '1px solid rgba(255,255,255,.06)', marginBottom: 20, cursor: 'pointer' }}>
          <IconBadge name="vibrate" size={40} />
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontWeight: 700, fontSize: '.88rem' }}>Shake to get help</span>
            <span style={{ display: 'block', fontSize: '.72rem', color: 'rgba(255,255,255,.45)' }}>Shake your phone anywhere in the app to report a problem</span>
          </span>
          <span onClick={(e) => { e.preventDefault(); setShake(!shakeOn); }} role="switch" aria-checked={shakeOn} style={{ width: 46, height: 28, borderRadius: 14, background: shakeOn ? '#e50914' : 'rgba(255,255,255,.15)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: shakeOn ? 21 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
          </span>
        </label>
        )}

        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.7rem', fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', margin: '0 4px 8px' }}>Your tickets</div>
        {tickets === null && <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', padding: 16 }}>Loading…</div>}
        {tickets?.length === 0 && <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', padding: '20px 4px' }}>No tickets yet. If something isn’t working, we’re one message away.</div>}
        {tickets?.map(t => (
          <button key={t.id} onClick={() => navigate(`/support/${t.id}`)} style={{
            display: 'flex', gap: 12, width: '100%', textAlign: 'left', padding: 14, marginBottom: 8, borderRadius: 14, cursor: 'pointer', color: '#fff',
            background: t.status === 'pending_user' ? 'rgba(229,9,20,.08)' : '#101013', border: `1px solid ${t.status === 'pending_user' ? 'rgba(229,9,20,.35)' : 'rgba(255,255,255,.06)'}`,
          }}>
            <IconBadge name={CAT[t.category] || 'message'} size={40} color="#9ca3af" />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</span>
                <Badge status={t.status} />
              </span>
              <span style={{ display: 'block', fontSize: '.75rem', color: 'rgba(255,255,255,.45)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.last_sender === 'support' ? 'Support: ' : 'You: '}{t.last_message}
              </span>
              <span style={{ display: 'block', fontSize: '.66rem', color: 'rgba(255,255,255,.3)', marginTop: 4 }}>{t.code} · {timeAgo(t.updated_at)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SupportThread() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  const load = useCallback(() => supportApi.get(id).then(r => { if (r.ok) setData(r); else setError(r.error); }).catch(() => setError('No connection')), [id]);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [data?.messages?.length]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { const r = await supportApi.reply(id, text.trim()); if (r.ok) { setText(''); load(); } else setError(r.error); } catch { setError('No connection'); }
    setBusy(false);
  };

  const t = data?.ticket;
  const closed = t && ['resolved', 'closed'].includes(t.status);

  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title={t ? t.code : 'Ticket'} />
      {t && (
        <div style={{ padding: '0 20px 10px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <span style={{ flex: 1, fontSize: '.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</span>
          <Badge status={t.status} />
        </div>
      )}
      <div style={{ flex: 1, padding: '16px', maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {error && <div style={{ color: '#ff8080', fontSize: '.82rem', marginBottom: 10 }}>{error}</div>}
        {data?.messages?.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 18, fontSize: '.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              background: m.from === 'me' ? '#e50914' : '#1a1a20', borderBottomRightRadius: m.from === 'me' ? 4 : 18, borderBottomLeftRadius: m.from === 'me' ? 18 : 4,
            }}>
              {m.from === 'support' && <div style={{ fontSize: '.66rem', fontWeight: 800, color: '#f5c542', marginBottom: 3 }}>SHOWMINE SUPPORT</div>}
              {m.message}
              <div style={{ fontSize: '.62rem', opacity: .6, marginTop: 4, textAlign: 'right' }}>{timeAgo(m.created_at)}</div>
            </div>
          </div>
        ))}
        {data && data.messages.length > 0 && data.messages[data.messages.length - 1].from === 'me' && !closed && (
          <div style={{ textAlign: 'center', fontSize: '.72rem', color: 'rgba(255,255,255,.35)', margin: '14px 0' }}>Our team usually replies within a few hours.</div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ position: 'sticky', bottom: 0, padding: '10px 12px calc(env(safe-area-inset-bottom) + 10px)', background: 'rgba(0,0,0,.92)', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: 8 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={1} placeholder={closed ? 'Reply to reopen this ticket…' : 'Write a message…'}
          style={{ flex: 1, resize: 'none', background: '#141418', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, color: '#fff', padding: '11px 16px', fontSize: '.9rem', fontFamily: 'inherit', outline: 'none', maxHeight: 120 }} />
        <button onClick={send} disabled={busy || !text.trim()} aria-label="Send" style={{ width: 46, height: 46, borderRadius: '50%', border: 'none', background: text.trim() ? '#e50914' : 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  );
}
