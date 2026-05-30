// ============================================================================
// Cliente HTTP real — Django REST Framework backend
//   Implementa los mismos métodos que mockApi.js pero conectando con el
//   backend Django. El interceptor añade Authorization: Bearer y refresca
//   tokens automáticamente cuando el access expira.
// ============================================================================

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const TOKEN_KEYS = {
  ACCESS: 'cafe_access_token',
  REFRESH: 'cafe_refresh_token',
};

export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEYS.ACCESS),
  getRefresh: () => localStorage.getItem(TOKEN_KEYS.REFRESH),
  set: ({ access, refresh }) => {
    if (access) localStorage.setItem(TOKEN_KEYS.ACCESS, access);
    if (refresh) localStorage.setItem(TOKEN_KEYS.REFRESH, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
  },
};

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Adjunta el access token a todas las peticiones
http.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el access expira (401), intenta refrescarlo automáticamente
let refreshing = null;
http.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      tokenStore.getRefresh()
    ) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${BASE_URL}/auth/refresh/`, { refresh: tokenStore.getRefresh() })
            .then((r) => {
              tokenStore.set({ access: r.data.access });
              return r.data.access;
            })
            .finally(() => { refreshing = null; });
        }
        const newAccess = await refreshing;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return http(original);
      } catch {
        tokenStore.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- AUTH --------------------------------------------------------------------
export const realAuth = {
  async loginWithGoogle(idToken, fakeProfile = null) {
    const profile = fakeProfile || { email: 'alumno@iespiobaroja.es', name: 'Alumno Demo' };
    const { data } = await http.post('/auth/google/', {
      email: profile.email,
      name: profile.name,
    });
    tokenStore.set(data);
    return data;
  },

  async loginAdmin(username, password) {
    const { data } = await http.post('/auth/staff/', { username, password });
    tokenStore.set(data);
    return data;
  },

  async me() {
    const { data } = await http.get('/auth/me/');
    return data;
  },

  async logout() {
    try {
      await http.post('/auth/logout/', { refresh: tokenStore.getRefresh() });
    } finally {
      tokenStore.clear();
    }
    return { ok: true };
  },
};

// --- PRODUCTOS ---------------------------------------------------------------
export const realProductsApi = {
  async list({ search = '', category = 'todos' } = {}) {
    const params = {};
    if (search) params.search = search;
    if (category && category !== 'todos') params.category = category;
    const { data } = await http.get('/products/', { params });
    return data;
  },

  async get(id) {
    const { data } = await http.get(`/products/${id}/`);
    return data;
  },

  async create(payload) {
    const { data } = await http.post('/products/', payload);
    return data;
  },

  async update(id, patch) {
    const { data } = await http.patch(`/products/${id}/`, patch);
    return data;
  },

  async remove(id) {
    await http.delete(`/products/${id}/`);
    return { ok: true };
  },

  async favorites() {
    const { data } = await http.get('/products/favorites/');
    return data;
  },

  async toggleFavorite(id) {
    const { data } = await http.post(`/products/${id}/favorite/`);
    return data;
  },
};

// --- PEDIDOS -----------------------------------------------------------------
export const realOrdersApi = {
  async create(payload) {
    const { data } = await http.post('/orders/', payload);
    return data;
  },

  async list({ status = null, all = false } = {}) {
    const params = {};
    if (status) params.status = status;
    if (all) params.all = true;
    const { data } = await http.get('/orders/', { params });
    return data;
  },

  async get(id) {
    const { data } = await http.get(`/orders/${id}/`);
    return data;
  },

  async updateStatus(id, status) {
    const { data } = await http.patch(`/orders/${id}/status/`, { status });
    return data;
  },

  async cancel(id) {
    const { data } = await http.post(`/orders/${id}/cancel/`);
    return data;
  },
};

// --- PAGOS -------------------------------------------------------------------
export const realPaymentsApi = {
  async initiate(orderId) {
    const { data } = await http.post('/payments/redsys/initiate/', { order_id: orderId });
    return data;
  },
};

// --- ESTADÍSTICAS ------------------------------------------------------------
export const realStatsApi = {
  async summary() {
    const { data } = await http.get('/stats/summary/');
    return data;
  },

  async sales(params = {}) {
    const { data } = await http.get('/stats/sales/', { params });
    return data;
  },

  async topProducts(params = {}) {
    const { data } = await http.get('/stats/top-products/', { params });
    return data;
  },
};
