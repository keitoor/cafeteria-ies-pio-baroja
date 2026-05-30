import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loader" />
        <div>Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={requireRole === 'staff' ? '/admin/login' : '/login'} replace />;
  }

  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/catalog" replace />;
  }

  return children;
}
