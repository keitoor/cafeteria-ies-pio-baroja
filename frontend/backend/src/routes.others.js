// ============================================================================
// Rutas de pagos (simuladas) y estadísticas
// ============================================================================

import { Router } from 'express';
import db from './db.js';
import { authRequired, apiError } from './auth.js';

export const paymentsRouter = Router();
export const statsRouter = Router();

// --- Pagos ----------------------------------------------------------------
const PICKUP_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genPickupCode() {
  return Array.from({ length: 4 }, () =>
    PICKUP_CHARS.charAt(Math.floor(Math.random() * PICKUP_CHARS.length))
  ).join('');
}

// POST /payments/redsys/initiate/
//   En un entorno real esto generaría los parámetros firmados de Redsys
//   y el frontend abriría el TPV. Aquí simulamos el resultado del pago.
paymentsRouter.post('/redsys/initiate', authRequired(), (req, res) => {
  const { order_id } = req.body || {};
  if (!order_id) {
    return res.status(422).json(apiError('VALIDATION_ERROR',
      'Falta el campo order_id.'));
  }
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(order_id));
  if (!order) {
    return res.status(404).json(apiError('NOT_FOUND', 'Pedido no encontrado.'));
  }
  if (order.user_id !== req.user.id) {
    return res.status(403).json(apiError('FORBIDDEN', 'No puedes pagar este pedido.'));
  }

  // Simula un 10% de fallos del banco
  if (Math.random() < 0.1) {
    return res.status(402).json(apiError('PAYMENT_DECLINED',
      'El pago ha sido rechazado por la entidad bancaria.'));
  }

  const pickup_code = genPickupCode();
  db.prepare(`
    UPDATE orders SET status = 'paid', pickup_code = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(pickup_code, order.id);

  res.json({
    order_id: order.id,
    pickup_code,
    status: 'paid',
  });
});

// --- Estadísticas ---------------------------------------------------------

// GET /stats/summary/
statsRouter.get('/summary', authRequired('staff'), (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const todayRow = db.prepare(`
    SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
    FROM orders
    WHERE substr(created_at, 1, 10) = ?
      AND status NOT IN ('cancelled', 'pending_payment')
  `).get(today);

  const pending = db.prepare(`
    SELECT COUNT(*) AS c FROM orders WHERE status = 'paid'
  `).get().c;

  const avgTicket = todayRow.orders > 0
    ? +(todayRow.revenue / todayRow.orders).toFixed(2)
    : 0;

  res.json({
    today_orders: todayRow.orders,
    today_revenue: +Number(todayRow.revenue).toFixed(2),
    avg_ticket: avgTicket,
    pending_orders: pending,
  });
});

// GET /stats/sales/
statsRouter.get('/sales', authRequired('staff'), (_req, res) => {
  // Últimos 7 días, agrupado por día
  const series = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = db.prepare(`
      SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
      FROM orders
      WHERE substr(created_at, 1, 10) = ?
        AND status NOT IN ('cancelled', 'pending_payment')
    `).get(key);
    series.push({
      date: key,
      orders: row.orders,
      revenue: +Number(row.revenue).toFixed(2),
    });
  }
  res.json({
    granularity: 'day',
    series,
    total_orders: series.reduce((s, b) => s + b.orders, 0),
    total_revenue: +series.reduce((s, b) => s + b.revenue, 0).toFixed(2),
  });
});

// GET /stats/top-products/
statsRouter.get('/top-products', authRequired('staff'), (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 20);
  const rows = db.prepare(`
    SELECT
      oi.product_id,
      oi.name,
      oi.emoji,
      SUM(oi.quantity) AS units_sold,
      SUM(oi.subtotal) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status NOT IN ('cancelled', 'pending_payment')
    GROUP BY oi.product_id
    ORDER BY units_sold DESC
    LIMIT ?
  `).all(limit);

  res.json(rows.map(r => ({
    product_id: r.product_id,
    name: r.name,
    emoji: r.emoji,
    units_sold: r.units_sold,
    revenue: +Number(r.revenue).toFixed(2),
  })));
});
