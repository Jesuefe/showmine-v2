import { useState } from 'react';
import { api } from '../api';
import { C, COND, Card, H, Loading, ErrorBox, Badge, Sheet, Toggle, Input, TextArea, Btn, toast, confirmDialog, useApi, compact, ago } from '../ui';

export default function LivePush() {
  const [view, setView] = useState('live');
  return (
    <div>
      <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 4, margin: '12px 0 4px' }}>
        {[['live', 'Live channels'], ['push', 'Push notifications']].map(([id, l]) => (
          <button key={id} onClick={() => setView(id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontWeight: 800, fontSize: '.84rem', cursor: 'pointer', background: view === id ? C.red : 'transparent', color: '#fff', transition: 'background .2s' }}>{l}</button>
        ))}
      </div>
      {view === 'live' ? <Live /> : <Push />}
    </div>
  );
}

function Live() {
  const { data, error, loading, reload, setData } = useApi('live');
  const [edit, setEdit] = useState(null);

  const flip = async (ch, field) => {
    const v = +ch[field] ? 0 : 1;
    setData(d => ({ ...d, items: d.items.map(x => x.id === ch.id ? { ...x, [field]: v } : x) }));
    try { await api.post('live_save', { id: ch.id, [field]: v }); toast(`${ch.title}: ${field === 'is_live' ? (v ? 'ON AIR' : 'off air') : (v ? 'visible' : 'hidden')}`); }
    catch (e) { toast(e.message, 'err'); reload(); }
  };

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox error={error} retry={reload} />;
  const onAir = data.items.filter(c => +c.is_live && +c.is_active).length;
  return (
    <>
      <div style={{ fontSize: '.78rem', color: C.dim, margin: '14px 2px 10px' }}><b style={{ color: '#fff' }}>{onAir}</b> of {data.items.length} channels on air</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.items.map(ch => {
          const live = +ch.is_live && +ch.is_active;
          return (
            <Card key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, opacity: +ch.is_active ? 1 : .55 }}>
              <div onClick={() => setEdit(ch)} className="press" style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {ch.channel_icon || ch.thumbnail ? <img src={ch.channel_icon || ch.thumbnail} alt="" style={{ width: 46, height: 46, borderRadius: 12, objectFit: 'cover', background: '#fff' }} /> : <div style={{ width: 46, height: 46, borderRadius: 12, background: C.card2 }} />}
                  {live && <span style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', background: C.red, color: '#fff', fontSize: '.5rem', fontWeight: 900, padding: '1px 5px', borderRadius: 4, letterSpacing: '.08em' }}>LIVE</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.title}</div>
                  <div style={{ fontSize: '.72rem', color: C.faint }}>{ch.category || 'Channel'} · {compact(ch.total_views)} views</div>
                </div>
              </div>
              <button onClick={() => flip(ch, 'is_live')} className="press" style={{ padding: '8px 12px', borderRadius: 10, border: 'none', fontWeight: 900, fontSize: '.72rem', letterSpacing: '.05em', cursor: 'pointer', background: +ch.is_live ? C.red : 'rgba(255,255,255,.08)', color: '#fff', minWidth: 74 }}>
                {+ch.is_live ? '● ON AIR' : 'OFF AIR'}
              </button>
            </Card>
          );
        })}
      </div>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.title || ''}>
        {edit && <LiveEditor ch={edit} onSaved={() => { setEdit(null); reload(); }} />}
      </Sheet>
    </>
  );
}

function LiveEditor({ ch, onSaved }) {
  const [f, setF] = useState({ title: ch.title || '', description: ch.description || '', stream_url: ch.stream_url || '', is_live: !!+ch.is_live, is_active: !!+ch.is_active });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await api.post('live_save', { id: ch.id, ...f, is_live: f.is_live ? 1 : 0, is_active: f.is_active ? 1 : 0 }); toast('Channel saved'); onSaved(); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  return (
    <div>
      <Card style={{ padding: '2px 14px', marginBottom: 14 }}>
        <Toggle label="On air" sub="Shows the LIVE badge and plays the stream" on={f.is_live} onChange={v => setF({ ...f, is_live: v })} />
        <Toggle label="Visible in the app" on={f.is_active} onChange={v => setF({ ...f, is_active: v })} />
      </Card>
      <Input label="Channel name" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      <Input label="Stream URL (.m3u8)" placeholder="https://live.showmine.ng/…/index.m3u8" value={f.stream_url} onChange={e => setF({ ...f, stream_url: e.target.value })} />
      <TextArea label="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
      <Btn busy={busy} onClick={save} style={{ width: '100%' }}>Save channel</Btn>
    </div>
  );
}

function Push() {
  const stats = useApi('push_stats');
  const [f, setF] = useState({ title: '', body: '', url: '', target: 'all', user_id: '' });
  const [busy, setBusy] = useState(false);
  const send = async () => {
    const who = f.target === 'all' ? `all ${stats.data?.devices ?? ''} devices` : `user #${f.user_id}`;
    if (!(await confirmDialog({ title: 'Send notification?', message: `"${f.title}" goes to ${who} right away. This can't be undone.`, confirm: 'Send now' }))) return;
    setBusy(true);
    try {
      const r = await api.post('push_send', { title: f.title, body: f.body, url: f.url, user_id: f.target === 'user' ? +f.user_id : 0 });
      toast(`Sent to ${r.sent} device${r.sent === 1 ? '' : 's'}${r.failed ? ` · ${r.failed} failed` : ''}`);
      setF({ title: '', body: '', url: '', target: 'all', user_id: '' }); stats.reload();
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const ok = f.title.trim() && f.body.trim() && (f.target === 'all' || +f.user_id > 0);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '14px 0 4px' }}>
        <Card style={{ padding: '10px 14px' }}><div style={{ fontSize: '.62rem', color: C.faint, fontWeight: 800, letterSpacing: '.08em' }}>DEVICES</div><div style={{ fontFamily: COND, fontSize: '1.6rem', fontWeight: 900 }}>{stats.data?.devices ?? '—'}</div></Card>
        <Card style={{ padding: '10px 14px' }}><div style={{ fontSize: '.62rem', color: C.faint, fontWeight: 800, letterSpacing: '.08em' }}>USERS REACHABLE</div><div style={{ fontFamily: COND, fontSize: '1.6rem', fontWeight: 900 }}>{stats.data?.users ?? '—'}</div></Card>
      </div>

      <H>Preview</H>
      <div style={{ background: 'linear-gradient(135deg,#1f2937,#111827)', borderRadius: 18, padding: 14, border: `1px solid ${C.line}` }}>
        <div style={{ background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 12, display: 'flex', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: C.red, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '.8rem' }}>S</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.6)' }}>Showmine TV · now</div>
            <div style={{ fontWeight: 800, fontSize: '.88rem' }}>{f.title || 'Notification title'}</div>
            <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.35 }}>{f.body || 'Your message shows here.'}</div>
          </div>
        </div>
      </div>

      <H>Compose</H>
      <Input label={`Title (${f.title.length}/65)`} maxLength={65} placeholder="New on Showmine 🎬" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      <TextArea label={`Message (${f.body.length}/200)`} maxLength={200} placeholder="Watch the season finale now…" value={f.body} onChange={e => setF({ ...f, body: e.target.value })} />
      <Input label="Open in app (optional)" placeholder="/watch/movie-slug" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['all', 'Everyone'], ['user', 'One user']].map(([id, l]) => (
          <button key={id} onClick={() => setF({ ...f, target: id })} style={{ flex: 1, padding: '11px 0', borderRadius: 12, fontWeight: 800, fontSize: '.84rem', cursor: 'pointer', background: f.target === id ? 'rgba(229,9,20,.15)' : C.card, color: '#fff', border: `1px solid ${f.target === id ? C.red : C.line}` }}>{l}</button>
        ))}
      </div>
      {f.target === 'user' && <Input label="User ID" inputMode="numeric" value={f.user_id} onChange={e => setF({ ...f, user_id: e.target.value.replace(/\D/g, '') })} />}
      <Btn busy={busy} disabled={!ok} onClick={send} style={{ width: '100%', padding: 14 }}>Send notification</Btn>

      {stats.data?.recent?.length > 0 && (
        <>
          <H>Sent from the app</H>
          {stats.data.recent.map((r, i) => {
            let s = {}; try { s = JSON.parse(r.after_state || '{}'); } catch { /* ignore */ }
            return (
              <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: '.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                <Badge color={C.green}>{s.sent} sent</Badge>
                <span style={{ fontSize: '.7rem', color: C.faint }}>{ago(r.created_at)}</span>
              </Card>
            );
          })}
        </>
      )}
    </>
  );
}
