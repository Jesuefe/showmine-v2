import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { C, Card, Chip, Loading, ErrorBox, Empty, Badge, Sheet, Btn, toast, useApi, ago } from '../ui';

const STATUSES = [{ id: 'open', label: 'Open' }, { id: 'closed', label: 'Closed' }, { id: 'all', label: 'All' }];
const STATUS_COLOR = { open: C.red, in_review: C.amber, escalated: '#ef4444', pending_user: C.blue, resolved: C.green, closed: C.dim };
const STATUS_LABEL = { open: 'Open', in_review: 'In review', escalated: 'Escalated', pending_user: 'Waiting on user', resolved: 'Resolved', closed: 'Closed' };

export default function Support({ onCount }) {
  const [status, setStatus] = useState('open');
  const [open, setOpen] = useState(null);
  const { data, error, loading, reload } = useApi('tickets', { status });
  useEffect(() => { if (data && status === 'open') onCount?.(data.items.length); }, [data, status, onCount]);

  return (
    <div>
      <div className="hscroll" style={{ margin: '14px 0 12px' }}>{STATUSES.map(s => <Chip key={s.id} on={status === s.id} onClick={() => setStatus(s.id)}>{s.label}</Chip>)}</div>
      {loading && !data ? <Loading /> : error && !data ? <ErrorBox error={error} retry={reload} /> : data.items.length === 0 ? (
        <Empty>{status === 'open' ? 'Inbox zero. No open tickets right now. 🎉' : 'No tickets here.'}</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.items.map(t => (
            <Card key={t.id} onClick={() => setOpen(t.id)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: '.7rem', color: C.faint, fontFamily: 'ui-monospace, monospace' }}>{t.ticket_code}</span>
                <Badge color={STATUS_COLOR[t.status] || C.dim}>{STATUS_LABEL[t.status] || t.status}</Badge>
                {t.priority === 'high' || t.priority === 'urgent' ? <Badge color="#ef4444">{t.priority}</Badge> : null}
                <span style={{ marginLeft: 'auto', fontSize: '.7rem', color: C.faint }}>{ago(t.updated_at)}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '.92rem' }}>{t.subject}</div>
              <div style={{ fontSize: '.78rem', color: C.dim, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.last_sender === 'support' ? 'You: ' : ''}{t.last_message || '—'}
              </div>
              <div style={{ fontSize: '.7rem', color: C.faint, marginTop: 4 }}>{t.full_name || t.email || 'User'} · {t.category}</div>
            </Card>
          ))}
        </div>
      )}
      <Sheet open={!!open} onClose={() => { setOpen(null); reload(); }} title="Ticket" full>
        {open && <Thread id={open} />}
      </Sheet>
    </div>
  );
}

function Thread({ id }) {
  const { data, error, loading, reload } = useApi('ticket_get', { id });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [data]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  const t = data.ticket;

  const send = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try { await api.post('ticket_reply', { id, message: msg.trim() }); setMsg(''); toast('Reply sent'); reload(); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const setStatus = async (s) => {
    try { await api.post('ticket_status', { id, status: s }); toast(`Marked ${STATUS_LABEL[s].toLowerCase()}`); reload(); } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{t.subject}</div>
      <div style={{ fontSize: '.74rem', color: C.faint, margin: '4px 0 10px' }}>{t.ticket_code} · {t.full_name || 'User'} · {t.email} · {t.category}</div>
      <div className="hscroll" style={{ marginBottom: 14 }}>
        {['in_review', 'pending_user', 'escalated', 'resolved', 'closed'].map(s => (
          <Chip key={s} on={t.status === s} onClick={() => setStatus(s)}>{STATUS_LABEL[s]}</Chip>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {data.messages.map(m => {
          const mine = m.sender_type === 'support';
          const sys = m.sender_type === 'system';
          return (
            <div key={m.id} style={{ alignSelf: sys ? 'center' : mine ? 'flex-end' : 'flex-start', maxWidth: sys ? '100%' : '82%' }}>
              <div style={{ padding: sys ? '4px 10px' : '10px 13px', borderRadius: sys ? 999 : mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: sys ? 'rgba(255,255,255,.05)' : mine ? C.red : C.card2, fontSize: sys ? '.72rem' : '.88rem', color: sys ? C.faint : '#fff', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {m.message}
                {m.attachment && <a href={m.attachment} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 6, color: '#fff', fontSize: '.76rem', textDecoration: 'underline' }}>Attachment</a>}
              </div>
              {!sys && <div style={{ fontSize: '.62rem', color: C.faint, marginTop: 3, textAlign: mine ? 'right' : 'left' }}>{mine ? 'Support' : 'User'} · {ago(m.created_at)}</div>}
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <div style={{ position: 'sticky', bottom: 0, background: C.bg, paddingTop: 8, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Write a reply…" rows={2}
          style={{ flex: 1, padding: '12px 14px', background: C.card2, border: `1px solid ${C.line}`, borderRadius: 14, color: '#fff', fontSize: '.9rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
        <Btn busy={busy} disabled={!msg.trim()} onClick={send} style={{ height: 48 }}>Send</Btn>
      </div>
    </div>
  );
}
