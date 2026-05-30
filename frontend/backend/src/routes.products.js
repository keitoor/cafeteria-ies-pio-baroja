// ============================================================================
// Rutas de productos
// ============================================================================

import { Router } from 'express';
import db from './db.js';
import { authRequired, apiError } from './auth.js';

const router = Router();

// Helper para convertir una fila de SQLite al formato que espera el frontend
function rowToProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    emoji: row.emoji,
    allergens: JSON.parse(row.allergens || '[]'),
    stock: row.stock,
    available: Boolean(row.available),
  };
}

// GET /products/
router.get('/', (req, res) => {
  const { search = '', category = 'todos' } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category && category !== 'todos') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY id';
  const rows = db.prepare(sql).all(...params).map(rowToProduct);
  res.json({
    count: rows.length,
    page: 1,
    page_size: rows.length,
    next: null,
    previous: null,
    results: rows,
  });
});

// GET /products/favorites/   (cliente)
router.get('/favorites', authRequired(), (req, res) => {
  const rows = db.prepare(`
    SELECT p.* FROM products p
    JOIN favorites f ON f.product_id = p.id
    WHERE f.user_id = ?
    ORDER BY p.id
  `).all(req.user.id).map(rowToProduct);
  res.json(rows);
});

// POST /products/:id/favorite/   (cliente)
router.post('/:id/favorite', authRequired(), (req, res) => {
  const productId = Number(req.params.id);
  const exists = db.prepare('SELECT 1 FROM products WHERE id = ?').get(productId);
  if (!exists) {
    return res.status(404).json(apiError('NOT_FOUND', 'Producto no encontrado.'));
  }
  const fav = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?')
                .get(req.user.id, productId);
  if (fav) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?')
      .run(req.user.id, productId);
    return res.json({ product_id: productId, is_favorite: false });
  }
  db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)')
    .run(req.user.id, productId);
  res.json({ product_id: productId, is_favorite: true });
});

// GET /products/:id/
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  if (!row) {
    return res.status(404).json(apiError('NOT_FOUND', 'Producto no encontrado.'));
  }
  res.json(rowToProduct(row));
});

// POST /products/   (staff)
router.post('/', authRequired('staff'), (req, res) => {
  const { name, description = '', price, category, emoji = '🍽️',
          allergens = [], stock = 0, available = true } = req.body || {};
  if (!name || !price || !category) {
    return res.status(422).json(apiError('VALIDATION_ERROR',
      'Faltan campos obligatorios (name, price, category).'));
  }
  const result = db.prepare(`
    INSERT INTO products (name, description, price, category, emoji, allergens, stock, available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, Number(price), category, emoji,
         JSON.stringify(allergens), Number(stock), available ? 1 : 0);
  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(rowToProduct(created));
});

// PATCH /products/:id/   (staff)
router.patch('/:id', authRequired('staff'), (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json(apiError('NOT_FOUND', 'Producto no encontrado.'));
  }
  const patch = { ...existing, ...req.body };
  const allergens = Array.isArray(patch.allergens)
    ? JSON.stringify(patch.allergens)
    : patch.allergens;
  db.prepare(`
    UPDATE products SET name=?, description=?, price=?, category=?, emoji=?,
           allergens=?, stock=?, available=? WHERE id=?
  `).run(
    patch.name, patch.description, Number(patch.price), patch.category,
    patch.emoji, allergens, Number(patch.stock),
    patch.available ? 1 : 0, id
  );
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(rowToProduct(updated));
});

// DELETE /products/:id/   (staff)
router.delete('/:id', authRequired('staff'), (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json(apiError('NOT_FOUND', 'Producto no encontrado.'));
  }
  res.status(204).end();
});

export default router;
