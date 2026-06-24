import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const SECTIONS = [
  { id: 'all', label: 'All' },
  { id: 'animation', label: 'Animation' },
  { id: 'education', label: 'Education' },
  { id: 'quizzes', label: 'Quizzes' },
];

function PINModal({ title, subtitle, onSubmit, onCancel, error }) {
  const [pin, setPin] = useState('');

  useEffect(() => { if (error) setPin(''); }, [error]);

  const handleKey = (k) => {
    if (k === 'del') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const newPin = pin + k;
    setPin(newPin);
    if (newPin.length === 4) setTimeout(() => onSubmit(newPin), 150);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,.92)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
    }}>
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.3rem', fontWeight: 800, marginBottom: '.3rem' }}>{title}</h2>
        <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginBottom: '1.5rem' }}>{subtitle}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: '1.5rem' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.2)', background: i < pin.length ? '#e50914' : 'transparent', transition: 'background .15s' }} />
          ))}
        </div>

        {error && <p style={{ color: '#ff6b6b', fontSize: '.78rem', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: '1rem' }}>
          {['1','2','3','4','5','6','7','8','9','','0','del'].map(k => (
            <button key={k} onClick={() => k && handleKey(k)} style={{
              padding: '14px', borderRadius: 10,
              background: k === 'del' ? 'rgba(229,9,20,.08)' : k ? 'rgba(255,255,255,.06)' : 'transparent',
              border: k === 'del' ? '1px solid rgba(229,9,20,.15)' : k ? '1px solid rgba(255,255,255,.08)' : 'none',
              color: k === 'del' ? '#e50914' : '#fff',
              fontSize: k === 'del' ? '.7rem' : '1.2rem', fontWeight: 700,
              cursor: k ? 'pointer' : 'default', fontFamily: 'inherit'
            }}>{k === 'del' ? 'DEL' : k}</button>
          ))}
        </div>

        {onCancel && (
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', fontSize: '.8rem', cursor: 'pointer' }}>Cancel</button>
        )}
      </div>
    </div>
  );
}

export default function Kids() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('all');
  const [showExitPin, setShowExitPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    client.get('/kids.php?action=status').then(r => {
      if (r.data.ok) {
        setHasPin(r.data.has_pin);
        if (!r.data.is_kids_mode) navigate('/kids-setup');
      }
    }).catch(() => {});
    loadContent('all');
  }, []);

  const loadContent = (sec) => {
    setLoading(true);
    client.get(`/kids.php?action=content&section=${sec}`)
      .then(r => { if (r.data.ok) setMovies(r.data.movies); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSection = (sec) => {
    setSection(sec);
    loadContent(sec);
  };

  const exitKidsMode = async (pin) => {
    setPinError('');
    try {
      const res = await client.post('/kids.php?action=disable', { pin });
      if (res.data.ok) {
        setShowExitPin(false);
        navigate('/');
      } else {
        setPinError(res.data.error || 'Incorrect PIN');
      }
    } catch {
      setPinError('Network error');
    }
  };

  return (
    <div style={{ background: '#06080f', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: '#0d1117',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(229,9,20,.15)', border: '1px solid rgba(229,9,20,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>KIDS MODE</div>
            <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.35)' }}>Safe viewing for children</div>
          </div>
        </div>
        <button onClick={() => setShowExitPin(true)} style={{
          background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
          color: 'rgba(255,255,255,.5)', borderRadius: 8, padding: '6px 14px',
          fontSize: '.72rem', fontWeight: 700, cursor: 'pointer'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5, verticalAlign: 'middle' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Exit
        </button>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => handleSection(s.id)} style={{
            flexShrink: 0, padding: '7px 16px', borderRadius: 20,
            border: `1.5px solid ${section === s.id ? '#e50914' : 'rgba(255,255,255,.08)'}`,
            cursor: 'pointer', fontWeight: 700, fontSize: '.78rem',
            background: section === s.id ? 'rgba(229,9,20,.1)' : 'rgba(255,255,255,.04)',
            color: section === s.id ? '#e50914' : 'rgba(255,255,255,.5)'
          }}>{s.label}</button>
        ))}
      </div>

      {/* Content grid */}
      <div style={{ padding: '4px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(229,9,20,.15)', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          </div>
        ) : movies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
              <rect x="2" y="2" width="20" height="20" rx="2"/><path d="M10 8l6 4-6 4V8z"/>
            </svg>
            <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '.9rem' }}>No kids content available yet</p>
            <p style={{ color: 'rgba(255,255,255,.2)', fontSize: '.75rem', marginTop: '.4rem' }}>Check back soon</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {movies.map(m => (
              <div key={m.id} onClick={() => navigate(`/watch/${m.slug}`)} style={{ cursor: 'pointer' }}>
                <div style={{ position: 'relative', aspectRatio: '2/3', background: '#161616', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
                  {m.cover_image
                    ? <img src={m.cover_image} alt={m.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M10 8l6 4-6 4V8z"/></svg>
                      </div>}
                </div>
                <div style={{ padding: '5px 2px 0' }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'rgba(255,255,255,.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showExitPin && (
        <PINModal
          title="Exit Kids Mode"
          subtitle={hasPin ? 'Enter your parental PIN to exit' : 'Tap any number to exit'}
          onSubmit={hasPin ? exitKidsMode : () => exitKidsMode('')}
          onCancel={() => { setShowExitPin(false); setPinError(''); }}
          error={pinError}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

