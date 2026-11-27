import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useKids } from '../context/KidsContext';
import { useProfiles, profileAvatarUser } from '../context/ProfileContext';
import Avatar, { AvatarArt, AVATARS } from '../components/Avatar';
import { tapHaptic, successHaptic } from '../utils/feel';

const H = { fontFamily: "'Barlow Condensed', sans-serif" };

function EditSheet({ profile, onClose }) {
  const { save, remove } = useProfiles();
  const { user, setUser } = useAuth();
  const isNew = profile.id === undefined;
  const [name, setName] = useState(profile.name || '');
  const [avatar, setAvatar] = useState(profile.avatar && profile.avatar !== 'auto' ? profile.avatar : AVATARS[(Date.now() / 1000 | 0) % AVATARS.length].id);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);

  const submit = async () => {
    if (!name.trim()) { setErr('Please enter a name'); return; }
    setBusy(true); setErr('');
    try {
      const r = await save({ id: isNew ? -1 : profile.id, name: name.trim(), avatar });
      if (r.ok) { if (profile.main && user) { const u = { ...user, avatar: `sm:${avatar}` }; setUser(u); try { localStorage.setItem('showmine_user', JSON.stringify(u)); } catch { /* ignore */ } } successHaptic(); onClose(); } else setErr(r.error || 'Could not save');
    } catch { setErr('No connection. Try again.'); }
    setBusy(false);
  };
  const del = async () => {
    setBusy(true);
    try { const r = await remove(profile.id); if (r.ok) onClose(); else setErr(r.error); } catch { setErr('No connection. Try again.'); }
    setBusy(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'pfFade .2s ease both' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#111', borderRadius: '22px 22px 0 0', padding: '20px 20px calc(env(safe-area-inset-bottom) + 24px)', border: '1px solid rgba(255,255,255,.08)', animation: 'pfUp .3s cubic-bezier(.2,.9,.3,1) both', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)', margin: '0 auto 16px' }} />
        <div style={{ ...H, fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: 16 }}>{isNew ? 'Add profile' : 'Edit profile'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <AvatarArt style={avatar} size={72} radius={18} />
          {profile.main ? (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{name}</div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)' }}>Main profile · name comes from your account</div>
            </div>
          ) : (
            <input autoFocus={isNew} value={name} onChange={e => setName(e.target.value.slice(0, 24))} placeholder="Name"
              style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.15)', background: '#1a1a1a', color: '#fff', fontSize: '1.05rem', fontWeight: 700, outline: 'none' }} />
          )}
        </div>
        <div style={{ fontSize: '.7rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 10 }}>Choose a picture</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(62px, 1fr))', gap: 10, marginBottom: 20 }}>
          {AVATARS.map(a => (
            <button key={a.id} onClick={() => { tapHaptic('light'); setAvatar(a.id); }} aria-label={a.label} style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 16, outline: avatar === a.id ? '3px solid #e50914' : 'none', outlineOffset: 2, transform: avatar === a.id ? 'scale(1.05)' : 'none', transition: 'transform .15s' }}>
              <AvatarArt style={a.id} size={62} radius={14} styleProp={{ width: '100%', height: 'auto' }} />
            </button>
          ))}
        </div>
        {err && <div style={{ color: '#ff8080', fontSize: '.82rem', marginBottom: 10 }}>{err}</div>}
        <button onClick={submit} disabled={busy} style={{ width: '100%', padding: 15, borderRadius: 12, border: 'none', background: '#e50914', color: '#fff', ...H, fontWeight: 800, fontSize: '1.05rem', letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: busy ? .6 : 1 }}>
          {busy ? 'Saving…' : isNew ? 'Create profile' : 'Save'}
        </button>
        {!isNew && !profile.main && (confirm ? (
          <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: 'rgba(229,9,20,.08)', border: '1px solid rgba(229,9,20,.3)' }}>
            <div style={{ fontSize: '.85rem', marginBottom: 10 }}>Delete <b>{profile.name}</b>? Their watch history and My List will be removed.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={del} disabled={busy} style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: '#e50914', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Delete</button>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,.15)', background: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Keep</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} style={{ width: '100%', marginTop: 10, padding: 13, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'none', color: 'rgba(255,255,255,.7)', fontWeight: 700, cursor: 'pointer' }}>Delete profile</button>
        ))}
      </div>
    </div>
  );
}

export default function Profiles() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { active: kidsActive } = useKids();
  const { profiles, currentId, max, select } = useProfiles();
  const [manage, setManage] = useState(!!location.state?.manage);
  const [editing, setEditing] = useState(null);
  const next = location.state?.next && !location.state.next.startsWith('/profiles') ? location.state.next : '/';

  const pick = (p) => {
    if (manage) { setEditing(p); return; }
    tapHaptic('medium');
    select(p.id);
    navigate(next, { replace: true });
  };

  const tile = 'clamp(92px, 26vw, 140px)';
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(900px 500px at 50% -10%, rgba(229,9,20,.18), transparent 60%), #000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'calc(env(safe-area-inset-top) + 40px) 20px 40px' }}>
      <style>{`
        @keyframes pfIn { from { opacity: 0; transform: translateY(18px) scale(.94); } to { opacity: 1; transform: none; } }
        @keyframes pfFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pfUp { from { transform: translateY(100%); } to { transform: none; } }
        @keyframes pfWiggle { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-2deg); } 75% { transform: rotate(2deg); } }
        .pf-tile { transition: transform .18s ease; }
        .pf-tile:active { transform: scale(.94); }
      `}</style>
      <img src="https://v2.showmine.ng/brand/logo.jpg" alt="" style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 18 }} />
      <h1 style={{ ...H, fontSize: 'clamp(1.8rem, 6vw, 2.6rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.02em', margin: '0 0 30px', textAlign: 'center' }}>
        {manage ? 'Manage profiles' : 'Who’s watching?'}
      </h1>

      {!profiles ? (
        <div style={{ width: 36, height: 36, border: '3px solid #333', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22, maxWidth: 680 }}>
          {profiles.map((p, i) => (
            <button key={p.id} className="pf-tile" onClick={() => pick(p)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: tile, animation: `pfIn .45s cubic-bezier(.2,.9,.3,1) ${i * .07}s both` }}>
              <div style={{ position: 'relative', width: tile, aspectRatio: '1', animation: manage ? 'pfWiggle .5s ease-in-out infinite' : 'none' }}>
                <Avatar user={profileAvatarUser(p, user)} size="100%" radius={20} style={{ width: '100%', height: '100%', boxShadow: !manage && p.id === currentId ? '0 0 0 3px #fff' : 'none' }} />
                {manage && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
                  </div>
                )}
              </div>
              <span style={{ fontSize: '.95rem', fontWeight: 700, color: p.id === currentId && !manage ? '#fff' : 'rgba(255,255,255,.7)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            </button>
          ))}

          {!manage && (
            <button className="pf-tile" onClick={() => navigate(kidsActive ? '/kids' : '/kids-setup')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: tile, animation: `pfIn .45s cubic-bezier(.2,.9,.3,1) ${profiles.length * .07}s both` }}>
              <div style={{ width: tile, aspectRatio: '1', borderRadius: 20, background: 'linear-gradient(135deg,#f472b6,#a78bfa 50%,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 'clamp(1.3rem,5vw,1.9rem)', color: '#1a1033' }}>Kids</span>
              </div>
              <span style={{ fontSize: '.95rem', fontWeight: 700, color: 'rgba(255,255,255,.7)' }}>Kids</span>
            </button>
          )}

          {profiles.length < max && (
            <button className="pf-tile" onClick={() => setEditing({})} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: tile, animation: `pfIn .45s cubic-bezier(.2,.9,.3,1) ${(profiles.length + 1) * .07}s both` }}>
              <div style={{ width: tile, aspectRatio: '1', borderRadius: 20, border: '2px dashed rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.8"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <span style={{ fontSize: '.95rem', fontWeight: 700, color: 'rgba(255,255,255,.55)' }}>Add profile</span>
            </button>
          )}
        </div>
      )}

      {profiles && (
        <button onClick={() => (manage && location.state?.manage ? navigate(-1) : setManage(m => !m))} style={{ marginTop: 40, padding: '11px 28px', borderRadius: 8, border: '1px solid rgba(255,255,255,.35)', background: manage ? '#fff' : 'transparent', color: manage ? '#000' : 'rgba(255,255,255,.8)', ...H, fontWeight: 800, fontSize: '1rem', letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
          {manage ? 'Done' : 'Manage profiles'}
        </button>
      )}

      {editing && <EditSheet profile={editing} onClose={() => setEditing(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
