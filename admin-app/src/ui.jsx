import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from './api';

export const C = {
  bg: '#0b0b0d', card: '#141418', card2: '#1b1b21', line: 'rgba(255,255,255,.08)', text: '#f4f4f5',
  dim: 'rgba(255,255,255,.55)', faint: 'rgba(255,255,255,.35)', red: '#e50914', green: '#22c55e', amber: '#f59e0b', blue: '#3b82f6',
};
export const COND = "'Barlow Condensed', sans-serif";

/* ── data hook ── */
export function useApi(action, params, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params || {});
  const load = useCallback(() => {
    setLoading(true); setError('');
    return api.get(action, params).then(d => { setData(d); return d; }).catch(e => setError(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [action, key, ...deps]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load, setData };
}

/* ── toast ── */
let pushToast = () => {};
export const toast = (msg, kind = 'ok') => pushToast({ msg, kind, id: Date.now() + Math.random() });
export function Toaster() {
  const [list, setList] = useState([]);
  useEffect(() => { pushToast = (t) => { setList(l => [...l, t]); setTimeout(() => setList(l => l.filter(x => x.id !== t.id)), 2800); }; }, []);
  return createPortal(
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(86px + env(safe-area-inset-bottom))', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
      {list.map(t => (
        <div key={t.id} style={{ background: t.kind === 'err' ? '#3b0d10' : '#0f2a19', border: `1px solid ${t.kind === 'err' ? 'rgba(239,68,68,.5)' : 'rgba(34,197,94,.45)'}`, color: '#fff', padding: '10px 16px', borderRadius: 12, fontSize: '.84rem', fontWeight: 600, boxShadow: '0 10px 30px rgba(0,0,0,.5)', animation: 'smUp .25s ease-out', maxWidth: '88vw' }}>{t.msg}</div>
      ))}
    </div>, document.body);
}

/* ── primitives ── */
export const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} className={onClick ? 'press' : ''} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, ...style }}>{children}</div>
);
export const H = ({ children, right, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 2px 10px', ...style }}>
    <div style={{ fontFamily: COND, fontSize: '1.08rem', fontWeight: 800, letterSpacing: '.02em' }}>{children}</div>{right}
  </div>
);
export function Btn({ children, onClick, kind = 'primary', busy, disabled, style, small }) {
  const k = { primary: { background: C.red, color: '#fff' }, ghost: { background: 'rgba(255,255,255,.07)', color: '#fff', border: `1px solid ${C.line}` }, green: { background: C.green, color: '#04130a' }, danger: { background: 'rgba(239,68,68,.12)', color: '#f87171', border: '1px solid rgba(239,68,68,.35)' } }[kind];
  return (
    <button onClick={onClick} disabled={disabled || busy} className="press" style={{ border: 'none', borderRadius: 12, padding: small ? '8px 12px' : '12px 16px', fontWeight: 800, fontSize: small ? '.78rem' : '.88rem', cursor: 'pointer', opacity: disabled || busy ? .55 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', ...k, ...style }}>
      {busy ? <Spinner size={14} /> : children}
    </button>
  );
}
export const Input = ({ label, style, ...p }) => (
  <label style={{ display: 'block', marginBottom: 12 }}>
    {label && <div style={{ fontSize: '.68rem', fontWeight: 700, color: C.dim, marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</div>}
    <input {...p} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', background: C.card2, border: `1px solid ${C.line}`, borderRadius: 12, color: C.text, fontSize: '.92rem', outline: 'none', fontFamily: 'inherit', ...style }} />
  </label>
);
export const TextArea = ({ label, ...p }) => (
  <label style={{ display: 'block', marginBottom: 12 }}>
    {label && <div style={{ fontSize: '.68rem', fontWeight: 700, color: C.dim, marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</div>}
    <textarea {...p} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', background: C.card2, border: `1px solid ${C.line}`, borderRadius: 12, color: C.text, fontSize: '.9rem', outline: 'none', fontFamily: 'inherit', minHeight: 90, resize: 'vertical' }} />
  </label>
);
export const Select = ({ label, options, ...p }) => (
  <label style={{ display: 'block', marginBottom: 12 }}>
    {label && <div style={{ fontSize: '.68rem', fontWeight: 700, color: C.dim, marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</div>}
    <select {...p} style={{ width: '100%', padding: '12px 14px', background: C.card2, border: `1px solid ${C.line}`, borderRadius: 12, color: C.text, fontSize: '.92rem', outline: 'none', fontFamily: 'inherit' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
);
export function Toggle({ on, onChange, label, sub }) {
  return (
    <div onClick={() => onChange(!on)} className="press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 2px', borderBottom: `1px solid ${C.line}`, cursor: 'pointer' }}>
      <div><div style={{ fontWeight: 700, fontSize: '.9rem' }}>{label}</div>{sub && <div style={{ fontSize: '.72rem', color: C.faint, marginTop: 2 }}>{sub}</div>}</div>
      <div style={{ width: 46, height: 27, borderRadius: 999, background: on ? C.green : 'rgba(255,255,255,.15)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }} />
      </div>
    </div>
  );
}
export const Chip = ({ on, children, onClick }) => (
  <button onClick={onClick} className="press" style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', background: on ? '#fff' : 'rgba(255,255,255,.07)', color: on ? '#000' : '#fff', border: `1px solid ${on ? '#fff' : C.line}`, fontFamily: 'inherit' }}>{children}</button>
);
export const Badge = ({ children, color = C.dim }) => (
  <span style={{ display: 'inline-block', fontSize: '.62rem', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, color, background: `${color}1f`, border: `1px solid ${color}55` }}>{children}</span>
);
export const Spinner = ({ size = 22 }) => (
  <span style={{ width: size, height: size, border: `${Math.max(2, size / 9)}px solid rgba(255,255,255,.15)`, borderTopColor: C.red, borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
);
export const Loading = () => <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><Spinner size={30} /></div>;
export const ErrorBox = ({ error, retry }) => (
  <Card style={{ textAlign: 'center', padding: 24, marginTop: 16 }}>
    <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 10 }}>{error}</div>
    {retry && <Btn kind="ghost" small onClick={retry}>Try again</Btn>}
  </Card>
);
export const Empty = ({ children }) => <div style={{ textAlign: 'center', color: C.faint, padding: '2.5rem 1rem', fontSize: '.88rem' }}>{children}</div>;

export function SearchBar({ value, onChange, placeholder }) {
  const [v, setV] = useState(value);
  const t = useRef();
  useEffect(() => setV(value), [value]);
  return (
    <div style={{ position: 'relative' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
      <input value={v} placeholder={placeholder} onChange={e => { setV(e.target.value); clearTimeout(t.current); const x = e.target.value; t.current = setTimeout(() => onChange(x), 350); }}
        style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px 13px 42px', background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, color: C.text, fontSize: '.95rem', outline: 'none', fontFamily: 'inherit' }} />
    </div>
  );
}

/* ── bottom sheet ── */
export function Sheet({ open, onClose, title, children, full }) {
  useEffect(() => {
    if (!open) return;
    const back = (e) => { e.preventDefault?.(); onClose(); };
    window.__smSheetBack = back;
    return () => { if (window.__smSheetBack === back) window.__smSheetBack = null; };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fade .2s' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, height: full ? '92vh' : 'auto', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: C.bg, borderRadius: '22px 22px 0 0', border: `1px solid ${C.line}`, borderBottom: 'none', animation: 'sheetUp .3s cubic-bezier(.2,.9,.3,1)' }}>
        <div style={{ padding: '10px 18px 6px', flexShrink: 0 }}>
          <div style={{ width: 42, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontFamily: COND, fontSize: '1.35rem', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
            <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: '8px 18px calc(24px + env(safe-area-inset-bottom))', flex: 1 }}>{children}</div>
      </div>
    </div>, document.body);
}

/* ── confirm dialog ── */
let askConfirm = () => Promise.resolve(false);
export const confirmDialog = (opts) => askConfirm(opts);
export function ConfirmHost() {
  const [st, setSt] = useState(null);
  useEffect(() => { askConfirm = (o) => new Promise(res => setSt({ ...o, res })); }, []);
  if (!st) return null;
  const done = (v) => { st.res(v); setSt(null); };
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fade .15s' }}>
      <div style={{ width: '100%', maxWidth: 360, background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 20, animation: 'pop .2s ease-out' }}>
        <div style={{ fontFamily: COND, fontSize: '1.3rem', fontWeight: 900, marginBottom: 6 }}>{st.title}</div>
        <div style={{ color: C.dim, fontSize: '.88rem', lineHeight: 1.5, marginBottom: 18 }}>{st.message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn kind="ghost" style={{ flex: 1 }} onClick={() => done(false)}>Cancel</Btn>
          <Btn kind={st.danger ? 'danger' : 'primary'} style={{ flex: 1 }} onClick={() => done(true)}>{st.confirm || 'Confirm'}</Btn>
        </div>
      </div>
    </div>, document.body);
}

/* ── formatting ── */
export const naira = (n) => '₦' + Math.round(Number(n) || 0).toLocaleString('en-NG');
export const compact = (n) => { n = Number(n) || 0; return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n); };
export function ago(ts) {
  if (!ts) return '—';
  const d = new Date(String(ts).replace(' ', 'T'));
  const s = (Date.now() - d.getTime()) / 1000;
  if (isNaN(s)) return ts;
  if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 86400 * 30) return Math.floor(s / 86400) + 'd ago';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
export const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(String(ts).replace(' ', 'T')); return isNaN(d) ? ts : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); };
export const secs = (v) => { if (v == null || v === '') return ''; const n = Number(v); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
export const parseSecs = (s) => { s = String(s || '').trim(); if (!s) return null; if (s.includes(':')) { const [m, x] = s.split(':'); return (parseInt(m, 10) || 0) * 60 + (parseInt(x, 10) || 0); } return parseInt(s, 10) || 0; };

export function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect width="48" height="48" rx="12" fill="#e50914" />
      <path d="M14 15h20a3 3 0 013 3v12a3 3 0 01-3 3H14a3 3 0 01-3-3V18a3 3 0 013-3z" fill="none" stroke="#fff" strokeWidth="2.6" />
      <path d="M21 20l8 4-8 4z" fill="#fff" />
      <path d="M18 37h12" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

