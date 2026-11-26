import { useState } from 'react';
import { IconBadge } from '../components/Icon';
import { useNavigate } from 'react-router-dom';

const COND = "'Barlow Condensed', sans-serif";
const UPDATED = 'November 2026';

const GLANCE = [
  { icon: 'ban', title: 'We never sell your data', text: 'Your personal information is not sold to anyone.' },
  { icon: 'sliders', title: 'You’re in control', text: 'See your devices, change details or delete your account any time.' },
  { icon: 'lock', title: 'Protected', text: 'Encrypted connections, hashed passwords and PINs.' },
];

const SECTIONS = [
  { id: 'collect', icon: 'clipboard', title: 'Information we collect', body: [
    'Account details you give us: name, email address, username and, if you choose, phone number.',
    'Payment information needed to process subscriptions. Card details are handled by our payment processor (Paystack) — we don’t store full card numbers.',
    'What you watch and do in the app: titles watched and how far you got, My List, likes, comments and searches, so we can resume playback and recommend content.',
    'Device information: phone make and model, operating system, app version and approximate country (from your IP address). We use it to show your Active Devices, keep your account secure and fix problems.',
  ] },
  { id: 'use', icon: 'settings', title: 'How we use it', body: [
    'To provide streaming and live TV, remember where you stopped watching, and recommend titles you may like.',
    'To process payments and manage your plan.',
    'To keep your account safe — for example spotting sign-ins from new devices.',
    'To answer support messages. When you contact support (including by shaking your phone) we attach your app version, phone model and the screen you were on.',
    'To send service messages and, if you allow it, notifications about new releases.',
  ] },
  { id: 'share', icon: 'handshake', title: 'Who we share it with', body: [
    'We do not sell your personal data.',
    'Service providers that help us run Showmine: payment processing (Paystack), video delivery (Bunny CDN), push notifications (Firebase) and analytics. They may only use the data to provide their service to us.',
    'Advertising partners (Google AdMob) on ad-supported plans may use device identifiers to show ads.',
    'Embedded trailers come from YouTube, which has its own privacy policy. Showmine is not affiliated with YouTube or Google.',
    'Authorities, where the law requires it.',
  ] },
  { id: 'kids', icon: 'smile', title: 'Children & Kids Mode', body: [
    'Showmine accounts are for adults. Children can watch through Kids Mode, which a parent turns on and locks with a 4-digit PIN.',
    'Your Kids PIN is stored only in hashed (scrambled) form. In Kids Mode, comments, sharing and other social features are switched off.',
    'We do not knowingly collect personal information from children under 13. If you think we have, contact us and we will delete it.',
  ] },
  { id: 'security', icon: 'shield', title: 'Keeping data secure', body: [
    'All connections use HTTPS. Passwords and Kids PINs are hashed.',
    'Each signed-in device has its own secure sign-in token, which you can revoke from Profile → Active devices.',
  ] },
  { id: 'rights', icon: 'user', title: 'Your rights', body: [
    'You can access and correct your details in Settings, and see or sign out devices in Active devices.',
    'You can delete your account and personal data from Settings → Delete account, or at v2.showmine.ng/delete-account.',
    'For any other request, contact privacy@showmine.ng. We respond within 30 days.',
  ] },
  { id: 'retention', icon: 'calendar', title: 'How long we keep it', body: [
    'We keep your data while your account is active. When you delete your account, your profile, watch history, devices, likes, support tickets and notifications are removed straight away; comments are blanked.',
    'Payment records are kept only as long as tax and accounting law requires, and are no longer linked to your profile.',
  ] },
  { id: 'cookies', icon: 'cookie', title: 'Cookies & similar tech', body: [
    'On the website we use cookies to keep you signed in and remember preferences. The app stores similar information on your phone (for example your language and Kids Mode lock).',
  ] },
  { id: 'changes', icon: 'fileText', title: 'Changes to this policy', body: [
    'We may update this policy. If the changes are significant we will tell you in the app or by email.',
  ] },
];

export default function Privacy() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => new Set(['collect']));
  const toggle = (id) => setOpen(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const jump = (id) => {
    setOpen(s => new Set(s).add(id));
    setTimeout(() => document.getElementById(`pp-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', paddingBottom: 60, color: '#fff' }}>
      {/* Hero */}
      <div style={{ padding: 'calc(env(safe-area-inset-top) + 14px) 20px 26px', background: 'radial-gradient(500px 260px at 0% 0%, rgba(229,9,20,.35), transparent 70%), radial-gradient(400px 240px at 100% 30%, rgba(10,125,59,.25), transparent 70%)' }}>
        <button onClick={() => navigate(-1)} aria-label="Back" style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(229,9,20,.15)', border: '1px solid rgba(229,9,20,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
          </div>
          <div style={{ fontFamily: COND, fontSize: '.7rem', fontWeight: 800, letterSpacing: '.22em', color: '#e50914' }}>SHOWMINE ENTERTAINMENT</div>
          <h1 style={{ fontFamily: COND, fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, margin: '4px 0 8px' }}>Your privacy, explained simply</h1>
          <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)' }}>Last updated {UPDATED}</div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px' }}>
        {/* At a glance */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginBottom: 22 }}>
          {GLANCE.map(g => (
            <div key={g.title} style={{ background: '#101013', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 16 }}>
              <IconBadge name={g.icon} size={40} style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 800, fontSize: '.9rem', marginBottom: 3 }}>{g.title}</div>
              <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.5 }}>{g.text}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 16, paddingBottom: 2 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => jump(s.id)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.8)', fontSize: '.74rem', fontWeight: 700, cursor: 'pointer' }}>{s.icon} {s.title}</button>
          ))}
        </div>

        {/* Sections */}
        {SECTIONS.map(s => {
          const isOpen = open.has(s.id);
          return (
            <div key={s.id} id={`pp-${s.id}`} style={{ background: '#0d0d10', border: `1px solid ${isOpen ? 'rgba(229,9,20,.3)' : 'rgba(255,255,255,.06)'}`, borderRadius: 16, marginBottom: 10, overflow: 'hidden', scrollMarginTop: 16 }}>
              <button onClick={() => toggle(s.id)} aria-expanded={isOpen} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <IconBadge name={s.icon} size={34} color="#9ca3af" />
                <span style={{ flex: 1, fontFamily: COND, fontSize: '1.15rem', fontWeight: 800 }}>{s.title}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2.2" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {isOpen && (
                <ul style={{ margin: 0, padding: '0 18px 16px 46px' }}>
                  {s.body.map((b, i) => <li key={i} style={{ fontSize: '.86rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.7, marginBottom: 6 }}>{b}</li>)}
                </ul>
              )}
            </div>
          );
        })}

        {/* Contact + actions */}
        <div style={{ marginTop: 18, borderRadius: 18, padding: 20, background: 'linear-gradient(135deg,#1a0507,#0d0d10)', border: '1px solid rgba(229,9,20,.25)' }}>
          <div style={{ fontFamily: COND, fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>Questions about your data?</div>
          <div style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: 14 }}>
            Email our Data Protection Officer at <a href="mailto:privacy@showmine.ng" style={{ color: '#ff6b73' }}>privacy@showmine.ng</a> or write to Showmine Entertainment, Lagos, Nigeria.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/sessions')} style={{ flex: 1, minWidth: 140, padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', color: '#fff', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' }}>Manage devices</button>
            <button onClick={() => navigate('/delete-account')} style={{ flex: 1, minWidth: 140, padding: '11px 14px', borderRadius: 10, background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.35)', color: '#ff6b73', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' }}>Delete my account</button>
          </div>
        </div>
      </div>
    </div>
  );
}
