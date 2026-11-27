import { useState } from 'react';
import { api, setToken } from '../api';
import { C, COND, Btn, Input, Logo } from '../ui';

export default function Login({ onDone }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setBusy(true); setError('');
    try {
      const d = await api.post('login', { username: username.trim(), password, device: navigator.userAgent.slice(0, 180) });
      setToken(d.token);
      onDone(d.admin);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: `radial-gradient(120% 70% at 50% 0%, rgba(229,9,20,.22), transparent 60%), ${C.bg}` }}>
      <form onSubmit={submit} className="rise" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
          <Logo size={72} />
          <div style={{ fontFamily: COND, fontWeight: 900, fontSize: '2rem', letterSpacing: '.06em', marginTop: 16 }}>SHOWMINE <span style={{ color: C.red }}>ADMIN</span></div>
          <div style={{ color: C.dim, fontSize: '.88rem', marginTop: 4 }}>Sign in with your admin account</div>
        </div>
        <Input label="Username or email" value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" autoCorrect="off" autoComplete="username" />
        <div style={{ position: 'relative' }}>
          <Input label="Password" type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: 60 }} />
          <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 10, top: 33, background: 'none', border: 'none', color: C.dim, fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}>{show ? 'Hide' : 'Show'}</button>
        </div>
        {error && <div style={{ color: '#f87171', fontSize: '.84rem', margin: '0 0 12px', textAlign: 'center' }}>{error}</div>}
        <Btn busy={busy} disabled={!username || !password} style={{ width: '100%', padding: 14, fontSize: '1rem' }}>Sign in</Btn>
        <div style={{ textAlign: 'center', color: C.faint, fontSize: '.72rem', marginTop: 18, lineHeight: 1.5 }}>Same login as admin.showmine.ng. Sessions last 30 days on this device.</div>
      </form>
    </div>
  );
}
