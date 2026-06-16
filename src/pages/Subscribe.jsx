import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  { slug: 'free', name: 'Free', price: 0, features: ['360p streaming', 'Limited content', 'Ads included', '1 screen'] },
  { slug: 'basic', name: 'Basic', price: 1900, features: ['720p HD streaming', 'All movies and series', 'No ads', '1 screen'] },
  { slug: 'standard', name: 'Standard', price: 2500, popular: true, features: ['1080p Full HD', 'All movies and series', 'No ads', '1 screen', 'Priority support'] },
  { slug: 'enterprise_10', name: 'Enterprise 10', price: 15000, features: ['1080p Full HD', 'All content', 'No ads', '10 devices', 'Dedicated support'] },
];

export default function Subscribe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentPlan = user?.sub?.plan || 'free';

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e50914', marginBottom: 6 }}>Subscription</div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, marginBottom: '.5rem' }}>Choose Your Plan</h1>
        <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.88rem' }}>Unlock unlimited African entertainment</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, maxWidth: 960, margin: '0 auto' }}>
        {PLANS.map(plan => {
          const isCurrent = currentPlan === plan.slug;
          return (
            <div key={plan.slug} style={{
              background: plan.popular ? 'rgba(229,9,20,.05)' : '#111',
              border: `1.5px solid ${plan.popular ? '#e50914' : 'rgba(255,255,255,.08)'}`,
              borderRadius: 16, padding: '24px 20px', position: 'relative'
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#e50914', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.62rem', fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  Most Popular
                </div>
              )}
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.62rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ marginBottom: 16 }}>
                {plan.price === 0
                  ? <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.2rem', fontWeight: 900 }}>Free</span>
                  : <><span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.2rem', fontWeight: 900 }}>&#8358;{plan.price.toLocaleString()}</span><span style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>/mo</span></>
                }
              </div>
              <ul style={{ listStyle: 'none', marginBottom: 20 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem', color: 'rgba(255,255,255,.65)', marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, color: 'rgba(255,255,255,.4)', fontSize: '.82rem', fontWeight: 700, textAlign: 'center' }}>Current Plan</div>
              ) : (
                <button onClick={() => window.location.href = `https://app.showmine.ng/subscribe.php?plan=${plan.slug}`} style={{
                  width: '100%', padding: '12px',
                  background: plan.popular ? '#e50914' : 'rgba(255,255,255,.08)',
                  border: plan.popular ? 'none' : '1px solid rgba(255,255,255,.12)',
                  borderRadius: 10, color: '#fff',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '.9rem', fontWeight: 800,
                  letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer'
                }}>
                  {plan.price === 0 ? 'Get Started' : 'Subscribe'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '.75rem', color: 'rgba(255,255,255,.2)' }}>
        Secure payment via Paystack · Cancel anytime
      </p>
    </div>
  );
}
