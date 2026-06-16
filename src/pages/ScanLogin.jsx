import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function ScanLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scannerRef = useRef(null);

  const [mode, setMode] = useState('options'); // options, camera, manual
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');

  // If token in URL (from QR scan), auto-approve
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      if (user) {
        approveToken(token);
      } else {
        navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      }
    }
  }, [user]);

  const approveToken = async (token) => {
    setStatus('loading');
    setError('');
    try {
      const res = await client.post('/tv_auth.php?action=approve', { token: token.toLowerCase() });
      if (res.data.ok) {
        setStatus('success');
        stopCamera();
      } else {
        setStatus('error');
        setError(res.data.error || 'Code invalid or expired');
      }
    } catch {
      setStatus('error');
      setError('Network error. Please try again.');
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        startScanning();
      }
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permission or enter code manually.');
      setMode('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (scannerRef.current) {
      clearInterval(scannerRef.current);
      scannerRef.current = null;
    }
  };

  const startScanning = () => {
    // Use jsQR library loaded from CDN via script tag
    scannerRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Use jsQR if available
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          const url = code.data;
          // Extract token from URL
          const match = url.match(/[?&]token=([a-f0-9]+)/i);
          if (match) {
            clearInterval(scannerRef.current);
            stopCamera();
            approveToken(match[1]);
          }
        }
      }
    }, 200);
  };

  useEffect(() => {
    // Load jsQR library
    if (!window.jsQR) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      document.head.appendChild(script);
    }
    return () => stopCamera();
  }, []);

  const handleManual = () => {
    const code = manualCode.replace(/[-\s]/g, '').toLowerCase();
    if (code.length < 8) { setError('Enter the full code shown on your TV'); return; }
    approveToken(code);
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 900, color: '#e50914', marginBottom: 4 }}>SHOWMINE</div>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            You need to be signed in to approve a TV login
          </p>
          <Link to="/login" style={{ display: 'inline-block', background: '#e50914', color: '#fff', borderRadius: 8, padding: '.75rem 1.5rem', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.95rem', fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase' }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <button onClick={() => { stopCamera(); navigate(-1); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 800 }}>Sign In on TV</div>
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)' }}>Scan QR code or enter code</div>
        </div>
      </div>

      {/* Success */}
      {status === 'success' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,.15)', border: '2px solid rgba(34,197,94,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 900, marginBottom: '.5rem' }}>TV Approved!</h2>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your TV is now signed in as <strong style={{ color: '#fff' }}>{user.full_name || user.username}</strong>. You can close this page.
          </p>
          <button onClick={() => navigate('/')} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 8, padding: '.75rem 1.5rem', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.95rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
            Go to Home
          </button>
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 44, height: 44, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem' }}>Approving TV login...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Options */}
      {status === 'idle' && mode === 'options' && (
        <div style={{ flex: 1, padding: '2rem 20px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400, margin: '0 auto', width: '100%' }}>
          <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.4)', textAlign: 'center', lineHeight: 1.6 }}>
            Choose how to sign in your TV or desktop
          </p>

          {/* Scan camera button */}
          <button onClick={startCamera} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '20px', background: '#111',
            border: '1px solid rgba(255,255,255,.08)', borderRadius: 14,
            cursor: 'pointer', textAlign: 'left', width: '100%'
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '.92rem', fontWeight: 700, color: '#fff', marginBottom: 3 }}>Scan QR Code</div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.35)', lineHeight: 1.4 }}>Use your camera to scan the QR code on your TV screen</div>
            </div>
          </button>

          {/* Manual code button */}
          <button onClick={() => setMode('manual')} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '20px', background: '#111',
            border: '1px solid rgba(255,255,255,.08)', borderRadius: 14,
            cursor: 'pointer', textAlign: 'left', width: '100%'
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><path d="M21 16h-3a2 2 0 00-2 2v3m5-5v5h-5"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '.92rem', fontWeight: 700, color: '#fff', marginBottom: 3 }}>Enter Code Manually</div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.35)', lineHeight: 1.4 }}>Type the code shown on your TV or desktop screen</div>
            </div>
          </button>
        </div>
      )}

      {/* Camera scanner */}
      {status === 'idle' && mode === 'camera' && (
        <div style={{ flex: 1, position: 'relative', background: '#000' }}>
          <video ref={videoRef} playsInline muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Scan frame overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 220, height: 220 }}>
              {/* Corner borders */}
              {[
                { top: 0, left: 0, borderTop: '3px solid #e50914', borderLeft: '3px solid #e50914' },
                { top: 0, right: 0, borderTop: '3px solid #e50914', borderRight: '3px solid #e50914' },
                { bottom: 0, left: 0, borderBottom: '3px solid #e50914', borderLeft: '3px solid #e50914' },
                { bottom: 0, right: 0, borderBottom: '3px solid #e50914', borderRight: '3px solid #e50914' },
              ].map((style, i) => (
                <div key={i} style={{ position: 'absolute', width: 30, height: 30, borderRadius: 2, ...style }} />
              ))}
              {/* Scan line animation */}
              <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'rgba(229,9,20,.8)', animation: 'scanline 2s ease-in-out infinite' }} />
            </div>
          </div>

          {/* Bottom controls */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem 20px', background: 'linear-gradient(to top, rgba(0,0,0,.9) 0%, transparent 100%)', textAlign: 'center' }}>
            <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '1rem' }}>Point camera at the QR code on your TV</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => { stopCamera(); setMode('manual'); }} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer' }}>
                Enter Code Instead
              </button>
              <button onClick={() => { stopCamera(); setMode('options'); }} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)', borderRadius: 8, padding: '8px 16px', fontSize: '.8rem', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>

          {cameraError && (
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', background: 'rgba(229,9,20,.15)', border: '1px solid rgba(229,9,20,.3)', borderRadius: 8, padding: '.75rem 1rem', color: '#ff6b6b', fontSize: '.78rem' }}>
              {cameraError}
            </div>
          )}
        </div>
      )}

      {/* Manual code entry */}
      {status === 'idle' && mode === 'manual' && (
        <div style={{ flex: 1, padding: '2rem 20px', maxWidth: 400, margin: '0 auto', width: '100%' }}>
          <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.4)', marginBottom: '1.5rem', lineHeight: 1.6, textAlign: 'center' }}>
            Enter the code shown on your TV or desktop login screen
          </p>

          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '1.5rem', marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>TV Code</label>
            <input
              type="text" value={manualCode} autoFocus
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleManual()}
              placeholder="XXXX-XXXX"
              maxLength={9}
              style={{
                width: '100%', padding: '14px', background: 'rgba(255,255,255,.06)',
                border: '1.5px solid rgba(255,255,255,.1)', borderRadius: 10,
                color: '#fff', fontSize: '1.4rem', fontWeight: 800,
                textAlign: 'center', letterSpacing: '.3em', outline: 'none',
                fontFamily: "'Barlow Condensed', sans-serif"
              }}
            />
          </div>

          {error && <p style={{ color: '#ff6b6b', fontSize: '.8rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

          <button onClick={handleManual} style={{
            width: '100%', padding: '14px', background: '#e50914',
            border: 'none', borderRadius: 10, color: '#fff',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1rem', fontWeight: 800, letterSpacing: '.06em',
            textTransform: 'uppercase', cursor: 'pointer', marginBottom: 10
          }}>Approve TV Login</button>

          <button onClick={() => { setMode('options'); setError(''); }} style={{
            width: '100%', padding: '12px', background: 'none',
            border: '1px solid rgba(255,255,255,.08)', borderRadius: 10,
            color: 'rgba(255,255,255,.4)', fontSize: '.82rem', cursor: 'pointer'
          }}>Back</button>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '2rem', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(229,9,20,.1)', border: '2px solid rgba(229,9,20,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <p style={{ color: '#ff6b6b', fontSize: '.85rem' }}>{error}</p>
          <button onClick={() => { setStatus('idle'); setMode('options'); setError(''); }} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 8, padding: '.6rem 1.2rem', fontSize: '.82rem', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scanline {
          0% { top: 0; opacity: 1; }
          50% { top: 100%; opacity: .5; }
          100% { top: 0; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
