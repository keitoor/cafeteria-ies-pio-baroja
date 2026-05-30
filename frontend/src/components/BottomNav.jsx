import { useNavigate } from 'react-router-dom';

const items = [
  { id: 'catalog', label: 'Inicio', icon: '🏠', path: '/catalog' },
  { id: 'cart', label: 'Carrito', icon: '🛒', path: '/cart' },
  { id: 'orders', label: 'Pedidos', icon: '📋', path: '/orders' },
  { id: 'profile', label: 'Perfil', icon: '👤', path: '/profile' },
];

export default function BottomNav({ active }) {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav">
      {items.map((it) => (
        <button
          key={it.id}
          className={`nav-item ${active === it.id ? 'active' : ''}`}
          onClick={() => navigate(it.path)}
        >
          <span className="nav-icon">{it.icon}</span>
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
