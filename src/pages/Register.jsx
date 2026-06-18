import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import LanguageSelector from '../components/LanguageSelector';

export default function Register() {
  const { t } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/v2/auth.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name: form.full_name, email: form.email, username: form.username, password: form.password })
      });
      const data = await res.json();
      if (data.ok) {
        // Auto login
        const loginRes = await login(form.email, form.password);
        if (loginRes.ok) navigate('/');
        else navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <LanguageSelector compact />
      </div>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, letterSpacing: '.1em', color: '#e50914', textDecoration: 'none' }}>SHOWMINE</Link>
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', letterSpacing: '.15em', marginTop: 4 }}>ENTERTAINMENT</div>
        </div>

        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '2rem' }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>{t('create_account_btn')}</h1>

          {error && (
            <div style={{ background: 'rgba(229,9,20,.1)', border: '1px solid rgba(229,9,20,.3)', borderRadius: 8, padding: '.75rem 1rem', color: '#ff6b6b', fontSize: '.84rem', marginBottom: '1rem' }}>{error}</div>
          )}

          <form onSubmit={submit}>
            {[
              { name: 'full_name', label: t('full_name'), type: 'text', placeholder: t('full_name') },
              { name: 'email', label: t('email_username'), type: 'email', placeholder: 'your@email.com' },
              { name: 'username', label: t('username'), type: 'text', placeholder: t('username') },
              { name: 'password', label: t('password'), type: 'password', placeholder: 'Min. 6 characters' },
              { name: 'confirm', label: t('confirm_password'), type: 'password', placeholder: t('confirm_password') },
            ].map(field => (
              <div key={field.name} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.78rem', color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>{field.label}</label>
                <input name={field.name} type={field.type} value={form[field.name]} onChange={handle} required placeholder={field.placeholder}
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: '.9rem', outline: 'none' }} />
              </div>
            ))}

            <p style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)', marginBottom: '1rem', lineHeight: 1.5 }}>
              By signing up you agree to our{' '}
              <Link to="/terms" style={{ color: '#e50914' }}>Terms</Link> and{' '}
              <Link to="/privacy" style={{ color: '#e50914' }}>Privacy Policy</Link>
            </p>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '.85rem',
              background: loading ? '#333' : '#e50914',
              color: '#fff', border: 'none', borderRadius: 8,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1rem', fontWeight: 800,
              letterSpacing: '.06em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? t('creating_account') : t('create_account_btn')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.84rem', color: 'rgba(255,255,255,.4)' }}>
            {t('already_have_account')}{' '}
            <Link to="/login" style={{ color: '#e50914', fontWeight: 700 }}>{t('sign_in')}</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.72rem', color: 'rgba(255,255,255,.2)' }}>
          © 2026 Showmine Entertainment
        </p>
      </div>
    </div>
  );
}
