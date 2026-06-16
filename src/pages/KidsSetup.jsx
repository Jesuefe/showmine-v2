import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

function PINInput({ onComplete, label }) {
  const [pin, setPin] = useState('');

  const handleKey = (k) => {
    if (k === 'del') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const newPin = pin + k;
    setPin(newPin);
    if (newPin.length === 4) setTimeout(() => onComplete(newPin), 100);
  };

  return (
    <div>
      <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', marginBottom: '1rem', textAlign: 'center' }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: '1.5rem' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.2)', background: i < pin.length ? '#e50914' : 'transparent', transition: 'background .15s' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {['1','2','3','4','5','6','7','8','9','','0','del'].map(k => (
          <button key={k} onClick={() => k && handleKey(k)} style={{
            padding: '14px', borderRadius: 10,
            background: k === 'del' ? 'rgba(229,9,20,.1)' : k ? 'rgba(255,255,255,.06)' : 'transparent',
            border: k === 'del' ? '1px solid rgba(229,9,20,.2)' : k ? '1px solid rgba(255,255,255,.08)' : 'none',
            color: k === 'del' ? '#e50914' : '#fff',
            fontSize: k === 'del' ? '.7rem' : '1.2rem', fontWeight: 700,
            cursor: k ? 'pointer' : 'default'
          }}>{k === 'del' ? '⌫' : k}</button>
        ))}
      </div>
    </div>
  );
}

export default function KidsSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState('info'); // info, set_pin, confirm_pin, done
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [kidsStatus, setKidsStatus] = useState(null);

  useEffect(() => {
    client.get('/kids.php?action=status')
      .then(r => { if (r.data.ok) setKidsStatus(r.data); })
      .catch(() => {});
  }, []);

  const enableKidsMode = async (withPin) => {
    setLoading(true);
    try {
      const res = await client.post('/kids.php?action=enable', {});
      if (res.data.ok) {
        navigate('/kids');
      } else {
        setError(res.data.error || 'Failed to enable Kids Mode');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleFirstPin = (pin) => {
    setFirstPin(pin);
    setStep('confirm_pin');
  };

  const handleConfirmPin = async (pin) => {
    if (pin !== firstPin) {
      setError('PINs do not match. Try again.');
      setStep('set_pin');
      setFirstPin('');
      return;
    }
    setLoading(true);
    try {
      await client.post('/kids.php?action=set_pin', { pin });
      await client.post('/kids.php?action=enable', {});
      navigate('/kids');
    } catch {
      setError('Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 60px' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem', marginBottom: '1.5rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <div style={{ maxWidth: 380, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.8rem' }}>
            ⭐
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 900, marginBottom: '.4rem' }}>
            {kidsStatus?.is_kids_mode ? 'Kids Mode Active' : 'Kids Mode'}
          </h1>
          <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>
            A safe, fun experience with content made for children
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.3)', borderRadius: 8, padding: '.75rem 1rem', color: '#ff6b6b', fontSize: '.82rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>
        )}

        {/* Info step */}
        {step === 'info' && (
          <div>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px', marginBottom: '1rem' }}>
              {[
                { icon: '🎬', text: 'Only age-appropriate movies and series' },
                { icon: '🔒', text: 'PIN-protected exit so kids stay safe' },
                { icon: '🌈', text: 'Colorful, fun interface for children' },
                { icon: '📚', text: 'Educational and entertaining content' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <span style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.65)' }}>{item.text}</span>
                </div>
              ))}
            </div>

            {kidsStatus?.is_kids_mode ? (
              <button onClick={() => navigate('/kids')} style={{ width: '100%', padding: '14px', background: '#f59e0b', border: 'none', borderRadius: 10, color: '#000', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Open Kids Mode
              </button>
            ) : (
              <>
                <button onClick={() => setStep('set_pin')} style={{ width: '100%', padding: '14px', background: '#e50914', border: 'none', borderRadius: 10, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>
                  Enable with PIN
                </button>
                <button onClick={() => enableKidsMode(false)} disabled={loading} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: 'rgba(255,255,255,.6)', fontSize: '.88rem', cursor: 'pointer' }}>
                  Enable without PIN
                </button>
              </>
            )}
          </div>
        )}

        {/* Set PIN */}
        {step === 'set_pin' && (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', fontWeight: 800, marginBottom: '.25rem', textAlign: 'center' }}>Set Parental PIN</h2>
            <PINInput label="Choose a 4-digit PIN to lock Kids Mode" onComplete={handleFirstPin} />
          </div>
        )}

        {/* Confirm PIN */}
        {step === 'confirm_pin' && (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', fontWeight: 800, marginBottom: '.25rem', textAlign: 'center' }}>Confirm PIN</h2>
            <PINInput label="Enter your PIN again to confirm" onComplete={handleConfirmPin} />
          </div>
        )}
      </div>
    </div>
  );
}
