# Cafetería IES Pío Baroja

Aplicación web para la cafetería del IES Pío Baroja. Los alumnos pueden consultar el catálogo, hacer pedidos y pagar con tarjeta. El personal gestiona pedidos, inventario y estadísticas.

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Django 4.2 + Django REST Framework |
| Autenticación | Google SSO (OAuth 2.0) + JWT |
| Base de datos | SQLite (desarrollo) |

## 📁 Estructura del proyecto

```
cafeteria/
├── frontend/              ← App React (Vite)
│   └── src/
│       ├── components/    ← Componentes reutilizables
│       ├── contexts/      ← Auth, Cart, Theme, Toast
│       ├── hooks/         ← useApi, useDebounce, useFavorites,
│       │                      useLocalStorage, useMediaQuery,
│       │                      useIntersectionObserver, useFlyToCart
│       ├── pages/
│       │   ├── client/    ← Login, Catálogo, Carrito, Pedidos, Perfil, QR
│       │   └── admin/     ← Dashboard, Pedidos, Menú, Estadísticas
│       └── services/      ← api.js, mockApi.js, realApi.js
└── backend/               ← API Django REST Framework
    └── api/
        ├── models.py          ← User, Product, Order, OrderItem, Favorite
        ├── views_auth.py      ← Google SSO, Staff login, JWT
        ├── views_products.py  ← CRUD productos + favoritos
        ├── views_orders.py    ← Pedidos con descuento de stock
        ├── views_payments.py  ← Pasarela Redsys simulada
        ├── views_stats.py     ← Estadísticas
        ├── serializers.py     ← Validación DRF
        └── permissions.py     ← IsStaff, IsClient
```

## 🚀 Instalación local

### Frontend

```bash
cd frontend
npm install
```

Crea un archivo `.env` en la carpeta `frontend/` con:

```env
VITE_USE_MOCKS=true
VITE_GOOGLE_CLIENT_ID=173389070517-cshco3miahc2p281a0adrb2ps0a449pj.apps.googleusercontent.com
```

Luego:

```bash
npm run dev
```

Abre: **http://localhost:5173**

### Backend Django

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

## 🔐 Credenciales

**Cliente:** cualquier cuenta de Google  
**Staff (panel admin):** usuario `admin` · contraseña `1234`

## 📡 API REST — Endpoints principales

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | /api/v1/auth/google/ | Login Google SSO | No |
| POST | /api/v1/auth/staff/ | Login staff | No |
| POST | /api/v1/auth/refresh/ | Refresca token | No |
| GET | /api/v1/auth/me/ | Usuario actual | Sí |
| GET | /api/v1/products/ | Listar productos | No |
| POST | /api/v1/products/ | Crear producto | Staff |
| PATCH | /api/v1/products/:id/ | Editar producto | Staff |
| DELETE | /api/v1/products/:id/ | Eliminar producto | Staff |
| GET | /api/v1/products/favorites/ | Favoritos | Sí |
| POST | /api/v1/products/:id/favorite/ | Toggle favorito | Sí |
| GET | /api/v1/orders/ | Listar pedidos | Sí |
| POST | /api/v1/orders/ | Crear pedido | Sí |
| GET | /api/v1/orders/:id/ | Detalle pedido | Sí |
| PATCH | /api/v1/orders/:id/status/ | Cambiar estado | Staff |
| POST | /api/v1/orders/:id/cancel/ | Cancelar pedido | Sí |
| POST | /api/v1/payments/redsys/initiate/ | Iniciar pago | Sí |
| POST | /api/v1/payments/redsys/notify/ | Webhook IPN | No |
| GET | /api/v1/stats/summary/ | Resumen del día | Staff |
| GET | /api/v1/stats/sales/ | Ventas por período | Staff |
| GET | /api/v1/stats/top-products/ | Top productos | Staff |

## ✨ Funcionalidades

### Cliente
- Login con Google SSO real (OAuth 2.0)
- Catálogo con búsqueda, filtros por categoría y favoritos
- Animación fly-to-cart al añadir productos
- Selector de hora de recogida (08:30 – 21:00)
- Notas opcionales en el pedido
- Formulario TPV estilo Redsys con validación de tarjeta
- Código QR de recogida tras el pago con confeti
- Historial de pedidos con filtros por estado
- Modo oscuro/claro
- Diseño responsive: móvil → tablet → laptop → desktop

### Panel de administración
- Gestión de pedidos (pagado → listo → entregado)
- Notas del cliente visibles al preparar
- CRUD de productos con control de stock
- Gráficas SVG de ventas y estado de pedidos
- Auto-refresh cada 15-30 segundos
- Sidebar en desktop, tabs en móvil
- Badge de pedidos pendientes

## 🏗️ Arquitectura React

- **React.lazy + Suspense** — code splitting por ruta
- **7 hooks propios** — useApi, useDebounce, useFavorites, useLocalStorage, useMediaQuery, useIntersectionObserver, useFlyToCart
- **4 contexts** — AuthContext, CartContext, ThemeContext, ToastContext
- **Optimización** — memo(), useCallback, useMemo, Intersection Observer para lazy fade-in

## 👨‍💻 Autor

Manuel Keitor Vásquez Morán · IES Pío Baroja · DAW · 2025/2026
