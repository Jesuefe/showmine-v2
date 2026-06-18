import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

const QUALITY_INFO = {
  auto:   { label: 'Auto (Recommended)', rate: 'Adjusts to your connection' },
  '360p': { label: '360p — Data Saver',  rate: '7 MB/min' },
  '480p': { label: '480p — Standard',    rate: '12 MB/min' },
  '720p': { label: '720p — HD',          rate: '22 MB/min' },
  '1080p':{ label: '1080p — Full HD',    rate: '45 MB/min' },
  '4k':   { label: '4K — Ultra HD',      rate: '90 MB/min' },
};

export default function DataUsage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [quality, setQuality] = useState('auto');

  useEffect(() => {
    client.get('/data_usage.php?action=summary')
      .then(res => {
        if (res.data.ok) {
          setData(res.data);
          setDataSaver(res.data.data_saver);
          setQuality(res.data.quality_preference);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const savePreference = async (newDataSaver, newQuality) => {
    setSaving(true);
    try {
      await client.post('/data_usage.php?action=set_preference', {
        data_saver: newDataSaver,
        quality_preference: newQuality,
      });
    } catch {}
    setSaving(false);
  };

  const toggleDataSaver = () => {
    const next = !dataSaver;
    setDataSaver(next);
    savePreference(next, quality);
  };

  const changeQuality = (q) => {
    setQuality(q);
    savePreference(dataSaver, q);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 60px', maxWidth: 700, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem', marginBottom: '1.5rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.6rem', fontWeight: 900, marginBottom: 4 }}>Data Usage</h1>
      <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.4)', marginBottom: '1.5rem' }}>Monitor and control your streaming data</p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '18px' }}>
          <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.35)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>This Month</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.7rem', fontWeight: 900 }}>{formatBytes(data?.month_bytes)}</div>
        </div>
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '18px' }}>
          <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.35)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>All Time</div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.7rem', fontWeight: 900 }}>{formatBytes(data?.total_bytes)}</div>
        </div>
      </div>

      {/* Data Saver toggle */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '18px 20px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '.92rem', fontWeight: 700, marginBottom: 3 }}>Data Saver Mode</div>
          <div style={{ fontSize: '.76rem', color: 'rgba(255,255,255,.4)' }}>Automatically reduces video quality to save data</div>
        </div>
        <button onClick={toggleDataSaver} style={{
          width: 50, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
          background: dataSaver ? '#22c55e' : 'rgba(255,255,255,.15)',
          position: 'relative', flexShrink: 0, transition: 'background .15s'
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 3, left: dataSaver ? 25 : 3,
            transition: 'left .15s'
          }} />
        </button>
      </div>

      {/* Quality preference */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '.92rem', fontWeight: 700, marginBottom: 14 }}>Streaming Quality</div>
        {Object.entries(QUALITY_INFO).map(([key, info]) => (
          <button key={key} onClick={() => changeQuality(key)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', marginBottom: 8, borderRadius: 10,
            background: quality === key ? 'rgba(229,9,20,.08)' : 'rgba(255,255,255,.03)',
            border: `1.5px solid ${quality === key ? '#e50914' : 'rgba(255,255,255,.07)'}`,
            cursor: 'pointer', textAlign: 'left'
          }}>
            <div>
              <div style={{ fontSize: '.85rem', fontWeight: 600, color: quality === key ? '#fff' : 'rgba(255,255,255,.7)' }}>{info.label}</div>
              <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{info.rate}</div>
            </div>
            {quality === key && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            )}
          </button>
        ))}
      </div>

      {/* Usage by quality */}
      {data?.by_quality?.length > 0 && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '.92rem', fontWeight: 700, marginBottom: 14 }}>Usage by Quality</div>
          {data.by_quality.map(q => (
            <div key={q.quality} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: '.82rem' }}>
              <span style={{ color: 'rgba(255,255,255,.6)' }}>{q.quality} <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '.72rem' }}>({q.sessions} sessions)</span></span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{formatBytes(q.bytes)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent movies */}
      {data?.recent_movies?.length > 0 && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px' }}>
          <div style={{ fontSize: '.92rem', fontWeight: 700, marginBottom: 14 }}>Recent Streaming</div>
          {data.recent_movies.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < data.recent_movies.length - 1 ? 12 : 0, paddingBottom: i < data.recent_movies.length - 1 ? 12 : 0, borderBottom: i < data.recent_movies.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
              <div style={{ width: 40, height: 56, borderRadius: 6, background: '#1a1a1a', overflow: 'hidden', flexShrink: 0 }}>
                {m.cover_image && <img src={m.cover_image} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.35)' }}>{m.sessions} session{m.sessions !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontSize: '.8rem', fontWeight: 700, flexShrink: 0 }}>{formatBytes(m.bytes)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
