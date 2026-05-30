import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import useApi from '../../hooks/useApi';
import BottomNav from '../../components/BottomNav';
import { EmptyState, LoadingState, StatusPill } from '../../components/UIStates';

const STATUS_FILTERS = [
  { id: null, label: 'Todos' },
  { id: 'paid', label: 'Pagados' },
  { id: 'ready', label: 'Listos' },
  { id: 'delivered', label: 'Entregados' },
  { id: 'cancelled', label: 'Cancelados' },
];

const OrderCard = memo(function OrderCard({ order, onClick }) {
  const isClickable = order.status === 'paid' || order.status === 'ready';
  return (
    <div className="order-card" onClick={isClickable ? () => onClick(order.id) : undefined}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}>
      <div className="order-header">
        <div>
          <div className="order-id">Pedido #{order.id}</div>
          <div className="order-date">
            {new Date(order.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <StatusPill status={order.status} />
      </div>
      <div className="order-items">
        {order.items.map((it) => (
          <div key={it.product_id}>{it.quantity}× {it.emoji} {it.name}</div>
        ))}
      </div>
      <div className="order-footer">
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Recogida {order.pickup_slot}
          {order.pickup_code && (
            <strong style={{ fontFamily: 'DM Mono', color: 'var(--green)', marginLeft: 6 }}>
              · {order.pickup_code}
            </strong>
          )}
        </span>
        <span className="order-total">{Number(order.total).toFixed(2)} €</span>
      </div>
      {isClickable && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
          Ver código QR →
        </div>
      )}
    </div>
  );
});

export default function OrdersPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(null);
  const { data, loading } = useApi(() => api.orders.list({ status: filter }), [filter]);
  const orders = data?.results ?? [];
  const handleOrderClick = useCallback((id) => navigate(`/orders/${id}/qr`), [navigate]);

  return (
    <div className="app-shell">
      <div className="page-header">
        <button className="page-back" onClick={() => navigate('/catalog')}>←</button>
        <h1 className="page-title">Mis pedidos</h1>
      </div>

      {/* Filtros de estado */}
      <div style={{ display: 'flex', gap: 8, padding: '0 12px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {STATUS_FILTERS.map((f) => (
          <button key={String(f.id)} onClick={() => setFilter(f.id)}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: filter === f.id ? 'var(--green)' : 'var(--surface)',
              color: filter === f.id ? 'white' : 'var(--text-muted)',
              border: `1.5px solid ${filter === f.id ? 'var(--green)' : 'var(--border)'}`,
              cursor: 'pointer', transition: 'all .15s',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="orders-list">
        {loading && <LoadingState />}
        {!loading && orders.length === 0 && (
          <EmptyState emoji="📋" title="Sin pedidos" text="Aquí aparecerán tus pedidos" />
        )}
        {!loading && orders.map((o) => (
          <OrderCard key={o.id} order={o} onClick={handleOrderClick} />
        ))}
      </div>

      <BottomNav active="orders" />
    </div>
  );
}
