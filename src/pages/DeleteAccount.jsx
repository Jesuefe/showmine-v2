import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { account } from '../api/extras';
import { PageHeader, Field, Button, Notice, RED } from '../components/ui';

// Public route (also the web URL given to Google Play: v2.showmine.ng/delete-account).
export default function DeleteAccount() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (confirm !== 'DELETE') { setMsg({ kind: 'error', text: 'Type DELETE in capital letters to confirm' }); return; }
    setBusy(true); setMsg({});
    try {
      const r = await account.remove(password);
      if (r.ok) {
        localStorage.removeItem('showmine_token');
        localStorage.removeItem('showmine_user');
        setUser(null); setDone(true);
      } else setMsg({ kind: 'error', text: r.error });
    } catch { setMsg({ kind: 'error', text: 'Network problem. Try again.' }); }
    setBusy(false);
  };

  const p = { color: 'rgba(255,255,255,.7)', fontSize: '.9rem', lineHeight: 1.65 };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingBottom: 60 }}>
      <PageHeader title="Delete account" />
      <div style={{ padding: '6px 20px', maxWidth: 520, margin: '0 auto' }}>
        {done ? (
          <>
            <Notice kind="ok">Your Showmine account and personal data have been deleted.</Notice>
            <Button onClick={() => navigate('/onboarding', { replace: true })}>Done</Button>
          </>
        ) : (
          <>
            <p style={p}>Deleting your Showmine account is permanent. We remove:</p>
            <ul style={{ ...p, paddingLeft: 20, marginTop: 0 }}>
              <li>your profile, login and active devices</li>
              <li>watch history, My List, likes and notification settings</li>
              <li>your comments (they are blanked)</li>
            </ul>
            <p style={p}>
              Payment records are kept only as long as tax and accounting law requires, and are no longer linked to your profile.
              An active subscription is not refunded and ends with the account.
            </p>

            {user ? (
              <form onSubmit={submit} style={{ marginTop: 18 }}>
                <Notice kind={msg.kind}>{msg.text}</Notice>
                <Field label={`Password for ${user.email}`} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <Field label='Type "DELETE" to confirm' autoCapitalize="characters" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                <Button type="submit" loading={busy} style={{ background: RED }}>Permanently delete my account</Button>
              </form>
            ) : (
              <div style={{ marginTop: 18 }}>
                <p style={p}>Log in to the account you want to delete, then come back to this page (Profile → Settings → Delete account in the app).</p>
                <Button onClick={() => navigate('/login')}>Log in</Button>
                <p style={{ ...p, fontSize: '.8rem', color: 'rgba(255,255,255,.45)', marginTop: 16 }}>
                  Can't log in? Email <a href="mailto:support@showmine.ng?subject=Delete%20my%20account" style={{ color: RED }}>support@showmine.ng</a> from
                  the address on your account and we'll delete it within 7 days.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
