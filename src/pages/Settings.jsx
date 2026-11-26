import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { account } from '../api/extras';
import { PageHeader, Field, Button, Notice, heading } from '../components/ui';

const card = { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 18, marginBottom: 16 };
const h2 = { ...heading, fontSize: '1.05rem', margin: '0 0 14px', letterSpacing: '.03em', textTransform: 'uppercase' };

export default function Settings() {
  const { user, setUser } = useAuth();
  const { lang, setLang, languages } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.full_name || '');
  const [profileMsg, setProfileMsg] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwMsg, setPwMsg] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault(); setSavingProfile(true); setProfileMsg({});
    try {
      const r = await account.update({ full_name: name.trim(), preferred_lang: lang });
      if (r.ok) {
        const u = { ...user, full_name: r.user.full_name };
        setUser(u); localStorage.setItem('showmine_user', JSON.stringify(u));
        setProfileMsg({ kind: 'ok', text: 'Saved' });
      } else setProfileMsg({ kind: 'error', text: r.error });
    } catch { setProfileMsg({ kind: 'error', text: 'Network problem. Try again.' }); }
    setSavingProfile(false);
  };

  const changePassword = async (e) => {
    e.preventDefault(); setSavingPw(true); setPwMsg({});
    try {
      const r = await account.changePassword(pw.current, pw.next);
      if (r.ok) { setPw({ current: '', next: '' }); setPwMsg({ kind: 'ok', text: 'Password changed' }); }
      else setPwMsg({ kind: 'error', text: r.error });
    } catch { setPwMsg({ kind: 'error', text: 'Network problem. Try again.' }); }
    setSavingPw(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: 90 }}>
      <PageHeader title="Settings" />
      <div style={{ padding: '6px 20px', maxWidth: 560, margin: '0 auto' }}>

        <form style={card} onSubmit={saveProfile}>
          <h2 style={h2}>Profile</h2>
          <Notice kind={profileMsg.kind}>{profileMsg.text}</Notice>
          <Field label="Email" value={user?.email || ''} disabled style={{ opacity: .6 }} />
          <Field label="Full name" required maxLength={150} value={name} onChange={(e) => setName(e.target.value)} />
          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={{ display: 'block', fontSize: '.72rem', color: 'rgba(255,255,255,.5)', marginBottom: 6, fontWeight: 600 }}>App language</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ width: '100%', padding: '13px 14px', borderRadius: 10, background: '#111', border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontSize: '.95rem' }}>
              {Object.entries(languages || {}).map(([code, l]) => <option key={code} value={code}>{l.flag} {l.name}</option>)}
            </select>
          </label>
          <Button type="submit" loading={savingProfile}>Save profile</Button>
        </form>

        <form style={card} onSubmit={changePassword}>
          <h2 style={h2}>Password</h2>
          <Notice kind={pwMsg.kind}>{pwMsg.text}</Notice>
          <Field label="Current password" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <Field label="New password (8+ characters)" type="password" autoComplete="new-password" minLength={8} required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <Button type="submit" variant="ghost" loading={savingPw}>Change password</Button>
        </form>

        <div style={card}>
          <h2 style={h2}>Account</h2>
          <Button variant="ghost" onClick={() => navigate('/sessions')}>Manage devices</Button>
          <Button variant="danger" style={{ marginTop: 10 }} onClick={() => navigate('/delete-account')}>Delete account</Button>
        </div>
      </div>
    </div>
  );
}
