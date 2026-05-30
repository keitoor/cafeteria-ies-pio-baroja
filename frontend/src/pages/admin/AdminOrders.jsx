import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { StatusPill, EmptyState, LoadingState } from '../../components/UIStates';

const STATUS_FLOW = {
  paid: { next: 'ready', label: '✅ Marcar listo', color: 'var(--green)' },
  ready: { next: 'delivered', label: '🎉 Entregado', color: '#5b8def' },
};

const STATUS_FILTERS = [
  { id: null, label: 'Todos' },
  { id: 'paid', label: '💰 Pagados' },
  { id: 'ready', label: '✅ Listos' },
  { id: 'delivered', label: '🎉 Entregados' },
  { id: 'cancelled', label: '❌ Cancelados' },
];

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('paid'); // Por defecto muestra los pendientes
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.orders.list({ all: true, status: filter });
      setOrders(res.results);
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh cada 15 segundos
  useEffect(() => {
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const advance = async (order) => {
    const flow = STATUS_FLOW[order.status];
    if (!flow) return;
    try {
      await api.orders.updateStatus(order.id, flow.next);
      toast.show(`Pedido #${order.id} → ${flow.next}`, 'success');
      load();
    } catch { toast.show('Error al actualizar estado', 'error'); }
  };

  const cancel = async (order) => {
    if (!confirm(`¿Cancelar pedido #${order.id}?`)) return;
    try {
      await api.orders.cancel(order.id);
      toast.show(`Pedido #${order.id} cancelado`, 'success');
      load();
    } catch { toast.show('Error al cancelar', 'error'); }
  };

  return (
    <div>
      {/* Header con refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: '#888' }}>
          🔄 Actualizado: {lastRefresh.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <button onClick={load} style={{
          background: '#2a2a2a', color: 'var(--green)', border: '1px solid var(--green)',
          borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>🔄 Actualizar</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {STATUS_FILTERS.map((f) => (
          <button key={String(f.id)} onClick={() => setFilter(f.id)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: filter === f.id ? 'var(--green)' : '#2a2a2a',
            color: filter === f.id ? 'white' : '#888',
            border: `1px solid ${filter === f.id ? 'var(--green)' : '#333'}`,
            cursor: 'pointer', transition: 'all .15s',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Lista */}
      {loading && <LoadingState />}
      {!loading && orders.length === 0 && (
        <EmptyState emoji="📭" title="Sin pedidos" text="No hay pedidos con este filtro" />
      )}
      {!loading && orders.map((order) => (
        <div key={order.id} className="admin-order">
          <div className="admin-order-head">
            <div>
              <div className="admin-order-code">#{order.id}</div>
              <div className="admin-order-time">
                {order.user_name} · {new Date(order.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <StatusPill status={order.status} />
              {order.pickup_code && (
                <span style={{ fontFamily: 'DM Mono', fontSize: 18, fontWeight: 900, color: 'var(--green)' }}>
                  {order.pickup_code}
                </span>
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="admin-order-items">
            {order.items.map((it) => (
              <div key={it.product_id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{it.quantity}× {it.emoji} {it.name}</span>
                <span style={{ color: '#888', fontFamily: 'DM Mono' }}>{Number(it.subtotal).toFixed(2)}€</span>
              </div>
            ))}
          </div>

          {/* Nota del cliente */}
          {order.notes && (
            <div style={{
              background: '#2a1a00', border: '1px solid #ffa04d',
              borderRadius: 8, padding: '8px 12px', marginTop: 8,
              fontSize: 13, color: '#ffa04d', display: 'flex', gap: 8,
            }}>
              <span>📝</span>
              <span><strong>Nota:</strong> {order.notes}</span>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #2a2a2a' }}>
            <span style={{ fontSize: 12, color: '#888' }}>🕐 Recogida {order.pickup_slot}</span>
            <span style={{ fontFamily: 'DM Mono', fontWeight: 800, color: 'var(--green)' }}>
              {Number(order.total).toFixed(2)} €
            </span>
          </div>

          {/* Acciones */}
          <div className="admin-order-actions">
            {STATUS_FLOW[order.status] && (
              <button className="admin-btn" onClick={() => advance(order)}
                style={{ background: STATUS_FLOW[order.status].color, color: 'white' }}>
                {STATUS_FLOW[order.status].label}
              </button>
            )}
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <button className="admin-btn admin-btn-danger" onClick={() => cancel(order)}>
                ❌ Cancelar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
