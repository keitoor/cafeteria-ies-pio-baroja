import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function SplashPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (user) {
        navigate('/catalog', { replace: true });
      } else {
        const seen = localStorage.getItem('cafe_onboarding_seen');
        navigate(seen ? '/login' : '/onboarding', { replace: true });
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [loading, user, navigate]);

  return (
    <div className="splash">
      <div className="splash-logo">☕</div>
      <div className="splash-title">Cafetería</div>
      <div className="splash-subtitle">IES Pío Baroja</div>
      <div style={{ marginTop: 32 }}>
        <div className="loader" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: 'white' }} />
      </div>
    </div>
  );
}
