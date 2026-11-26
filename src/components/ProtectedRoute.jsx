import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isOnboarded } from '../pages/Onboarding';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

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
  return <Navigate to={isOnboarded() ? '/login' : '/onboarding'} replace />;
}