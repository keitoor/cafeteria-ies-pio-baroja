
# ☕ Cafetería IES Pío Baroja

Aplicación web fullstack para la gestión de pedidos de la cafetería del IES Pío Baroja. Desarrollada como proyecto final del módulo **Desarrollo Web en Entorno Servidor (0613)** del ciclo **DAW 2025/2026**.

**Autores:** Mohamed Fawal · Manuel Keitor Vásquez Morán  
**Grupo:** H · IES Pío Baroja · Madrid  

---

## 🔗 Enlaces del proyecto

| | URL |
|---|---|
| 🌐 **Frontend (producción)** | https://api-cafeteria-two.vercel.app |
| ⚙️ **Backend API (producción)** | https://cafeteria-ies-pio-baroja.onrender.com |
| 📁 **Repositorio GitHub** | https://github.com/keitoor/cafeteria-ies-pio-baroja |

---

## 📋 Descripción

La aplicación permite a los alumnos del instituto consultar el catálogo de la cafetería, hacer pedidos y pagar con tarjeta bancaria desde su móvil u ordenador. El personal de la cafetería dispone de un panel de administración para gestionar los pedidos en tiempo real, controlar el inventario y consultar estadísticas de ventas.

### Funcionalidades principales

**Para el cliente:**
- Inicio de sesión con Google SSO (OAuth 2.0) — cualquier cuenta de Google
- Catálogo de productos con búsqueda, filtros por categoría y favoritos
- Carrito de la compra con animación visual al añadir productos
- Selector de hora de recogida (horario 08:30 – 21:00)
- Notas opcionales en el pedido (ej: "sin cebolla")
- Formulario de pago TPV estilo Redsys con validación de tarjeta
- Código QR único de recogida tras confirmar el pago
- Historial de pedidos con filtros por estado
- Modo oscuro / claro
- Diseño responsive: móvil, tablet, laptop y desktop

**Para el personal (panel admin):**
- Gestión de pedidos en tiempo real con cambio de estado (pagado → listo → entregado)
- Notas del cliente visibles al preparar cada pedido
- CRUD completo de productos con control de stock
- Gráficas SVG de ventas y estadísticas
- Auto-refresh cada 15-30 segundos
- Sidebar en desktop, navegación por tabs en móvil
- Badge de pedidos pendientes en tiempo real

---

## 🛠️ Tecnologías utilizadas

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | React + Vite | 18 / 5 |
| Backend | Django + Django REST Framework | 4.2 / 3.15 |
| Autenticación | Google OAuth 2.0 + JWT (SimpleJWT) | — |
| Base de datos | SQLite (desarrollo) | — |
| Despliegue frontend | Vercel | — |
| Despliegue backend | Render | — |

---

## 📁 Estructura del proyecto

```
cafeteria-ies-pio-baroja/
├── frontend/                      ← App React (Vite)
│   ├── src/
│   │   ├── components/            ← Componentes reutilizables
│   │   │   ├── TopBar.jsx         ← Barra superior con menú desplegable
│   │   │   ├── BottomNav.jsx      ← Navegación inferior móvil
│   │   │   ├── ProductCard.jsx    ← Tarjeta de producto con fade-in
│   │   │   ├── PaymentOverlay.jsx ← TPV con formulario de tarjeta
│   │   │   ├── RecreoBanner.jsx   ← Banner horario en tiempo real
│   │   │   ├── MockBanner.jsx     ← Aviso modo demo
│   │   │   ├── CategoryFilter.jsx ← Filtros de categoría
│   │   │   ├── SearchBar.jsx      ← Barra de búsqueda
│   │   │   └── UIStates.jsx       ← EmptyState, LoadingState, StatusPill
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx    ← Autenticación global
│   │   │   ├── CartContext.jsx    ← Carrito global
│   │   │   ├── ThemeContext.jsx   ← Modo oscuro/claro
│   │   │   └── ToastContext.jsx   ← Notificaciones
│   │   ├── hooks/
│   │   │   ├── useApi.js          ← Peticiones API (race-condition safe)
│   │   │   ├── useDebounce.js     ← Debounce para búsqueda
│   │   │   ├── useFavorites.js    ← Favoritos con optimistic updates
│   │   │   ├── useLocalStorage.js ← Sincronización con localStorage
│   │   │   ├── useMediaQuery.js   ← Detección de tamaño de pantalla
│   │   │   ├── useIntersectionObserver.js ← Lazy rendering con fade-in
│   │   │   └── useFlyToCart.js    ← Animación fly-to-cart
│   │   ├── pages/
│   │   │   ├── client/
│   │   │   │   ├── SplashPage.jsx
│   │   │   │   ├── OnboardingPage.jsx
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── CatalogPage.jsx
│   │   │   │   ├── CartPage.jsx
│   │   │   │   ├── OrdersPage.jsx
│   │   │   │   ├── OrderQRPage.jsx
│   │   │   │   └── ProfilePage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminLoginPage.jsx
│   │   │       ├── AdminOrders.jsx
│   │   │       ├── AdminMenu.jsx
│   │   │       └── AdminStats.jsx
│   │   ├── services/
│   │   │   ├── api.js             ← Selector mock/real según .env
│   │   │   ├── mockApi.js         ← API simulada (localStorage)
│   │   │   ├── realApi.js         ← Cliente HTTP para Django
│   │   │   └── mockData.js        ← Datos y categorías de ejemplo
│   │   ├── styles/
│   │   │   └── global.css         ← Estilos globales mobile-first
│   │   ├── App.jsx                ← Rutas con React.lazy + Suspense
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
└── backend/                       ← API Django REST Framework
    ├── api/
    │   ├── models.py              ← User, Product, Order, OrderItem, Favorite
    │   ├── serializers.py         ← Validación con DRF
    │   ├── permissions.py         ← IsStaff, IsClient
    │   ├── urls.py                ← Rutas de la API
    │   ├── views_auth.py          ← Google SSO, Staff login, JWT
    │   ├── views_products.py      ← CRUD productos + favoritos
    │   ├── views_orders.py        ← Pedidos con descuento de stock
    │   ├── views_payments.py      ← Pasarela Redsys simulada
    │   ├── views_stats.py         ← Estadísticas y gráficas
    │   └── management/commands/
    │       └── seed_data.py       ← Datos iniciales
    ├── cafeteria_backend/
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    ├── requirements.txt
    ├── build.sh                   ← Script de despliegue en Render
    └── Procfile
```

---

## 🚀 Instalación y ejecución local

### Requisitos previos
- Node.js 18+
- Python 3.10+
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/keitoor/cafeteria-ies-pio-baroja.git
cd cafeteria-ies-pio-baroja
```

### 2. Frontend (React)

```bash
cd frontend
npm install
```

Crea un archivo `.env` en la carpeta `frontend/` con el siguiente contenido:

```env
# Backend Django en producción
VITE_API_BASE_URL=https://cafeteria-ies-pio-baroja.onrender.com/api/v1

# Cambiar a true para usar datos locales sin backend
VITE_USE_MOCKS=false

# Client ID de Google (ya configurado)
VITE_GOOGLE_CLIENT_ID=173389070517-cshco3miahc2p281a0adrb2ps0a449pj.apps.googleusercontent.com
```

```bash
npm run dev
```

Abre el navegador en: **http://localhost:5173**

### 3. Backend Django (opcional — ya está desplegado en Render)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data    # Crea productos y usuario staff
python manage.py runserver
```

Si ejecutas el backend en local, cambia en el `.env` del frontend:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 🔐 Credenciales de acceso

| Rol | Acceso |
|---|---|
| **Cliente** | Cualquier cuenta de Google — botón "Continuar con Google" |
| **Staff (admin)** | Ir a `/admin/login` · Usuario: `admin` · Contraseña: `1234` |

---

## 📡 API REST — Endpoints

| Método | Ruta | Descripción | Auth requerida |
|--------|------|-------------|---------------|
| POST | `/api/v1/auth/google/` | Login con Google SSO | No |
| POST | `/api/v1/auth/staff/` | Login staff (usuario/contraseña) | No |
| POST | `/api/v1/auth/refresh/` | Refresca el access token | No |
| POST | `/api/v1/auth/logout/` | Cierra sesión | No |
| GET | `/api/v1/auth/me/` | Datos del usuario autenticado | Sí |
| GET | `/api/v1/products/` | Listar productos (con filtros) | No |
| POST | `/api/v1/products/` | Crear producto | Staff |
| GET | `/api/v1/products/:id/` | Detalle de producto | No |
| PATCH | `/api/v1/products/:id/` | Editar producto | Staff |
| DELETE | `/api/v1/products/:id/` | Eliminar producto | Staff |
| GET | `/api/v1/products/favorites/` | Favoritos del usuario | Sí |
| POST | `/api/v1/products/:id/favorite/` | Añadir/quitar favorito | Sí |
| GET | `/api/v1/orders/` | Listar pedidos del usuario | Sí |
| POST | `/api/v1/orders/` | Crear pedido (descuenta stock) | Sí |
| GET | `/api/v1/orders/:id/` | Detalle de pedido | Sí |
| PATCH | `/api/v1/orders/:id/status/` | Cambiar estado del pedido | Staff |
| POST | `/api/v1/orders/:id/cancel/` | Cancelar pedido (restaura stock) | Sí |
| POST | `/api/v1/payments/redsys/initiate/` | Iniciar pago con tarjeta | Sí |
| POST | `/api/v1/payments/redsys/notify/` | Webhook IPN de confirmación | No |
| GET | `/api/v1/stats/summary/` | Resumen del día | Staff |
| GET | `/api/v1/stats/sales/` | Ventas por período | Staff |
| GET | `/api/v1/stats/top-products/` | Productos más vendidos | Staff |

---

## 🏗️ Decisiones técnicas destacadas

### Frontend
- **React.lazy + Suspense** — code splitting por ruta para reducir el bundle inicial
- **7 hooks propios** — `useApi` (race-condition safe), `useDebounce`, `useFavorites` (optimistic updates), `useLocalStorage`, `useMediaQuery`, `useIntersectionObserver`, `useFlyToCart`
- **4 contexts** — `AuthContext`, `CartContext`, `ThemeContext`, `ToastContext`
- **Optimización de renders** — `memo()`, `useCallback`, `useMemo` en componentes críticos
- **Intersection Observer** — lazy fade-in de productos al hacer scroll
- **Responsive mobile-first** — CSS con variables, grid adaptativo (1→2→3→4→5 columnas)
- **Admin con sidebar** en desktop (≥900px) usando `useMediaQuery`

### Backend
- **Django REST Framework** con autenticación JWT (SimpleJWT)
- **Google OAuth 2.0** — el frontend decodifica el JWT de Google y lo envía al backend
- **Transacciones atómicas** — el stock se descuenta/restaura de forma segura al crear/cancelar pedidos
- **Permisos por rol** — `IsStaff` para rutas de administración, `IsAuthenticated` para clientes
- **CORS** configurado para permitir peticiones desde cualquier origen en desarrollo

---

## 🌐 Despliegue

### Frontend — Vercel
El frontend está desplegado en Vercel con despliegue automático desde la rama `main` de GitHub.

### Backend — Render
El backend Django está desplegado en Render (plan gratuito). El script `build.sh` ejecuta automáticamente las migraciones y crea los datos iniciales en cada despliegue.

> ⚠️ El plan gratuito de Render suspende el servicio tras 15 minutos de inactividad. La primera petición puede tardar hasta 50 segundos en despertar el servidor.

---

## 👨‍💻 Autores

| Nombre | GitHub |
|---|---|
| Mohamed Fawal | [@fawalll](https://github.com/fawalll) |
| Manuel Keitor Vásquez Morán | [@keitoor](https://github.com/keitoor) |

**IES Pío Baroja · Desarrollo de Aplicaciones Web (DAW) · Curso 2025/2026**
