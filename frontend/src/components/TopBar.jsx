import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

export default function TopBar({ user, cartCount = 0, cartIconRef, onCartClick }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  // Cerrar menu al hacer click fuera
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { icon: '🏠', label: 'Inicio', action: () => { navigate('/catalog'); setMenuOpen(false); } },
    { icon: '📋', label: 'Mis pedidos', action: () => { navigate('/orders'); setMenuOpen(false); } },
    { icon: '👤', label: 'Mi perfil', action: () => { navigate('/profile'); setMenuOpen(false); } },
    { icon: theme === 'dark' ? '☀️' : '🌙', label: theme === 'dark' ? 'Modo claro' : 'Modo oscuro', action: () => { toggle(); setMenuOpen(false); } },
    ...(user?.role === 'staff' ? [{ icon: '🔐', label: 'Panel admin', action: () => { navigate('/admin'); setMenuOpen(false); } }] : []),
    { icon: '🚪', label: 'Cerrar sesión', action: handleLogout, danger: true },
  ];

  return (
    <div className="topbar">
      {/* Avatar + saludo */}
      <div className="topbar-greeting" onClick={() => navigate('/profile')}>
        <div className="topbar-avatar">
          {user?.picture
            ? <img src={user.picture} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initials}
        </div>
        <div className="topbar-greeting-text">
          <div className="topbar-greeting-hi">{greeting}</div>
          <div className="topbar-greeting-name">{user?.name?.split(' ')[0] || ''}</div>
        </div>
      </div>

      {/* Acciones */}
      <div className="topbar-actions">
        {/* Botón carrito */}
        <button ref={cartIconRef} className="icon-btn" onClick={onCartClick} aria-label="Carrito">
          🛒
          {cartCount > 0 && <span className="icon-btn-badge">{cartCount}</span>}
        </button>

        {/* Menú hamburguesa */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="dropdown-menu">
              {/* Header del menú */}
              <div className="dropdown-header">
                <div style={{ fontWeight: 700, fontSize: 14 }}>{user?.name}</div>
                <div style={{ fontSize: 11, opacity: .7, marginTop: 2 }}>{user?.email}</div>
              </div>

              <div className="dropdown-divider" />

              {/* Items */}
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  className={`dropdown-item ${item.danger ? 'danger' : ''}`}
                  onClick={item.action}
                >
                  <span className="dropdown-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
