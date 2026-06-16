import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';

export default function SubscribeVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const ref = searchParams.get('ref');
    const gateway = searchParams.get('gateway') || 'paystack';
    if (!ref) { navigate('/subscribe'); return; }

    client.get(`/subscribe.php?action=verify_paystack&ref=${ref}`)
      .then(res => {
        if (res.data.ok) {
          setStatus('success');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setStatus('failed');
        }
      })
      .catch(() => setStatus('failed'));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        {status === 'verifying' && (
          <>
            <div style={{ width: 48, height: 48, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800 }}>Verifying Payment...</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', marginTop: '.5rem' }}>Please wait while we confirm your payment</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,.15)', border: '2px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '.5rem' }}>Payment Successful!</h2>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.85rem', marginBottom: '1.5rem' }}>Your subscription is now active. Redirecting you to home...</p>
            <button onClick={() => navigate('/')} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '.75rem 1.5rem', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.95rem', fontWeight: 800, cursor: 'pointer' }}>Go to Home</button>
          </>
        )}
        {status === 'failed' && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(229,9,20,.1)', border: '2px solid rgba(229,9,20,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '.5rem' }}>Payment Failed</h2>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.85rem', marginBottom: '1.5rem' }}>We could not verify your payment. Please try again.</p>
            <button onClick={() => navigate('/subscribe')} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '.75rem 1.5rem', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.95rem', fontWeight: 800, cursor: 'pointer' }}>Try Again</button>
          </>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
