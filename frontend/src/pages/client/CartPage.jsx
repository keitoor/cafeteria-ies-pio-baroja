import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import BottomNav from '../../components/BottomNav';
import PaymentOverlay from '../../components/PaymentOverlay';

// Genera slots de recogida entre 08:30 y 21:00 cada 15 minutos
function generateSlots() {
  const slots = [];
  for (let h = 8; h <= 20; h++) {
    for (let m of [0, 15, 30, 45]) {
      if (h === 8 && m < 30) continue; // empieza en 08:30
      if (h === 20 && m > 45) continue;
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }
  slots.push('21:00');
  return slots;
}

const ALL_SLOTS = generateSlots();

// Slots disponibles según hora actual (solo futuros)
function getAvailableSlots() {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes() + 15; // +15min margen
  return ALL_SLOTS.filter(s => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m >= nowMins;
  });
}

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, total, clear } = useCart();
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [slot, setSlot] = useState('');
  const [payState, setPayState] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const availableSlots = useMemo(() => getAvailableSlots(), []);
  const isOpen = availableSlots.length > 0;

  const handlePay = async () => {
    if (items.length === 0) return;
    if (!slot) { toast.show('Elige una hora de recogida', 'error'); return; }
    try {
      const order = await api.orders.create({
        items: items.map((it) => ({ product_id: it.product.id, quantity: it.quantity })),
        pickup_slot: slot,
        notes,
      });
      setCurrentOrderId(order.id);
      setPayState('form');
    } catch {
      toast.show('Error al crear el pedido', 'error');
    }
  };

  const handleConfirmCard = async () => {
    setPayState('processing');
    try {
      const result = await api.payments.initiate(currentOrderId);
      setPayState('success');
      setTimeout(() => {
        clear();
        navigate(`/orders/${result.order_id}/qr`, { replace: true });
      }, 2000);
    } catch {
      setPayState('error');
    }
  };

  if (items.length === 0) {
    return (
      <div className="app-shell">
        <div className="page-header">
          <button className="page-back" onClick={() => navigate('/catalog')}>←</button>
          <h1 className="page-title">Carrito</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-emoji">🛒</div>
          <div className="empty-state-title">Tu carrito está vacío</div>
          <div className="empty-state-text">Añade productos del catálogo</div>
          <button className="btn btn-primary" style={{ marginTop: 24, maxWidth: 240, marginInline: 'auto' }}
            onClick={() => navigate('/catalog')}>Ir al catálogo</button>
        </div>
        <BottomNav active="cart" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-header">
        <button className="page-back" onClick={() => navigate('/catalog')}>←</button>
        <h1 className="page-title">Tu pedido</h1>
      </div>

      {/* Productos */}
      <div className="cart-list">
        {items.map((it) => (
          <div key={it.product.id} className="cart-item">
            <div className="cart-item-emoji">{it.product.emoji}</div>
            <div className="cart-item-info">
              <div className="cart-item-name">{it.product.name}</div>
              <div className="cart-item-price">{Number(it.product.price).toFixed(2)} €</div>
            </div>
            <div className="cart-qty">
              <button className="qty-btn" onClick={() => updateQuantity(it.product.id, it.quantity - 1)}>−</button>
              <span className="qty-value">{it.quantity}</span>
              <button className="qty-btn" onClick={() => updateQuantity(it.product.id, it.quantity + 1)}>+</button>
            </div>
            <button className="cart-remove" onClick={() => removeItem(it.product.id)}>✕</button>
          </div>
        ))}
      </div>

      {/* Hora de recogida */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>
          🕐 Hora de recogida
        </div>
        {!isOpen ? (
          <div style={{ background: '#ffe0e0', borderRadius: 10, padding: 14, fontSize: 14, color: 'var(--red)', textAlign: 'center' }}>
            ❌ La cafetería está cerrada. Horario: 08:30 – 21:00
          </div>
        ) : (
          <>
            <select
              className="form-input"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              style={{ marginBottom: 6, cursor: 'pointer' }}
            >
              <option value="">-- Selecciona hora --</option>
              {availableSlots.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Horario: 08:30 – 21:00 · Solo horas disponibles desde ahora
            </div>
          </>
        )}
      </div>

      {/* Notas */}
      <div style={{ padding: '0 16px 12px' }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>
          📝 Notas (opcional)
        </label>
        <textarea
          placeholder="Ej: sin cebolla, alergia a frutos secos..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ resize: 'none', borderRadius: 10, padding: '10px 14px', width: '100%',
            background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' }}
        />
      </div>

      {/* Resumen */}
      <div style={{ padding: '0 16px 100px' }}>
        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>Productos ({items.reduce((s,i) => s+i.quantity, 0)})</span>
            <span>{total.toFixed(2)} €</span>
          </div>
          {slot && (
            <div className="cart-summary-row" style={{ color: 'var(--green)', fontWeight: 600 }}>
              <span>🕐 Recogida</span>
              <span>{slot}</span>
            </div>
          )}
          <div className="cart-summary-row" style={{ fontWeight: 800, fontSize: 18, marginTop: 8, color: 'var(--green)' }}>
            <span>Total</span>
            <span>{total.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <div className="sticky-bottom">
        <button className="btn btn-primary" onClick={handlePay} disabled={!isOpen}>
          💳 Pagar con tarjeta — {total.toFixed(2)} €
        </button>
        <button className="btn btn-secondary" style={{ marginTop: 8 }}
          onClick={() => { if (confirm('¿Vaciar carrito?')) clear(); }}>
          Vaciar carrito
        </button>
      </div>

      {payState && (
        <PaymentOverlay state={payState} onClose={() => setPayState(null)} onConfirmCard={handleConfirmCard} />
      )}
      <BottomNav active="cart" />
    </div>
  );
}
