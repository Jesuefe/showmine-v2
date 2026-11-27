import { useState } from 'react';
import { api } from '../api';
import { C, COND, Card, Chip, SearchBar, Loading, ErrorBox, Empty, Badge, Sheet, Input, Select, Btn, H, toast, confirmDialog, useApi, ago, fmtDate, naira } from '../ui';
import { Pager } from './Content';

const FILTERS = [{ id: '', label: 'All users' }, { id: 'subscribed', label: 'Subscribed' }, { id: 'banned', label: 'Banned' }];

export default function Users() {
  const [view, setView] = useState('users');
  return (
    <div>
      <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 4, margin: '12px 0 4px' }}>
        {[['users', 'Users'], ['coupons', 'Promo codes']].map(([id, l]) => (
          <button key={id} onClick={() => setView(id)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', fontWeight: 800, fontSize: '.84rem', cursor: 'pointer', background: view === id ? C.red : 'transparent', color: '#fff', transition: 'background .2s' }}>{l}</button>
        ))}
      </div>
      {view === 'users' ? <UserList /> : <Coupons />}
    </div>
  );
}

const isSubbed = (u) => u.plan_expires_at && new Date(String(u.plan_expires_at).replace(' ', 'T')) > new Date();

function Avatar({ u, size = 40 }) {
  const url = u.avatar && /^https?:/.test(u.avatar) ? u.avatar : null;
  const initials = (u.full_name || u.email || '?').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const hue = (u.id * 47) % 360;
  return url
    ? <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `hsl(${hue} 55% 32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: size * .36 }}>{initials}</div>;
}

function UserList() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const { data, error, loading, reload } = useApi('users_list', { q, filter, page });
  return (
    <>
      <div style={{ position: 'sticky', top: 'calc(env(safe-area-inset-top) + 62px)', zIndex: 10, background: C.bg, padding: '10px 0 8px' }}>
        <SearchBar value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Name, email, phone or user ID…" />
        <div className="hscroll" style={{ marginTop: 10 }}>{FILTERS.map(f => <Chip key={f.id} on={filter === f.id} onClick={() => { setFilter(f.id); setPage(1); }}>{f.label}</Chip>)}</div>
      </div>
      {loading && !data ? <Loading /> : error && !data ? <ErrorBox error={error} retry={reload} /> : (
        <>
          <div style={{ fontSize: '.74rem', color: C.faint, margin: '4px 2px 10px' }}>{data.total.toLocaleString()} users{loading ? ' · updating…' : ''}</div>
          {data.items.length === 0 && <Empty>No users found.</Empty>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.items.map(u => (
              <Card key={u.id} onClick={() => setOpen(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, cursor: 'pointer' }}>
                <Avatar u={u} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.full_name || 'No name'}</div>
                  <div style={{ fontSize: '.72rem', color: C.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email || u.phone} · joined {ago(u.created_at)}</div>
                </div>
                {+u.is_banned ? <Badge color="#ef4444">Banned</Badge> : isSubbed(u) ? <Badge color={C.green}>{u.plan_name || 'Premium'}</Badge> : <Badge>Free</Badge>}
              </Card>
            ))}
          </div>
          <Pager page={page} total={data.total} per={30} onPage={setPage} />
        </>
      )}
      <Sheet open={!!open} onClose={() => setOpen(null)} title="User" full>
        {open && <UserDetail id={open} onChanged={reload} />}
      </Sheet>
    </>
  );
}

function UserDetail({ id, onChanged }) {
  const { data, error, loading, reload } = useApi('user_get', { id });
  const [plan, setPlan] = useState('');
  const [days, setDays] = useState('30');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} retry={reload} />;
  const u = data.user;
  const subbed = isSubbed(u);
  const planId = plan || String(data.plans.find(p => /standard/i.test(p.name))?.id || data.plans[0]?.id || '');
  const refresh = () => { reload(); onChanged(); };

  const grant = async () => {
    const p = data.plans.find(x => String(x.id) === planId);
    if (!(await confirmDialog({ title: 'Give free access?', message: `${u.full_name || u.email} gets ${days} days of ${p?.name}. No payment is taken.`, confirm: 'Grant access' }))) return;
    setBusy('grant');
    try { const r = await api.post('user_grant', { user_id: id, plan_id: +planId, days: +days, note }); toast(`${r.plan} until ${fmtDate(r.expires_at)}`); setNote(''); refresh(); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(''); }
  };
  const revoke = async () => {
    if (!(await confirmDialog({ title: 'End subscription now?', message: 'Their access stops immediately. Payments are not refunded from here.', confirm: 'End access', danger: true }))) return;
    setBusy('revoke');
    try { await api.post('user_revoke', { user_id: id }); toast('Subscription ended'); refresh(); } catch (e) { toast(e.message, 'err'); } finally { setBusy(''); }
  };
  const ban = async () => {
    const to = !+u.is_banned;
    if (!(await confirmDialog({ title: to ? 'Ban this user?' : 'Unban this user?', message: to ? 'They are signed out everywhere and cannot sign in.' : 'They can sign in again.', confirm: to ? 'Ban' : 'Unban', danger: to }))) return;
    setBusy('ban');
    try { await api.post('user_ban', { user_id: id, banned: to }); toast(to ? 'User banned' : 'User unbanned'); refresh(); } catch (e) { toast(e.message, 'err'); } finally { setBusy(''); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <Avatar u={u} size={60} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: COND, fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.1 }}>{u.full_name || 'No name'}</div>
          <div style={{ fontSize: '.8rem', color: C.dim, wordBreak: 'break-all' }}>{u.email}</div>
          <div style={{ fontSize: '.76rem', color: C.faint }}>{u.phone || 'No phone'} · {u.country || '—'} · #{u.id}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        <Stat label="Plan" value={subbed ? (u.plan_name || 'Premium') : 'Free'} color={subbed ? C.green : undefined} />
        <Stat label={subbed ? 'Expires' : 'Expired'} value={u.plan_expires_at ? fmtDate(u.plan_expires_at) : '—'} />
        <Stat label="Devices" value={data.devices} />
      </div>
      <div style={{ fontSize: '.76rem', color: C.faint, margin: '0 2px 4px' }}>Joined {fmtDate(u.created_at)} · last sign-in {ago(u.last_login_at)} · email {+u.email_verified ? 'verified' : 'not verified'}</div>

      <H>Give access</H>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
          <Select label="Plan" value={planId} onChange={e => setPlan(e.target.value)} options={data.plans.map(p => ({ value: String(p.id), label: p.name }))} />
          <Select label="Length" value={days} onChange={e => setDays(e.target.value)} options={[['1', '1 day'], ['3', '3 days'], ['7', '1 week'], ['30', '30 days'], ['90', '90 days'], ['365', '1 year']].map(([v, l]) => ({ value: v, label: l }))} />
        </div>
        <Input label="Reason (optional)" placeholder="e.g. payment issue, promo winner" value={note} onChange={e => setNote(e.target.value)} />
        <Btn kind="green" busy={busy === 'grant'} onClick={grant} style={{ width: '100%' }}>Grant access</Btn>
        <div style={{ fontSize: '.7rem', color: C.faint, marginTop: 8 }}>If they already have this plan, the days are added on top.</div>
      </Card>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {subbed && <Btn kind="danger" busy={busy === 'revoke'} onClick={revoke} style={{ flex: 1 }}>End subscription</Btn>}
        <Btn kind={+u.is_banned ? 'ghost' : 'danger'} busy={busy === 'ban'} onClick={ban} style={{ flex: 1 }}>{+u.is_banned ? 'Unban user' : 'Ban user'}</Btn>
      </div>

      <H>Subscription history</H>
      {data.subs.length === 0 && <div style={{ color: C.faint, fontSize: '.84rem' }}>No subscriptions.</div>}
      {data.subs.map(s => (
        <Card key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '.86rem' }}>{s.plan || 'Plan'} <span style={{ color: C.faint, fontWeight: 500 }}>· {fmtDate(s.starts_at)} → {fmtDate(s.expires_at)}</span></div>
            <div style={{ fontSize: '.7rem', color: C.faint }}>{s.gateway}{s.gateway === 'admin' || s.gateway === 'coupon' ? ` · ${s.gateway_ref || ''}` : ''}</div>
          </div>
          <Badge color={s.status === 'active' ? C.green : s.status === 'pending' ? C.amber : C.dim}>{s.status}</Badge>
          <span style={{ fontWeight: 800, fontSize: '.84rem' }}>{s.currency === 'USD' ? `$${s.amount_paid}` : naira(s.amount_paid)}</span>
        </Card>
      ))}

      {data.watched.length > 0 && (
        <>
          <H>Recently watched</H>
          <Card style={{ padding: 6 }}>
            {data.watched.map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, fontSize: '.82rem', borderBottom: i < data.watched.length - 1 ? `1px solid ${C.line}` : 'none' }}>
                <span style={{ fontWeight: 700 }}>{w.title}</span><span style={{ color: C.faint }}>{ago(w.updated_at)}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

const Stat = ({ label, value, color }) => (
  <Card style={{ padding: '10px 12px' }}>
    <div style={{ fontSize: '.6rem', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: C.faint }}>{label}</div>
    <div style={{ fontWeight: 800, fontSize: '.9rem', marginTop: 4, color: color || '#fff' }}>{value}</div>
  </Card>
);

function Coupons() {
  const { data, error, loading, reload, setData } = useApi('coupons');
  const plans = useApi('plans');
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ code: '', name: '', type: 'days', value: '7', plan_id: '', max_uses: '100', expires_at: '' });
  const [busy, setBusy] = useState(false);
  const gen = () => setF(x => ({ ...x, code: 'SM' + Math.random().toString(36).slice(2, 8).toUpperCase() }));

  const create = async () => {
    setBusy(true);
    try { await api.post('coupon_save', { ...f, value: +f.value, max_uses: +f.max_uses, plan_id: +f.plan_id || null }); toast(`Code ${f.code.toUpperCase()} created`); setCreating(false); setF({ code: '', name: '', type: 'days', value: '7', plan_id: '', max_uses: '100', expires_at: '' }); reload(); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const toggle = async (c) => {
    const to = !+c.is_active;
    setData(d => ({ ...d, items: d.items.map(x => x.id === c.id ? { ...x, is_active: to ? 1 : 0 } : x) }));
    try { await api.post('coupon_toggle', { id: c.id, active: to }); toast(to ? 'Code turned on' : 'Code turned off'); } catch (e) { toast(e.message, 'err'); reload(); }
  };
  const label = (c) => c.type === 'days' ? `${c.value} days` : c.type === 'plan' ? `30 days of ${c.plan_name || 'plan'}` : `${c.value} min`;

  return (
    <>
      <H right={!creating && <Btn small onClick={() => { setCreating(true); gen(); }}>+ New code</Btn>}>Promo codes</H>
      {creating && (
        <Card style={{ marginBottom: 12, animation: 'pop .2s' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}><Input label="Code" value={f.code} onChange={e => setF({ ...f, code: e.target.value.toUpperCase() })} style={{ letterSpacing: '.1em', fontWeight: 800 }} /></div>
            <Btn kind="ghost" small onClick={gen} style={{ marginBottom: 12 }}>Random</Btn>
          </div>
          <Input label="Name" placeholder="e.g. NYSC camp promo" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Select label="Gives" value={f.type} onChange={e => setF({ ...f, type: e.target.value })} options={[{ value: 'days', label: 'Days of Standard' }, { value: 'plan', label: '30 days of a plan' }, { value: 'duration_mins', label: 'Minutes' }]} />
            {f.type === 'plan'
              ? <Select label="Plan" value={f.plan_id} onChange={e => setF({ ...f, plan_id: e.target.value })} options={[{ value: '', label: 'Choose…' }, ...(plans.data?.plans || []).map(p => ({ value: String(p.id), label: p.name }))]} />
              : <Input label={f.type === 'days' ? 'Days' : 'Minutes'} inputMode="numeric" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} />}
            <Input label="Max uses (0 = unlimited)" inputMode="numeric" value={f.max_uses} onChange={e => setF({ ...f, max_uses: e.target.value })} />
            <Input label="Expires (optional)" type="date" value={f.expires_at} onChange={e => setF({ ...f, expires_at: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="ghost" style={{ flex: 1 }} onClick={() => setCreating(false)}>Cancel</Btn>
            <Btn busy={busy} style={{ flex: 1 }} onClick={create} disabled={f.code.length < 4 || (f.type === 'plan' && !f.plan_id)}>Create code</Btn>
          </div>
        </Card>
      )}
      {loading && !data ? <Loading /> : error ? <ErrorBox error={error} retry={reload} /> : data.items.length === 0 ? <Empty>No promo codes yet. Create one to share with users.</Empty> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.items.map(c => {
            const used = +c.used_count, max = +c.max_uses;
            const expired = c.expires_at && new Date(String(c.expires_at).replace(' ', 'T')) < new Date();
            return (
              <Card key={c.id} style={{ opacity: +c.is_active && !expired ? 1 : .6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: '1rem', letterSpacing: '.08em' }}>{c.code}</div>
                    <div style={{ fontSize: '.74rem', color: C.faint }}>{c.name} · {label(c)}{c.expires_at ? ` · ends ${fmtDate(c.expires_at)}` : ''}</div>
                  </div>
                  {expired ? <Badge color="#ef4444">Expired</Badge> : <Btn small kind={+c.is_active ? 'ghost' : 'green'} onClick={() => toggle(c)}>{+c.is_active ? 'Turn off' : 'Turn on'}</Btn>}
                </div>
                <div style={{ marginTop: 10, height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: max ? `${Math.min(100, used / max * 100)}%` : '0%', height: '100%', background: C.red }} />
                </div>
                <div style={{ fontSize: '.7rem', color: C.faint, marginTop: 5 }}>{used} used{max ? ` of ${max}` : ' · unlimited'}</div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
