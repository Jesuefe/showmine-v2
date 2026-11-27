import { useEffect, useState } from 'react';
import Icon from './Icon';
import Avatar from './Avatar';
import { social } from '../api/extras';
import { RED, Spinner, timeAgo } from './ui';


// Comment list + composer. `type` is movie | episode | short.
export function CommentList({ type, id, onCount }) {
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setItems(null);
    social.comments(type, id).then((r) => {
      if (!live) return;
      setItems(r.ok ? r.items : []);
      if (r.ok) onCount?.(r.total);
    }).catch(() => live && setItems([]));
    return () => { live = false; };
  }, [type, id]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setError('');
    try {
      const r = await social.addComment(type, id, text.trim());
      if (r.ok) { setItems((list) => [r.comment, ...(list || [])]); setText(''); onCount?.((items?.length || 0) + 1); }
      else setError(r.error);
    } catch { setError('Could not post. Check your connection.'); }
    setBusy(false);
  };

  const remove = async (c) => {
    const r = await social.deleteComment(c.id).catch(() => null);
    if (r?.ok) setItems((list) => list.filter((x) => x.id !== c.id));
  };

  const like = async (c) => {
    const r = await social.likeComment(c.id).catch(() => null);
    if (r?.ok) setItems((list) => list.map((x) => (x.id === c.id ? { ...x, liked: r.liked, likes: r.count } : x)));
  };

  return (
    <div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Add a comment…"
          style={{ flex: 1, padding: '11px 13px', borderRadius: 22, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontSize: '.88rem', outline: 'none' }} />
        <button disabled={busy || !text.trim()} style={{ background: RED, color: '#fff', border: 'none', borderRadius: 22, padding: '0 16px', fontWeight: 700, cursor: 'pointer', opacity: busy || !text.trim() ? .5 : 1 }}>Post</button>
      </form>
      {error && <div style={{ color: RED, fontSize: '.8rem', marginBottom: 10 }}>{error}</div>}
      {items === null ? <Spinner /> : items.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', textAlign: 'center', padding: '20px 0' }}>No comments yet. Be the first.</p>
      ) : items.map((c) => (
        <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <Avatar user={{ name: c.name, avatar: c.avatar }} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>
              <strong style={{ color: 'rgba(255,255,255,.85)' }}>{c.name}</strong> · {timeAgo(c.created_at)}
            </div>
            <div style={{ fontSize: '.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.body}</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: '.72rem' }}>
              <button onClick={() => like(c)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: c.liked ? RED : 'rgba(255,255,255,.45)' }}>
                <Icon name="heart" size={14} style={{ display: 'inline-block', verticalAlign: '-2px', fill: c.liked ? 'currentColor' : 'none' }} /> {c.likes || ''}
              </button>
              {c.mine && <button onClick={() => remove(c)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(255,255,255,.45)' }}>Delete</button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Bottom sheet wrapper (used by Shorts).
export function CommentSheet({ type, id, open, onClose, onCount }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '72vh', overflowY: 'auto', background: '#111', borderRadius: '18px 18px 0 0', padding: '10px 16px calc(20px + env(safe-area-inset-bottom, 0px))', color: '#fff' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong>Comments</strong>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
        </div>
        <CommentList type={type} id={id} onCount={onCount} />
      </div>
    </div>
  );
}
