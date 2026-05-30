// ============================================================================
// Rutas de autenticación
//   /auth/google/  - login simplificado (acepta email/name del cliente porque
//                    no integramos Google SSO real en este entorno)
//   /auth/staff/   - login con email + password (para el panel del personal)
//   /auth/refresh/ - renueva el access token usando el refresh token
//   /auth/me/      - devuelve datos del usuario autenticado
//   /auth/logout/  - cierra sesión (cliente debe borrar tokens)
// ============================================================================

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from './db.js';
import { signTokens, verifyRefresh, authRequired, apiError } from './auth.js';

const router = Router();

// POST /auth/google/
// En un entorno real verificaríamos el id_token contra Google.
// Para esta práctica aceptamos que el frontend mande email y nombre.
router.post('/google', (req, res) => {
  const { email, name } = req.body || {};
  if (!email || !name) {
    return res.status(422).json(apiError('VALIDATION_ERROR',
      'Faltan los campos email y name.'));
  }

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    const result = db.prepare(`
      INSERT INTO users (email, name, role) VALUES (?, ?, 'client')
    `).run(email, name);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  const tokens = signTokens(user);
  res.json({
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
    },
  });
});

// POST /auth/staff/
router.post('/staff', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(422).json(apiError('VALIDATION_ERROR',
      'Faltan usuario o contraseña.'));
  }
  // El "username" del frontend es "admin" pero internamente lo tratamos como
  // email institucional para simplificar
  const email = username.includes('@') ? username : `${username}@iespiobaroja.es`;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, 'staff');
  if (!user || !user.password_hash) {
    return res.status(401).json(apiError('INVALID_CREDENTIALS',
      'Usuario o contraseña incorrectos.'));
  }
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json(apiError('INVALID_CREDENTIALS',
      'Usuario o contraseña incorrectos.'));
  }
  const tokens = signTokens(user);
  res.json({
    ...tokens,
    user: {
      id: user.id, email: user.email, name: user.name,
      picture: user.picture, role: user.role,
    },
  });
});

// POST /auth/refresh/
router.post('/refresh', (req, res) => {
  const { refresh } = req.body || {};
  if (!refresh) {
    return res.status(422).json(apiError('VALIDATION_ERROR',
      'Falta el refresh token.'));
  }
  try {
    const decoded = verifyRefresh(refresh);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json(apiError('NOT_AUTHENTICATED',
        'Usuario no encontrado.'));
    }
    const tokens = signTokens(user);
    res.json({ access: tokens.access });
  } catch {
    return res.status(401).json(apiError('TOKEN_EXPIRED',
      'El refresh token ha expirado o no es válido.'));
  }
});

// POST /auth/logout/  - en esta implementación simplificada el logout es
// responsabilidad del cliente (borrar los tokens). El backend podría mantener
// una blacklist en producción.
router.post('/logout', (_req, res) => {
  res.status(204).end();
});

// GET /auth/me/
router.get('/me', authRequired(), (req, res) => {
  const user = db.prepare('SELECT id, email, name, picture, role, created_at FROM users WHERE id = ?')
                 .get(req.user.id);
  if (!user) {
    return res.status(404).json(apiError('NOT_FOUND', 'Usuario no encontrado.'));
  }
  res.json(user);
});

export default router;
