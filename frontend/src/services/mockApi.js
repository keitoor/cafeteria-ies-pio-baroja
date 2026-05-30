import { mockProducts } from './mockData';

const STORAGE_KEYS = {
  ORDERS: 'cafe_mock_orders',
  FAVORITES: 'cafe_mock_favorites',
  USER: 'cafe_mock_user',
  PRODUCTS: 'cafe_mock_products',
};

const load = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
  save(STORAGE_KEYS.PRODUCTS, mockProducts);
}

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const newId = () => Math.floor(Math.random() * 90000) + 10000;
const newPickupCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

export const mockAuth = {
  async loginWithGoogle(idToken, fakeProfile = null) {
    await delay(400);
    const user = fakeProfile || {
      id: 42, email: 'alumno@iespiobaroja.es',
      name: 'Alumno de prueba', picture: null, role: 'client',
    };
    save(STORAGE_KEYS.USER, user);
    return { access: 'mock-access-' + Date.now(), refresh: 'mock-refresh-' + Date.now(), user };
  },
  async loginAdmin(username, password) {
    await delay(300);
    if (username === 'admin' && password === '1234') {
      const user = { id: 1, email: 'admin@iespiobaroja.es', name: 'Personal Cafetería', picture: null, role: 'staff' };
      save(STORAGE_KEYS.USER, user);
      return { access: 'mock-access-admin-' + Date.now(), refresh: 'mock-refresh-admin-' + Date.now(), user };
    }
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Usuario o contraseña incorrectos.');
  },
  async me() {
    await delay(150);
    const user = load(STORAGE_KEYS.USER, null);
    if (!user) throw new ApiError(401, 'NOT_AUTHENTICATED', 'No estás autenticado.');
    return user;
  },
  async logout() {
    await delay(100);
    localStorage.removeItem(STORAGE_KEYS.USER);
    return { ok: true };
  },
};

export const mockProductsApi = {
  async list({ search = '', category = 'todos' } = {}) {
    await delay(200);
    let products = load(STORAGE_KEYS.PRODUCTS, mockProducts);
    if (category && category !== 'todos') products = products.filter((p) => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return { count: products.length, page: 1, page_size: products.length, next: null, previous: null, results: products };
  },
  async get(id) {
    await delay(150);
    const products = load(STORAGE_KEYS.PRODUCTS, mockProducts);
    const product = products.find((p) => p.id === Number(id));
    if (!product) throw new ApiError(404, 'NOT_FOUND', 'Producto no encontrado.');
    return product;
  },
  async create(data) {
    await delay(250);
    const products = load(STORAGE_KEYS.PRODUCTS, mockProducts);
    const newProduct = { id: newId(), ...data, available: data.available ?? true, stock: data.stock ?? 0, allergens: data.allergens ?? [] };
    products.push(newProduct);
    save(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  },
  async update(id, patch) {
    await delay(250);
    const products = load(STORAGE_KEYS.PRODUCTS, mockProducts);
    const idx = products.findIndex((p) => p.id === Number(id));
    if (idx === -1) throw new ApiError(404, 'NOT_FOUND', 'Producto no encontrado.');
    products[idx] = { ...products[idx], ...patch };
    save(STORAGE_KEYS.PRODUCTS, products);
    return products[idx];
  },
  async remove(id) {
    await delay(200);
    const products = load(STORAGE_KEYS.PRODUCTS, mockProducts);
    save(STORAGE_KEYS.PRODUCTS, products.filter((p) => p.id !== Number(id)));
    return { ok: true };
  },
  async favorites() {
    await delay(150);
    const favIds = load(STORAGE_KEYS.FAVORITES, []);
    const products = load(STORAGE_KEYS.PRODUCTS, mockProducts);
    return products.filter((p) => favIds.includes(p.id));
  },
  async toggleFavorite(id) {
    await delay(120);
    const favIds = load(STORAGE_KEYS.FAVORITES, []);
    const exists = favIds.includes(Number(id));
    save(STORAGE_KEYS.FAVORITES, exists ? favIds.filter((fid) => fid !== Number(id)) : [...favIds, Number(id)]);
    return { product_id: Number(id), is_favorite: !exists };
  },
};

export const mockOrdersApi = {
  async create({ items, pickup_slot, notes }) {
    await delay(400);
    const products = load(STORAGE_KEYS.PRODUCTS, mockProducts);
    const fullItems = items.map((it) => {
      const p = products.find((pr) => pr.id === it.product_id);
      if (!p) throw new ApiError(404, 'NOT_FOUND', `Producto ${it.product_id} no encontrado.`);
      return { product_id: p.id, name: p.name, emoji: p.emoji, quantity: it.quantity, unit_price: p.price, subtotal: +(p.price * it.quantity).toFixed(2) };
    });

    // ✅ Actualizar stock al crear pedido
    const updatedProducts = products.map((p) => {
      const item = items.find((it) => it.product_id === p.id);
      if (item) return { ...p, stock: Math.max(0, (p.stock || 0) - item.quantity) };
      return p;
    });
    save(STORAGE_KEYS.PRODUCTS, updatedProducts);

    const total = +fullItems.reduce((s, it) => s + it.subtotal, 0).toFixed(2);
    const user = load(STORAGE_KEYS.USER, null);
    const order = {
      id: newId(), user_id: user?.id || 0, user_name: user?.name || 'Usuario',
      status: 'pending_payment', total, pickup_slot, pickup_code: null,
      notes: notes || '', items: fullItems, created_at: new Date().toISOString(),
    };
    const orders = load(STORAGE_KEYS.ORDERS, []);
    orders.push(order);
    save(STORAGE_KEYS.ORDERS, orders);
    return order;
  },
  async list({ status = null, all = false } = {}) {
    await delay(200);
    const user = load(STORAGE_KEYS.USER, null);
    let orders = load(STORAGE_KEYS.ORDERS, []);
    if (!all && user?.role !== 'staff') orders = orders.filter((o) => o.user_id === user?.id);
    if (status) orders = orders.filter((o) => o.status === status);
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { count: orders.length, page: 1, page_size: orders.length, next: null, previous: null, results: orders };
  },
  async get(id) {
    await delay(150);
    const orders = load(STORAGE_KEYS.ORDERS, []);
    const order = orders.find((o) => o.id === Number(id));
    if (!order) throw new ApiError(404, 'NOT_FOUND', 'Pedido no encontrado.');
    return order;
  },
  async updateStatus(id, status) {
    await delay(200);
    const orders = load(STORAGE_KEYS.ORDERS, []);
    const idx = orders.findIndex((o) => o.id === Number(id));
    if (idx === -1) throw new ApiError(404, 'NOT_FOUND', 'Pedido no encontrado.');
    orders[idx] = { ...orders[idx], status, updated_at: new Date().toISOString() };
    save(STORAGE_KEYS.ORDERS, orders);
    return orders[idx];
  },
  async cancel(id) { return this.updateStatus(id, 'cancelled'); },
};

export const mockPaymentsApi = {
  async initiate(orderId) {
    await delay(800);
    const success = Math.random() > 0.1;
    const orders = load(STORAGE_KEYS.ORDERS, []);
    const idx = orders.findIndex((o) => o.id === Number(orderId));
    if (idx === -1) throw new ApiError(404, 'NOT_FOUND', 'Pedido no encontrado.');
    if (!success) throw new ApiError(402, 'PAYMENT_DECLINED', 'El pago ha sido rechazado por la entidad bancaria.');
    orders[idx] = { ...orders[idx], status: 'paid', pickup_code: newPickupCode() };
    save(STORAGE_KEYS.ORDERS, orders);
    return { order_id: Number(orderId), pickup_code: orders[idx].pickup_code, status: 'paid' };
  },
};

export const mockStatsApi = {
  async summary() {
    await delay(200);
    const orders = load(STORAGE_KEYS.ORDERS, []);
    const today = new Date().toDateString();
    const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today && o.status !== 'cancelled' && o.status !== 'pending_payment');
    const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
    return {
      today_orders: todayOrders.length,
      today_revenue: +todayRevenue.toFixed(2),
      avg_ticket: todayOrders.length ? +(todayRevenue / todayOrders.length).toFixed(2) : 0,
      pending_orders: orders.filter((o) => o.status === 'paid').length,
    };
  },
  async sales({ days = 7 } = {}) {
    await delay(200);
    const orders = load(STORAGE_KEYS.ORDERS, []).filter((o) => o.status !== 'cancelled' && o.status !== 'pending_payment');
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, orders: 0, revenue: 0 };
    }
    orders.forEach((o) => { const k = o.created_at.slice(0, 10); if (buckets[k]) { buckets[k].orders += 1; buckets[k].revenue += o.total; } });
    const series = Object.values(buckets).map((b) => ({ ...b, revenue: +b.revenue.toFixed(2) }));
    return { granularity: 'day', series, total_orders: series.reduce((s, b) => s + b.orders, 0), total_revenue: +series.reduce((s, b) => s + b.revenue, 0).toFixed(2) };
  },
  async topProducts({ limit = 5 } = {}) {
    await delay(200);
    const orders = load(STORAGE_KEYS.ORDERS, []).filter((o) => o.status !== 'cancelled');
    const counts = {};
    orders.forEach((o) => o.items.forEach((it) => {
      if (!counts[it.product_id]) counts[it.product_id] = { product_id: it.product_id, name: it.name, emoji: it.emoji, units_sold: 0, revenue: 0 };
      counts[it.product_id].units_sold += it.quantity;
      counts[it.product_id].revenue += it.subtotal;
    }));
    return Object.values(counts).sort((a, b) => b.units_sold - a.units_sold).slice(0, limit).map((p) => ({ ...p, revenue: +p.revenue.toFixed(2) }));
  },
};

export class ApiError extends Error {
  constructor(httpStatus, code, message, details = null) {
    super(message); this.httpStatus = httpStatus; this.code = code; this.details = details;
  }
}
