import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 60px', maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem', marginBottom: '1.5rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e50914', marginBottom: 8 }}>Legal</div>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, marginBottom: '.5rem' }}>Privacy Policy</h1>
      <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.3)', marginBottom: '2rem' }}>Last updated: June 2026</p>

      {[
        { title: '1. Information We Collect', body: 'We collect information you provide directly: name, email address, username, and payment information. We also collect usage data including content watched, search history, and device information to improve our service.' },
        { title: '2. How We Use Your Information', body: 'We use your information to provide and improve our service, process payments, send service-related communications, personalize your experience, and comply with legal obligations.' },
        { title: '3. Data Sharing', body: 'We do not sell your personal data. We may share data with payment processors (Paystack), content delivery networks (Bunny CDN), and analytics providers. External content providers such as YouTube have their own privacy policies that govern their data practices. Showmine is not affiliated with YouTube or Google.' },
        { title: '4. Cookies', body: 'We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage patterns. You can control cookie settings through your browser.' },
        { title: '5. Data Security', body: 'We implement industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and regular security audits to protect your data.' },
        { title: '6. Your Rights', body: 'You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at privacy@showmine.ng. We will respond within 30 days.' },
        { title: '7. Data Retention', body: 'We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.' },
        { title: '8. Children\'s Privacy', body: 'Showmine is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.' },
        { title: '9. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or prominent notice on our platform.' },
        { title: '10. Contact Us', body: 'For privacy concerns or questions, contact our Data Protection Officer at privacy@showmine.ng or write to Showmine Entertainment, Lagos, Nigeria.' },
      ].map(section => (
        <div key={section.title} style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 800, marginBottom: '.5rem', color: '#fff' }}>{section.title}</h2>
          <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.75 }}>{section.body}</p>
        </div>
      ))}
    </div>
  );
}
