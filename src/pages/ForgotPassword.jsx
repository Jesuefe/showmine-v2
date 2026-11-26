import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '../api/extras';
import { PageHeader, Field, Button, Notice } from '../components/ui';

// Two steps: request a 6-digit code by email, then set a new password.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState({ kind: 'error', text: '' });
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true); setMsg({ kind: 'error', text: '' });
    try { await fn(); } catch { setMsg({ kind: 'error', text: 'Network problem. Check your connection and try again.' }); }
    finally { setBusy(false); }
  };

  const request = (e) => { e.preventDefault(); run(async () => {
    const r = await account.forgotRequest(email.trim());
    if (r.ok) { setStep('reset'); setMsg({ kind: 'ok', text: r.message }); } else setMsg({ kind: 'error', text: r.error });
  }); };

  const reset = (e) => { e.preventDefault(); run(async () => {
    const r = await account.forgotReset(email.trim(), code.trim(), password);
    if (r.ok) { setStep('done'); setMsg({ kind: 'ok', text: r.message }); } else setMsg({ kind: 'error', text: r.error });
  }); };

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      <PageHeader title="Reset password" />
      <div style={{ padding: '6px 20px 40px', maxWidth: 440, margin: '0 auto' }}>
        <Notice kind={msg.kind}>{msg.text}</Notice>
        {step === 'request' && (
          <form onSubmit={request}>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.88rem', lineHeight: 1.6, marginTop: 0 }}>
              Enter the email you signed up with. We'll send you a 6-digit code.
            </p>
            <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" loading={busy}>Send code</Button>
          </form>
        )}
        {step === 'reset' && (
          <form onSubmit={reset}>
            <Field label="6-digit code" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            <Field label="New password (8+ characters)" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" loading={busy}>Set new password</Button>
            <button type="button" onClick={() => setStep('request')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', marginTop: 16, width: '100%', cursor: 'pointer', fontSize: '.82rem' }}>
              Didn't get it? Send again
            </button>
          </form>
        )}
        {step === 'done' && <Button onClick={() => navigate('/login', { replace: true })}>Go to login</Button>}
      </div>
    </div>
  );
}
