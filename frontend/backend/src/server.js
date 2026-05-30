// ============================================================================
// API Cafetería - Servidor principal
//   Backend Express con SQLite implementando los endpoints del PDF de
//   diseño de la API REST.
// ============================================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import './db.js'; // inicializa la base de datos
import authRouter from './routes.auth.js';
import productsRouter from './routes.products.js';
import ordersRouter from './routes.orders.js';
import { paymentsRouter, statsRouter } from './routes.others.js';
import { apiError } from './auth.js';

const app = express();

// --- Middlewares ----------------------------------------------------------

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin Origin (curl, healthchecks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Permitir cualquier subdominio de vercel.app (para previews)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(new Error('Origen no permitido por CORS: ' + origin));
  },
  credentials: false,
}));

app.use(express.json({ limit: '1mb' }));

// Log básico de peticiones para diagnóstico
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// --- Rutas ----------------------------------------------------------------

// Health check (útil para Render)
app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'API Cafetería', version: '1.0.0' });
});
app.get('/api/v1', (_req, res) => {
  res.json({ ok: true, endpoints: ['/auth', '/products', '/orders', '/payments', '/stats'] });
});

app.use('/api/v1/auth',     authRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/orders',   ordersRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/stats',    statsRouter);

// 404
app.use((_req, res) => {
  res.status(404).json(apiError('NOT_FOUND', 'Endpoint no encontrado.'));
});

// Manejador de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json(apiError('INTERNAL_ERROR',
    'Se ha producido un error interno. Inténtalo más tarde.'));
});

// --- Arranque -------------------------------------------------------------

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`API Cafetería escuchando en http://localhost:${PORT}`);
  console.log(`Orígenes CORS permitidos: ${allowedOrigins.join(', ')}`);
});
