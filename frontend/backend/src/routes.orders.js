// ============================================================================
// Rutas de pedidos
// ============================================================================

import { Router } from 'express';
import db from './db.js';
import { authRequired, apiError } from './auth.js';

const router = Router();

function loadOrder(id) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return null;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return {
    id: order.id,
    user_id: order.user_id,
    user_name: order.user_name,
    status: order.status,
    total: order.total,
    pickup_slot: order.pickup_slot,
    pickup_code: order.pickup_code,
    notes: order.notes,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: items.map(it => ({
      product_id: it.product_id,
      name: it.name,
      emoji: it.emoji,
      quantity: it.quantity,
      unit_price: it.unit_price,
      subtotal: it.subtotal,
    })),
  };
}

// POST /orders/
router.post('/', authRequired(), (req, res) => {
  const { items, pickup_slot, notes = '' } = req.body || {};
  if (!Array.isArray(items) || items.length === 0 || !pickup_slot) {
    return res.status(422).json(apiError('VALIDATION_ERROR',
      'Items y pickup_slot son obligatorios.'));
  }

  // Cargamos los productos por sus IDs y calculamos el total en servidor
  const productById = new Map();
  for (const it of items) {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(it.product_id));
    if (!p) {
      return res.status(404).json(apiError('NOT_FOUND',
        `Producto ${it.product_id} no encontrado.`));
    }
    productById.set(p.id, p);
  }

  const fullItems = items.map(it => {
    const p = productById.get(Number(it.product_id));
    const qty = Number(it.quantity) || 1;
    const subtotal = +(p.price * qty).toFixed(2);
    return { product: p, quantity: qty, subtotal };
  });
  const total = +fullItems.reduce((s, it) => s + it.subtotal, 0).toFixed(2);

  const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(req.user.id);

  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO orders (user_id, user_name, status, total, pickup_slot, notes)
      VALUES (?, ?, 'pending_payment', ?, ?, ?)
    `).run(user.id, user.name, total, pickup_slot, notes);
    const orderId = result.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, name, emoji, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    fullItems.forEach(it =>
      insertItem.run(orderId, it.product.id, it.product.name, it.product.emoji,
                     it.quantity, it.product.price, it.subtotal)
    );
    return orderId;
  });
  const orderId = tx();
  res.status(201).json(loadOrder(orderId));
});

// GET /orders/   (cliente: sus pedidos; staff: todos)
router.get('/', authRequired(), (req, res) => {
  const { status = null, all = 'false' } = req.query;
  const isStaff = req.user.role === 'staff' && all === 'true';

  let sql = 'SELECT id FROM orders WHERE 1=1';
  const params = [];
  if (!isStaff) {
    sql += ' AND user_id = ?';
    params.push(req.user.id);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';

  const ids = db.prepare(sql).all(...params).map(r => r.id);
  const results = ids.map(loadOrder);
  res.json({
    count: results.length,
    page: 1,
    page_size: results.length,
    next: null,
    previous: null,
    results,
  });
});

// GET /orders/:id/
router.get('/:id', authRequired(), (req, res) => {
  const order = loadOrder(Number(req.params.id));
  if (!order) {
    return res.status(404).json(apiError('NOT_FOUND', 'Pedido no encontrado.'));
  }
  if (req.user.role !== 'staff' && order.user_id !== req.user.id) {
    return res.status(403).json(apiError('FORBIDDEN', 'No tienes acceso a este pedido.'));
  }
  res.json(order);
});

// PATCH /orders/:id/status/   (staff)
router.patch('/:id/status', authRequired('staff'), (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const validStates = ['paid', 'ready', 'delivered', 'cancelled'];
  if (!validStates.includes(status)) {
    return res.status(422).json(apiError('VALIDATION_ERROR',
      'Estado inválido.'));
  }
  const result = db.prepare(`
    UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, id);
  if (result.changes === 0) {
    return res.status(404).json(apiError('NOT_FOUND', 'Pedido no encontrado.'));
  }
  res.json(loadOrder(id));
});

// POST /orders/:id/cancel/
router.post('/:id/cancel', authRequired(), (req, res) => {
  const id = Number(req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json(apiError('NOT_FOUND', 'Pedido no encontrado.'));
  }
  if (req.user.role !== 'staff' && order.user_id !== req.user.id) {
    return res.status(403).json(apiError('FORBIDDEN', 'No tienes acceso a este pedido.'));
  }
  if (order.status === 'delivered') {
    return res.status(409).json(apiError('INVALID_STATE',
      'El pedido ya ha sido entregado y no puede cancelarse.'));
  }
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('cancelled', id);
  res.json(loadOrder(id));
});

export default router;
