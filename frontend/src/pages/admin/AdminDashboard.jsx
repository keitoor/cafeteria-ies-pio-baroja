import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useMediaQuery from '../../hooks/useMediaQuery';
import AdminOrders from './AdminOrders';
import AdminMenu from './AdminMenu';
import AdminStats from './AdminStats';

const TABS = [
  { id: 'orders', label: 'Pedidos', icon: '📋' },
  { id: 'menu', label: 'Menú', icon: '🍽️' },
  { id: 'stats', label: 'Estadísticas', icon: '📊' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('orders');
  const isDesktop = useMediaQuery('(min-width: 900px)');

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const pendingCount = (() => {
    try {
      return JSON.parse(localStorage.getItem('cafe_mock_orders') || '[]')
        .filter(o => o.status === 'paid').length;
    } catch { return 0; }
  })();

  // ── Desktop: layout con sidebar ───────────────────────────────────────────
  if (isDesktop) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0' }}>
        {/* Sidebar */}
        <div style={{
          width: 220, background: '#1a1a1a', borderRight: '1px solid #2a2a2a',
          display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
        }}>
          {/* Logo */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #2a2a2a' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green)' }}>☕ Cafetería</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Panel de gestión</div>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '12px 0' }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: tab === t.id ? 'rgba(29,158,117,.15)' : 'none',
                color: tab === t.id ? 'var(--green)' : '#888',
                borderLeft: `3px solid ${tab === t.id ? 'var(--green)' : 'transparent'}`,
                border: 'none', transition: 'all .15s', position: 'relative',
              }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <span>{t.label}</span>
                {t.id === 'orders' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: 'var(--red)', color: 'white',
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                  }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Usuario */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2a2a' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>{user?.email}</div>
            <button onClick={handleLogout} style={{
              width: '100%', padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: '#2a2a2a', color: '#ccc', border: 'none', cursor: 'pointer',
              transition: 'background .15s',
            }}>🚪 Cerrar sesión</button>
          </div>
        </div>

        {/* Contenido principal */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: 'white' }}>
              {TABS.find(t => t.id === tab)?.icon} {TABS.find(t => t.id === tab)?.label}
            </h1>
            {tab === 'orders' && <AdminOrders />}
            {tab === 'menu' && <AdminMenu />}
            {tab === 'stats' && <AdminStats />}
          </div>
        </div>
      </div>
    );
  }

  // ── Móvil: layout con tabs ────────────────────────────────────────────────
  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-title">
          <span>☕</span>
          <span>Panel Cafetería</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#888' }}>{user?.name}</span>
          <button className="admin-btn admin-btn-secondary"
            style={{ padding: '6px 12px' }} onClick={handleLogout}>
            Salir
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)} style={{ position: 'relative' }}>
            {t.icon} {t.label}
            {t.id === 'orders' && pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 4,
                background: 'var(--red)', color: 'white',
                fontSize: 9, fontWeight: 700,
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {tab === 'orders' && <AdminOrders />}
        {tab === 'menu' && <AdminMenu />}
        {tab === 'stats' && <AdminStats />}
      </div>
    </div>
  );
}
