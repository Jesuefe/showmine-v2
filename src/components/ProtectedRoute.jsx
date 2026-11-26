import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isOnboarded } from '../pages/Onboarding';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#000'
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #333',
          borderTop: '3px solid #e50914', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user) return children;
  const here = location.pathname + location.search;
  const next = here && here !== '/' ? `?next=${encodeURIComponent(here)}` : '';
  // Someone sent straight to a page (e.g. /subscribe from the app) skips the intro slides
  const base = isOnboarded() || next ? '/login' : '/onboarding';
  return <Navigate to={base + next} replace />;
}