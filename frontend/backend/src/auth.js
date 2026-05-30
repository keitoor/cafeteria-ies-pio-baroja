// ============================================================================
// Autenticación con JWT
// ============================================================================

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

export function signTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const access = jwt.sign(payload, SECRET, { expiresIn: ACCESS_EXPIRY });
  const refresh = jwt.sign({ id: user.id, type: 'refresh' }, SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });
  return { access, refresh };
}

export function verifyAccess(token) {
  return jwt.verify(token, SECRET);
}

export function verifyRefresh(token) {
  const decoded = jwt.verify(token, SECRET);
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return decoded;
}

/**
 * Middleware que comprueba que la petición lleva un Bearer token válido.
 * Si requireRole se especifica, además exige que el usuario tenga ese rol.
 */
export function authRequired(requireRole = null) {
  return (req, res, next) => {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json(apiError('NOT_AUTHENTICATED',
        'Se requiere autenticación para acceder a este recurso.'));
    }
    const token = auth.slice(7);
    try {
      const decoded = verifyAccess(token);
      req.user = decoded;
      if (requireRole && decoded.role !== requireRole) {
        return res.status(403).json(apiError('FORBIDDEN',
          'No tienes permisos para realizar esta acción.'));
      }
      next();
    } catch (err) {
      const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_CREDENTIALS';
      const msg = err.name === 'TokenExpiredError'
        ? 'Tu sesión ha caducado. Vuelve a iniciar sesión.'
        : 'El token no es válido.';
      return res.status(401).json(apiError(code, msg));
    }
  };
}

/**
 * Genera la estructura estándar de error según el PDF de diseño.
 */
export function apiError(code, message, details = null) {
  return { error: { code, message, details } };
}
