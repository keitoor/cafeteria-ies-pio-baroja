import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import BottomNav from '../../components/BottomNav';
import { isMockMode } from '../../services/api';
import useApi from '../../hooks/useApi';
import { api } from '../../services/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { count } = useCart();

  const { data: ordersData } = useApi(() => api.orders.list(), []);
  const orders = ordersData?.results ?? [];
  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);

  const handleLogout = async () => {
    if (!confirm('¿Seguro que quieres cerrar sesión?')) return;
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="app-shell">
      <div className="page-header">
        <h1 className="page-title">Mi perfil</h1>
      </div>

      {/* Avatar y datos */}
      <div className="profile-card">
        <div className="profile-avatar">
          {user?.picture ? <img src={user.picture} alt={user.name} /> : initials}
        </div>
        <div className="profile-name">{user?.name}</div>
        <div className="profile-email">{user?.email}</div>
        {user?.role === 'staff' && (
          <div style={{ marginTop: 8, fontSize: 12, background: 'var(--green)', color: 'white', padding: '4px 12px', borderRadius: 20, fontWeight: 700 }}>
            👨‍🍳 Personal
          </div>
        )}
      </div>

      {/* Estadísticas del usuario */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '12px 16px' }}>
        {[
          { label: 'Pedidos', value: orders.length, icon: '📋' },
          { label: 'Gastado', value: `${totalSpent.toFixed(2)}€`, icon: '💰' },
          { label: 'Carrito', value: count, icon: '🛒' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '12px 8px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Configuración */}
      <div className="settings-list" style={{ margin: '12px 16px' }}>
        <div className="setting-item" onClick={toggle}>
          <div className="setting-label">
            <span className="setting-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span>Modo {theme === 'dark' ? 'oscuro' : 'claro'}</span>
          </div>
          <button className={`toggle ${theme === 'dark' ? 'on' : ''}`} aria-label="Modo oscuro" />
        </div>

        <div className="setting-item" onClick={() => navigate('/orders')}>
          <div className="setting-label">
            <span className="setting-icon">📋</span>
            <span>Historial de pedidos</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>›</span>
        </div>

        <div className="setting-item" onClick={() => navigate('/catalog')}>
          <div className="setting-label">
            <span className="setting-icon">🛍️</span>
            <span>Ver catálogo</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>›</span>
        </div>

        {user?.role === 'staff' && (
          <div className="setting-item" onClick={() => navigate('/admin')}>
            <div className="setting-label">
              <span className="setting-icon">🔐</span>
              <span>Panel de administración</span>
            </div>
            <span style={{ color: 'var(--green)' }}>›</span>
          </div>
        )}

        {isMockMode && (
          <div className="setting-item">
            <div className="setting-label">
              <span className="setting-icon">⚠️</span>
              <span>Modo demo activo</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700 }}>MOCK</span>
          </div>
        )}
      </div>

      {/* Cerrar sesión */}
      <div style={{ padding: '0 16px 100px' }}>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
          🚪 Cerrar sesión
        </button>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, paddingBottom: 90 }}>
        Cafetería IES Pío Baroja · v2.0
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
