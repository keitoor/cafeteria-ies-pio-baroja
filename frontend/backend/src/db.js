// ============================================================================
// Base de datos SQLite
//   Crea las tablas si no existen y siembra datos iniciales la primera vez.
// ============================================================================

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// Esquema
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    picture TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('client','staff')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL,
    category TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🍽️',
    allergens TEXT NOT NULL DEFAULT '[]',
    stock INTEGER NOT NULL DEFAULT 0,
    available INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_payment'
      CHECK(status IN ('pending_payment','paid','ready','delivered','cancelled')),
    total REAL NOT NULL,
    pickup_slot TEXT NOT NULL,
    pickup_code TEXT,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
`);

// ---------------------------------------------------------------------------
// Datos iniciales (solo si la tabla está vacía)
// ---------------------------------------------------------------------------
const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (productCount === 0) {
  console.log('Sembrando productos iniciales...');
  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, category, emoji, allergens, stock, available)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  const initialProducts = [
    ['Bocadillo de jamón',    'Pan artesano con jamón serrano',         2.5, 'bocadillos', '🥪', '["gluten"]', 24],
    ['Bocadillo de tortilla', 'Pan con tortilla francesa recién hecha', 2.2, 'bocadillos', '🥖', '["gluten","huevo"]', 18],
    ['Bocadillo de queso',    'Pan con queso manchego',                 2.3, 'bocadillos', '🧀', '["gluten","lacteos"]', 20],
    ['Pizza margarita',       'Porción individual de pizza casera',     2.8, 'comida',     '🍕', '["gluten","lacteos"]', 15],
    ['Empanadilla de atún',   'Empanadilla casera rellena de atún',     1.8, 'comida',     '🥟', '["gluten","pescado","huevo"]', 22],
    ['Zumo de naranja',       'Recién exprimido (200ml)',               1.5, 'bebidas',    '🍊', '[]', 30],
    ['Agua mineral',          'Botella de 500ml',                       0.8, 'bebidas',    '💧', '[]', 50],
    ['Refresco',              'Cola, naranja o limón (330ml)',          1.5, 'bebidas',    '🥤', '[]', 35],
    ['Donut de chocolate',    'Donut glaseado con cobertura',           1.2, 'dulces',     '🍩', '["gluten","lacteos","huevo"]', 16],
    ['Galletas con pepitas',  'Pack de 3 galletas con pepitas',         1.0, 'dulces',     '🍪', '["gluten","lacteos","huevo"]', 28],
  ];
  const tx = db.transaction((items) => {
    items.forEach(p => insertProduct.run(...p));
  });
  tx(initialProducts);
}

// Crear usuario admin si no existe
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@iespiobaroja.es');
if (!adminExists) {
  console.log('Creando usuario admin por defecto...');
  const hash = bcrypt.hashSync('1234', 8);
  db.prepare(`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (?, ?, ?, ?)
  `).run('admin@iespiobaroja.es', hash, 'Personal Cafetería', 'staff');
}

export default db;
