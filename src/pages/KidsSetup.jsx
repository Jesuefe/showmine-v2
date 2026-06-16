import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

function PINInput({ label, onComplete, error }) {
  const [pin, setPin] = useState('');

  useEffect(() => { if (error) setPin(''); }, [error]);

  const handleKey = (k) => {
    if (k === 'del') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const newPin = pin + k;
    setPin(newPin);
    if (newPin.length === 4) setTimeout(() => onComplete(newPin), 150);
  };

  return (
    <div>
      <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', marginBottom: '1.2rem', textAlign: 'center' }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: '1.8rem' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,.2)',
            background: i < pin.length ? '#e50914' : 'transparent',
            transition: 'background .15s'
          }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {['1','2','3','4','5','6','7','8','9','','0','del'].map(k => (
          <button key={k} onClick={() => k && handleKey(k)} style={{
            padding: '16px', borderRadius: 10,
            background: k === 'del' ? 'rgba(229,9,20,.08)' : k ? 'rgba(255,255,255,.06)' : 'transparent',
            border: k === 'del' ? '1px solid rgba(229,9,20,.15)' : k ? '1px solid rgba(255,255,255,.08)' : 'none',
            color: k === 'del' ? '#e50914' : '#fff',
            fontSize: k === 'del' ? '.75rem' : '1.3rem', fontWeight: 700,
            cursor: k ? 'pointer' : 'default', fontFamily: 'inherit'
          }}>{k === 'del' ? 'DEL' : k}</button>
        ))}
      </div>
    </div>
  );
}

export default function KidsSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('loading');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client.get('/kids.php?action=status')
      .then(r => {
        if (r.data.ok) {
          if (r.data.is_kids_mode) {
            navigate('/kids');
          } else {
            setStep('info');
          }
        }
      })
      .catch(() => setStep('info'));
  }, []);

  const enableKidsMode = async () => {
    setLoading(true);
    try {
      const res = await client.post('/kids.php?action=enable', {});
      if (res.data.ok) {
        navigate('/kids');
      } else {
        setError(res.data.error || 'Failed to enable Kids Mode');
        setStep('info');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleFirstPin = (pin) => {
    setFirstPin(pin);
    setError('');
    setStep('confirm_pin');
  };

  const handleConfirmPin = async (pin) => {
    if (pin !== firstPin) {
      setError('PINs do not match. Try again.');
      setFirstPin('');
      setStep('set_pin');
      return;
    }
    setLoading(true);
    try {
      await client.post('/kids.php?action=set_pin', { pin });
      await client.post('/kids.php?action=enable', {});
      navigate('/kids');
    } catch {
      setError('Failed to set PIN');
      setStep('set_pin');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem', marginBottom: '1.5rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <div style={{ maxWidth: 380, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 900, marginBottom: '.4rem' }}>Kids Mode</h1>
          <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>A safe viewing experience for children</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.3)', borderRadius: 8, padding: '.75rem 1rem', color: '#ff6b6b', fontSize: '.82rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>
        )}

        {step === 'info' && (
          <div>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px', marginBottom: '1.5rem' }}>
              {[
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, text: 'Only age-appropriate content for kids' },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, text: 'PIN-protected exit keeps kids safe' },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>, text: 'Educational and entertaining content' },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>, text: 'Fun and child-friendly interface' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 3 ? 14 : 0 }}>
                  {item.icon}
                  <span style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.65)' }}>{item.text}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setStep('set_pin')} style={{
              width: '100%', padding: '14px', background: '#e50914', border: 'none',
              borderRadius: 10, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1rem', fontWeight: 900, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10
            }}>Enable with PIN</button>

            <button onClick={enableKidsMode} disabled={loading} style={{
              width: '100%', padding: '14px', background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.1)', borderRadius: 10,
              color: 'rgba(255,255,255,.6)', fontSize: '.88rem', cursor: 'pointer'
            }}>{loading ? 'Enabling...' : 'Enable without PIN'}</button>
          </div>
        )}

        {step === 'set_pin' && (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', textAlign: 'center' }}>Set Parental PIN</h2>
            <PINInput label="Choose a 4-digit PIN to lock Kids Mode" onComplete={handleFirstPin} error={error} />
          </div>
        )}

        {step === 'confirm_pin' && (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', textAlign: 'center' }}>Confirm PIN</h2>
            <PINInput label="Enter your PIN again to confirm" onComplete={handleConfirmPin} error={error} />
          </div>
        )}
      </div>
    </div>
  );
}
