import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

export default function LanguageSelector({ compact = false }) {
  const { lang, setLang, languages, t } = useI18n();
  const [open, setOpen] = useState(false);

  const current = languages[lang];

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 8, padding: compact ? '6px 10px' : '8px 12px',
        color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/></svg>
        <span style={{ fontWeight: 800, letterSpacing: '.04em' }}>{(lang || '').toUpperCase()}</span>
        {!compact && <span>{current?.name}</span>}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
          <div style={{
            position: 'absolute', top: '110%', right: 0, zIndex: 1000,
            background: '#161616', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 12, overflow: 'hidden',
            width: 'min(180px, calc(100vw - 32px))',
            maxHeight: 320, overflowY: 'auto',
            boxShadow: '0 8px 30px rgba(0,0,0,.5)'
          }}>
            {Object.entries(languages).map(([code, info]) => (
              <button key={code} onClick={() => { setLang(code); setOpen(false); }} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px', background: lang === code ? 'rgba(229,9,20,.1)' : 'none',
                border: 'none', color: lang === code ? '#e50914' : '#fff',
                cursor: 'pointer', fontSize: '.82rem', fontWeight: lang === code ? 700 : 500,
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '.62rem', fontWeight: 800, letterSpacing: '.05em', padding: '3px 6px', borderRadius: 5, background: 'rgba(255,255,255,.08)', minWidth: 24, textAlign: 'center' }}>{code.toUpperCase()}</span>
                {info.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
