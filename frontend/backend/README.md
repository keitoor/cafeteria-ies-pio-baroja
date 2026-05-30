# Backend de API Cafetería

Backend en Node.js + Express + SQLite para la app de pedidos de la cafetería
del IES Pío Baroja. Implementa los endpoints documentados en el PDF de diseño
de la API REST que entregamos en la práctica anterior.

Está pensado como alternativa más sencilla a Django para esta práctica: usa
SQLite como base de datos (un único archivo, sin servidor aparte), Express
para enrutar y JWT para autenticación.


## Cómo arrancar localmente

Requiere Node 18 o superior.

```
npm install
npm start
```

Se levanta en http://localhost:3001. La primera vez crea automáticamente el
archivo `data.db` con las tablas y siembra los productos iniciales y un
usuario admin (`admin@iespiobaroja.es` / `1234`).


## Variables de entorno

Hay un `.env.example`. Si quieres cambiar algo, cópialo a `.env`:

- `PORT` — puerto donde escucha (3001 por defecto).
- `JWT_SECRET` — clave para firmar los tokens. En producción usa algo largo y
  aleatorio.
- `CORS_ORIGINS` — lista separada por comas de los orígenes permitidos
  (típicamente la URL del frontend en Vercel y `http://localhost:5173`).


## Endpoints

Siguen lo documentado en el PDF de diseño:

- `POST /api/v1/auth/google/` — login simplificado (acepta email y name).
- `POST /api/v1/auth/staff/` — login del personal con email y password.
- `POST /api/v1/auth/refresh/` — renovar access token.
- `GET  /api/v1/auth/me/` — datos del usuario autenticado.
- `POST /api/v1/auth/logout/`
- `GET  /api/v1/products/` — catálogo con búsqueda y filtro.
- `GET  /api/v1/products/:id/`
- `POST /api/v1/products/` (staff)
- `PATCH /api/v1/products/:id/` (staff)
- `DELETE /api/v1/products/:id/` (staff)
- `GET  /api/v1/products/favorites/`
- `POST /api/v1/products/:id/favorite/`
- `POST /api/v1/orders/` — crear pedido.
- `GET  /api/v1/orders/` — historial del cliente (o todos si es staff con `?all=true`).
- `GET  /api/v1/orders/:id/`
- `PATCH /api/v1/orders/:id/status/` (staff)
- `POST /api/v1/orders/:id/cancel/`
- `POST /api/v1/payments/redsys/initiate/` — pago simulado, 10% de fallos.
- `GET  /api/v1/stats/summary/` (staff)
- `GET  /api/v1/stats/sales/` (staff)
- `GET  /api/v1/stats/top-products/` (staff)


## Despliegue en Render

Este backend está pensado para desplegarse en Render.com (plan gratuito).
Los pasos están en el README del repo principal.


## Decisiones técnicas

- **SQLite** en lugar de PostgreSQL/MySQL porque para una app de este tamaño
  sobra y permite que el backend sea autocontenido. Para producción real se
  cambiaría a Postgres añadiendo una capa de cliente (`pg`) sin reescribir
  lógica.
- **JWT** con access (15 min) y refresh (7 días) tokens, como define el PDF.
- **CORS** configurado para aceptar la URL exacta del frontend y cualquier
  preview de Vercel (`*.vercel.app`).
- **bcrypt** para hashear las contraseñas del personal.
- **Pago simulado**: no integramos Redsys real, pero respetamos el contrato
  del PDF (mismo input/output). Devuelve un 10% de fallos para poder probar
  el flujo de error.
- Códigos de recogida alfanuméricos de 4 caracteres, evitando letras y
  números fáciles de confundir (0/O, 1/I).
