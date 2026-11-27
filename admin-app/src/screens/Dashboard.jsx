import { useEffect, useState } from 'react';
import { C, COND, Card, H, Chip, Loading, ErrorBox, Badge, naira, compact, ago, useApi } from '../ui';

const METRICS = [
  { id: 'revenue', label: 'Revenue', color: C.green, fmt: naira },
  { id: 'signups', label: 'Sign-ups', color: C.blue, fmt: (n) => String(n) },
  { id: 'views', label: 'Views', color: C.red, fmt: (n) => String(n) },
];

export default function Dashboard({ go, onTickets }) {
  const { data, error, loading, reload } = useApi('stats');
  const [metric, setMetric] = useState('revenue');

  useEffect(() => { if (data) onTickets?.(data.tickets_open); }, [data, onTickets]);
  useEffect(() => { const t = setInterval(() => reload(), 60000); return () => clearInterval(t); }, [reload]);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox error={error} retry={reload} />;
  const d = data;
  const m = METRICS.find(x => x.id === metric);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 2px 12px', color: C.dim, fontSize: '.78rem' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, animation: 'pulse 1.6s infinite' }} />
        <b style={{ color: '#fff' }}>{d.online}</b> online now · refreshes every minute
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <Kpi label="Revenue · 30 days" value={naira(d.revenue.month)} sub={`${naira(d.revenue.today)} today`} color={C.green} />
        <Kpi label="Active subscribers" value={compact(d.subs.active)} sub={`+${d.subs.new_week} paid this week`} color={C.amber} onClick={() => go('users')} />
        <Kpi label="Users" value={compact(d.users.total)} sub={`+${d.users.today} today · +${d.users.week} this week`} color={C.blue} onClick={() => go('users')} />
        <Kpi label="Views today" value={compact(d.views_today)} sub={`${d.content.titles} titles · ${d.content.episodes} episodes`} color={C.red} onClick={() => go('content')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <MiniStat label="Open tickets" value={d.tickets_open} warn={d.tickets_open > 0} onClick={() => go('support')} />
        <MiniStat label="Live channels on" value={d.live_now} onClick={() => go('live')} />
      </div>

      <H right={<div className="hscroll">{METRICS.map(x => <Chip key={x.id} on={metric === x.id} onClick={() => setMetric(x.id)}>{x.label}</Chip>)}</div>}>Last 14 days</H>
      <Card style={{ padding: '16px 12px 10px' }}>
        <Bars days={d.days} k={metric} color={m.color} fmt={m.fmt} />
      </Card>

      <H>Top titles</H>
      <Card style={{ padding: 6 }}>
        {d.top.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px', borderBottom: i < d.top.length - 1 ? `1px solid ${C.line}` : 'none' }}>
            <span style={{ fontFamily: COND, fontWeight: 900, fontSize: '1.2rem', width: 18, color: i < 3 ? C.red : C.faint }}>{i + 1}</span>
            {t.cover_image ? <img src={t.cover_image} alt="" style={{ width: 34, height: 48, objectFit: 'cover', borderRadius: 6 }} /> : <div style={{ width: 34, height: 48, borderRadius: 6, background: C.card2 }} />}
            <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: '.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
            <span style={{ color: C.dim, fontSize: '.78rem', fontWeight: 700 }}>{compact(t.view_count)} views</span>
          </div>
        ))}
      </Card>

      <H>Latest subscriptions</H>
      <Card style={{ padding: 6 }}>
        {d.recent_subs.length === 0 && <div style={{ color: C.faint, padding: 12, fontSize: '.85rem' }}>No subscriptions yet.</div>}
        {d.recent_subs.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderBottom: i < d.recent_subs.length - 1 ? `1px solid ${C.line}` : 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.full_name || s.email || 'User'}</div>
              <div style={{ fontSize: '.72rem', color: C.faint }}>{s.plan || 'Plan'} · {ago(s.created_at)}</div>
            </div>
            <Badge color={s.gateway === 'coupon' ? C.amber : s.gateway === 'admin' ? C.blue : C.green}>{s.gateway}</Badge>
            <span style={{ fontWeight: 800, fontSize: '.86rem', minWidth: 64, textAlign: 'right' }}>{s.currency === 'USD' ? `$${Number(s.amount_paid).toFixed(2)}` : naira(s.amount_paid)}</span>
          </div>
        ))}
      </Card>
      <Activity />
    </div>
  );
}

function Kpi({ label, value, sub, color, onClick }) {
  return (
    <Card onClick={onClick} style={{ position: 'relative', overflow: 'hidden', padding: '14px 14px 12px', cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%', background: `${color}22` }} />
      <div style={{ fontSize: '.66rem', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: C.dim }}>{label}</div>
      <div style={{ fontFamily: COND, fontSize: '1.9rem', fontWeight: 900, lineHeight: 1.1, marginTop: 6, color: '#fff' }}>{value}</div>
      <div style={{ fontSize: '.7rem', color: C.faint, marginTop: 4 }}>{sub}</div>
    </Card>
  );
}
const MiniStat = ({ label, value, warn, onClick }) => (
  <Card onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer' }}>
    <span style={{ fontSize: '.8rem', color: C.dim, fontWeight: 700 }}>{label}</span>
    <span style={{ fontFamily: COND, fontSize: '1.4rem', fontWeight: 900, color: warn ? C.red : '#fff' }}>{value}</span>
  </Card>
);

function Bars({ days, k, color, fmt }) {
  const [sel, setSel] = useState(days.length - 1);
  const max = Math.max(1, ...days.map(d => d[k]));
  const total = days.reduce((a, d) => a + d[k], 0);
  const cur = days[sel];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px 12px' }}>
        <div>
          <div style={{ fontFamily: COND, fontSize: '1.5rem', fontWeight: 900 }}>{fmt(cur[k])}</div>
          <div style={{ fontSize: '.72rem', color: C.faint }}>{new Date(cur.d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: '.9rem' }}>{fmt(total)}</div>
          <div style={{ fontSize: '.7rem', color: C.faint }}>14-day total</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
        {days.map((d, i) => (
          <button key={d.d} onClick={() => setSel(i)} aria-label={d.d} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <div style={{ width: '100%', height: `${Math.max(3, (d[k] / max) * 100)}%`, borderRadius: '5px 5px 2px 2px', background: i === sel ? color : `${color}55`, transition: 'height .4s cubic-bezier(.2,.9,.3,1), background .2s' }} />
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.62rem', color: C.faint, marginTop: 6, padding: '0 2px' }}>
        <span>{new Date(days[0].d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span><span>Today</span>
      </div>
    </div>
  );
}

function Activity() {
  const { data } = useApi('activity');
  if (!data?.items?.length) return null;
  return (
    <>
      <H>Admin activity</H>
      <Card style={{ padding: 6 }}>
        {data.items.slice(0, 12).map((a, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px', fontSize: '.8rem', borderBottom: i < 11 ? `1px solid ${C.line}` : 'none' }}>
            <span><b>{a.username || 'admin'}</b> <span style={{ color: C.dim }}>{String(a.action).replace(/^app:/, '').replace(/_/g, ' ')}{a.target_id ? ` #${a.target_id}` : ''}</span></span>
            <span style={{ color: C.faint, flexShrink: 0 }}>{ago(a.created_at)}</span>
          </div>
        ))}
      </Card>
    </>
  );
}
