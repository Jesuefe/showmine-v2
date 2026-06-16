import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 60px', maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem', marginBottom: '1.5rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e50914', marginBottom: 8 }}>Legal</div>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, marginBottom: '.5rem' }}>Terms of Service</h1>
      <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.3)', marginBottom: '2rem' }}>Last updated: June 2026</p>

      {[
        { title: '1. Acceptance of Terms', body: 'By accessing or using Showmine Entertainment ("Showmine", "we", "us"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.' },
        { title: '2. Description of Service', body: 'Showmine is a Nigerian streaming platform that provides access to movies, TV series, live television channels, and other entertainment content. We operate as a hybrid platform, hosting original content and embedding publicly available external streams.' },
        { title: '3. User Accounts', body: 'You must create an account to access most features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account.' },
        { title: '4. Subscription Plans', body: 'Showmine offers both free and paid subscription tiers. Paid subscriptions are billed monthly via Paystack. Subscriptions automatically renew unless cancelled before the renewal date. Refunds are not provided for partial billing periods.' },
        { title: '5. Content and Live TV', body: 'Some content on Showmine, including certain Live TV channels, is sourced from external platforms such as YouTube. Showmine is not affiliated with, endorsed by, or connected to these external content providers. We do not guarantee the availability or accuracy of externally sourced content.' },
        { title: '6. Prohibited Activities', body: 'You may not: share your account credentials with others, use screen recording or capture software on our platform, attempt to download or redistribute our content, use our service for any unlawful purpose, or attempt to reverse engineer our platform.' },
        { title: '7. Free Access Modification', body: 'Showmine reserves the right to modify, restrict, or discontinue free access features at any time without prior notice. Free plan users may experience advertisements and content limitations.' },
        { title: '8. Disclaimers', body: 'Showmine provides its service on an "as is" basis. We do not guarantee uninterrupted or error-free service. Content availability may vary by region. We are not responsible for the accuracy of external content embedded on our platform.' },
        { title: '9. Changes to Terms', body: 'We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email.' },
        { title: '10. Contact', body: 'For questions about these terms, contact us at support@showmine.ng' },
      ].map(section => (
        <div key={section.title} style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 800, marginBottom: '.5rem', color: '#fff' }}>{section.title}</h2>
          <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.75 }}>{section.body}</p>
        </div>
      ))}
    </div>
  );
}
