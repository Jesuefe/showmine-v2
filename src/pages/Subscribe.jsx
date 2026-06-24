import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { useI18n } from '../i18n/I18nContext';

export default function Subscribe() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isNative = !!(window.Capacitor?.isNativePlatform?.() || window.Android);
  if (isNative) return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '2rem', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(229,9,20,.1)', border: '2px solid rgba(229,9,20,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#e50914' strokeWidth='2'><path d='M12 2L2 7l10 5 10-5-10-5z'/><path d='M2 17l10 5 10-5'/><path d='M2 12l10 5 10-5'/></svg>
      </div>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 900, marginBottom: '.75rem' }}>Get Showmine Premium</h2>
      <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.9rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: 320 }}>Subscribe to Showmine Premium on our website to unlock all movies and exclusive content.</p>
      <a href='https://www.showmine.ng/subscribe' target='_blank' rel='noopener noreferrer' style={{ background: '#e50914', color: '#fff', borderRadius: 10, padding: '14px 28px', fontSize: '1rem', fontWeight: 800, textDecoration: 'none', marginBottom: '1rem', display: 'block' }}>Visit showmine.ng</a>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)', borderRadius: 8, padding: '10px 20px', fontSize: '.85rem', cursor: 'pointer' }}>Go Back</button>
    </div>
  );
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [gateway, setGateway] = useState('paystack');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const currentPlanId = user?.sub?.plan_id || null;

  useEffect(() => {
    client.get('/subscribe.php?action=plans')
      .then(res => {
        if (res.data.ok) {
          setPlans(res.data.plans);
          // Auto select standard plan
          const std = res.data.plans.find(p => p.slug === 'standard');
          if (std) {
            setSelectedPlan(std);
            setSelectedDuration(std.durations?.[0] || null);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    setError('');
    try {
      const action = gateway === 'paystack' ? 'init_paystack' : 'init_stripe';
      const res = await client.post(`/subscribe.php?action=${action}`, {
        plan_id: selectedPlan.id,
        duration_id: selectedDuration?.id || null,
      });
      if (res.data.ok) {
        window.location.href = res.data.url;
      } else {
        setError(res.data.error || 'Payment initialization failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1a1a1a', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e50914', marginBottom: 6 }}>Subscription</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, marginBottom: '.5rem' }}>{t('choose_plan')}</h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '.88rem' }}>{t('unlock_unlimited')}</p>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: '2rem' }}>
          {plans.filter(p => !p.is_enterprise).map(plan => {
            const isSelected = selectedPlan?.id === plan.id;
            const isCurrent = currentPlanId === plan.id;
            return (
              <div key={plan.id} onClick={() => {
                setSelectedPlan(plan);
                setSelectedDuration(plan.durations?.[0] || null);
              }} style={{
                background: isSelected ? 'rgba(229,9,20,.08)' : '#111',
                border: `2px solid ${isSelected ? '#e50914' : 'rgba(255,255,255,.08)'}`,
                borderRadius: 14, padding: '20px 16px',
                cursor: 'pointer', transition: 'all .15s', position: 'relative'
              }}>
                {plan.slug === 'standard' && (
                  <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#e50914', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.6rem', fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', padding: '2px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>{t('most_popular')}</div>
                )}
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.62rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: isSelected ? '#e50914' : 'rgba(255,255,255,.4)', marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.8rem', fontWeight: 900, marginBottom: 8 }}>
                  {gateway === 'stripe' && plan.price_usd > 0
                    ? `$${plan.price_usd}`
                    : plan.price_ngn === 0 ? 'Free'
                    : `₦${plan.price_ngn.toLocaleString()}`}
                  {plan.price_ngn > 0 && <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>/mo</span>}
                </div>
                <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>{plan.max_quality} · {plan.max_devices} device{plan.max_devices > 1 ? 's' : ''}</div>
                {isCurrent && (
                  <div style={{ display: 'inline-block', background: 'rgba(34,197,94,.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,.3)', fontSize: '.6rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.06em' }}>Current</div>
                )}
                {isSelected && !isCurrent && (
                  <div style={{ display: 'inline-block', background: 'rgba(229,9,20,.15)', color: '#e50914', border: '1px solid rgba(229,9,20,.3)', fontSize: '.6rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.06em' }}>Selected</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Enterprise plans */}
        {plans.filter(p => p.is_enterprise).length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 10 }}>{t('enterprise_plans')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {plans.filter(p => p.is_enterprise).map(plan => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <div key={plan.id} onClick={() => { setSelectedPlan(plan); setSelectedDuration(null); }}
                    style={{ background: isSelected ? 'rgba(229,9,20,.08)' : '#111', border: `1.5px solid ${isSelected ? '#e50914' : 'rgba(255,255,255,.08)'}`, borderRadius: 12, padding: '16px 14px', cursor: 'pointer' }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.6rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: isSelected ? '#e50914' : 'rgba(255,255,255,.35)', marginBottom: 4 }}>{plan.name}</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.4rem', fontWeight: 900 }}>
                      {gateway === 'stripe' && plan.price_usd > 0
                        ? `$${plan.price_usd}`
                        : `₦${plan.price_ngn.toLocaleString()}`}
                      <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>/mo</span>
                    </div>
                    <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.35)', marginTop: 4 }}>{plan.max_devices} devices</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Duration selector */}
        {selectedPlan && selectedPlan.durations?.length > 0 && (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '20px', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 12 }}>{t('billing_period')}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedPlan.durations.map(dur => {
                const isSelected = selectedDuration?.id === dur.id;
                return (
                  <button key={dur.id} onClick={() => setSelectedDuration(dur)} style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: isSelected ? 'rgba(229,9,20,.1)' : 'rgba(255,255,255,.04)',
                    border: `1.5px solid ${isSelected ? '#e50914' : 'rgba(255,255,255,.08)'}`,
                    color: isSelected ? '#fff' : 'rgba(255,255,255,.5)',
                    cursor: 'pointer', fontSize: '.8rem', fontWeight: 600,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                  }}>
                    <span>{dur.months} {dur.months === 1 ? 'Month' : 'Months'}</span>
                    <span style={{ fontSize: '.7rem', color: isSelected ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)' }}>
                      ₦{dur.price_ngn.toLocaleString()}
                      {dur.discount_pct > 0 && <span style={{ marginLeft: 4, color: '#22c55e' }}>-{dur.discount_pct}%</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment method */}
        {selectedPlan && selectedPlan.price_ngn > 0 && (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '20px', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: 12 }}>{t('payment_method')}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { id: 'paystack', label: 'Paystack', sub: 'NGN · Cards, Bank Transfer, USSD' },
                { id: 'stripe', label: 'Stripe', sub: 'USD · International Cards' },
              ].map(gw => (
                <button key={gw.id} onClick={() => setGateway(gw.id)} style={{
                  flex: 1, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: gateway === gw.id ? 'rgba(229,9,20,.08)' : 'rgba(255,255,255,.03)',
                  border: `1.5px solid ${gateway === gw.id ? '#e50914' : 'rgba(255,255,255,.08)'}`,
                  textAlign: 'left'
                }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 700, color: gateway === gw.id ? '#fff' : 'rgba(255,255,255,.6)', marginBottom: 3 }}>{gw.label}</div>
                  <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)' }}>{gw.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary & pay button */}
        {selectedPlan && (
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '20px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '.95rem', fontWeight: 700 }}>{selectedPlan.name} Plan</div>
                <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginTop: 3 }}>
                  {selectedDuration ? `${selectedDuration.months} month${selectedDuration.months > 1 ? 's' : ''}` : '1 month'}
                </div>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 900 }}>
                {selectedPlan.price_ngn === 0 ? 'Free' :
                  gateway === 'stripe'
                    ? `$${selectedDuration?.price_usd || selectedPlan.price_usd}`
                    : `₦${(selectedDuration?.price_ngn || selectedPlan.price_ngn).toLocaleString()}`
                }
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.3)', borderRadius: 8, padding: '.75rem 1rem', color: '#ff6b6b', fontSize: '.82rem', marginBottom: 12 }}>{error}</div>
            )}

            {selectedPlan.price_ngn === 0 ? (
              <button onClick={() => navigate('/')} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.95rem', fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Continue with Free Plan
              </button>
            ) : (
              <button onClick={handleSubscribe} disabled={processing} style={{
                width: '100%', padding: '14px',
                background: processing ? '#333' : '#e50914',
                border: 'none', borderRadius: 10, color: '#fff',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '.95rem', fontWeight: 800,
                letterSpacing: '.04em', textTransform: 'uppercase',
                cursor: processing ? 'not-allowed' : 'pointer'
              }}>
                {processing ? t('processing') : `${t('pay_with')} ${gateway === 'paystack' ? 'Paystack' : 'Stripe'}`}
              </button>
            )}
          </div>
        )}

        {/* Features of selected plan */}
        {selectedPlan?.features?.length > 0 && (
          <div style={{ padding: '0 4px' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '.65rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 10 }}>What you get</div>
            {selectedPlan.features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: '.83rem', color: 'rgba(255,255,255,.6)' }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.72rem', color: 'rgba(255,255,255,.2)' }}>
          Secure payment · Cancel anytime · No hidden fees
        </p>
      </div>
    </div>
  );
}
