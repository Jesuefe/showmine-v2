import { useNavigate } from 'react-router-dom';

// Small shared building blocks in the app's existing look
// (black background, Showmine red #e50914, Barlow Condensed headings).
export const RED = '#e50914';
export const heading = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800 };

export function PageHeader({ title, back = true }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px 10px' }}>
      {back && (
        <button aria-label="Back" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
      )}
      <h1 style={{ ...heading, fontSize: '1.45rem', margin: 0 }}>{title}</h1>
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      {label && <span style={{ display: 'block', fontSize: '.72rem', color: 'rgba(255,255,255,.5)', marginBottom: 6, fontWeight: 600 }}>{label}</span>}
      <input {...props} style={{
        width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 10,
        background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
        color: '#fff', fontSize: '.95rem', outline: 'none', ...(props.style || {}),
      }} />
    </label>
  );
}

export function Button({ children, variant = 'primary', loading, style, ...props }) {
  const styles = {
    primary: { background: RED, color: '#fff', border: 'none' },
    ghost: { background: 'rgba(255,255,255,.06)', color: '#fff', border: '1px solid rgba(255,255,255,.12)' },
    danger: { background: 'rgba(229,9,20,.08)', color: RED, border: '1px solid rgba(229,9,20,.3)' },
  }[variant];
  return (
    <button disabled={loading || props.disabled} {...props} style={{
      width: '100%', padding: '14px', borderRadius: 10, cursor: 'pointer', fontSize: '.95rem',
      ...heading, letterSpacing: '.05em', textTransform: 'uppercase',
      opacity: loading || props.disabled ? 0.6 : 1, ...styles, ...style,
    }}>{loading ? 'Please wait…' : children}</button>
  );
}

export function Notice({ kind = 'error', children }) {
  if (!children) return null;
  const c = kind === 'error' ? RED : '#22c55e';
  return (
    <div role="status" style={{ padding: '11px 13px', borderRadius: 10, marginBottom: 14, fontSize: '.84rem',
      color: c, background: kind === 'error' ? 'rgba(229,9,20,.08)' : 'rgba(34,197,94,.08)',
      border: `1px solid ${kind === 'error' ? 'rgba(229,9,20,.25)' : 'rgba(34,197,94,.25)'}` }}>{children}</div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #1a1a1a', borderTop: `3px solid ${RED}`, borderRadius: '50%', animation: 'smspin .7s linear infinite' }} />
      <style>{'@keyframes smspin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}

export function timeAgo(date) {
  const s = Math.max(1, (Date.now() - new Date(String(date).replace(' ', 'T')).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(String(date).replace(' ', 'T')).toLocaleDateString();
}
