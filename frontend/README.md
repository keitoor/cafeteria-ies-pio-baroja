# API Cafetería

Aplicación web para pedir en la cafetería del IES Pío Baroja sin tener que hacer
cola durante el recreo. El alumno hace el pedido y paga desde su móvil, y luego
recoge el pedido enseñando un código QR en el mostrador.

Este repositorio contiene los dos lados del proyecto:

- `/` — frontend en **React 18 + Vite**, desplegado en Vercel.
- `/backend` — backend en **Node.js + Express + SQLite**, desplegado en Render.

El backend implementa los endpoints definidos en el PDF de diseño de la API REST
de la práctica anterior. Pensamos hacerlo en Django (como pedía el enunciado
original), pero al final lo simplificamos a Node con SQLite para poder
terminarlo dentro del plazo manteniendo la misma estructura de endpoints.

Práctica del módulo Desarrollo Web en Entorno Servidor (0613).
Autores: Keitor y Mohamed Elfawal.


## Demo en vivo

- Frontend: https://api-cafeteria-two.vercel.app
- Backend: https://api-cafeteria-backend.onrender.com

> El backend está en el plan gratis de Render, así que se duerme tras 15
> minutos sin tráfico. La primera petición tras un rato dormido tarda unos 30
> segundos en responder, las siguientes ya van rápidas.


## Cómo ejecutarlo en local

Hace falta Node 18 o superior.

### Frontend

```
npm install
npm run dev
```

Se abre en http://localhost:5173. Por defecto arranca en modo demo (mocks en
`localStorage`), así que se puede probar sin tener el backend levantado.

### Backend

```
cd backend
npm install
npm start
```

Levanta en http://localhost:3001 y crea automáticamente el archivo `data.db`
con las tablas y los productos iniciales la primera vez.

Para conectar el frontend al backend local, cambia `.env`:

```
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

Y reinicia el servidor de Vite.


## Cómo se entra

Como alumno: pulsar "Continuar con Google" en la pantalla de login. En la demo
no se conecta de verdad con Google, simplemente envía un perfil de prueba al
backend.

Como personal de cafetería: enlace pequeño debajo del login que pone "Acceso
del personal". Credenciales de prueba: `admin` / `1234`.


## Variables de entorno

### Frontend (`.env`)

- `VITE_API_BASE_URL` — URL del backend (sin barra final).
- `VITE_USE_MOCKS` — `true` para datos mock en `localStorage`, `false` para
  hablar con el backend.
- `VITE_GOOGLE_CLIENT_ID` — Client ID de Google Identity Services. Si se deja
  vacío se usa login simulado.

### Backend (`backend/.env`)

- `PORT` — puerto donde escucha (3001 por defecto).
- `JWT_SECRET` — clave para firmar los tokens.
- `CORS_ORIGINS` — lista de orígenes permitidos, separados por coma.


## Estructura del proyecto

```
api-cafeteria/
├── index.html             Entry point del frontend
├── package.json           Dependencias del frontend
├── vite.config.js
├── src/
│   ├── App.jsx            Rutas principales (React Router)
│   ├── main.jsx
│   ├── components/        Componentes compartidos
│   ├── contexts/          Estado global (auth, carrito, tema, toasts)
│   ├── hooks/             Custom hooks
│   ├── pages/
│   │   ├── client/        Pantallas del alumno
│   │   └── admin/         Panel del personal
│   ├── services/
│   │   ├── api.js         Decide si usar mocks o backend real
│   │   ├── mockApi.js     Implementación con localStorage
│   │   └── realApi.js     Cliente axios contra el backend
│   └── styles/global.css
│
└── backend/
    ├── package.json
    ├── src/
    │   ├── server.js          Servidor Express
    │   ├── db.js              SQLite, esquema y seed
    │   ├── auth.js            JWT y middlewares
    │   ├── routes.auth.js     /auth
    │   ├── routes.products.js /products
    │   ├── routes.orders.js   /orders
    │   └── routes.others.js   /payments, /stats
    └── README.md              Más detalles del backend
```


## Qué hace la app

Del lado del alumno:

- Splash y un breve onboarding la primera vez que se abre.
- Login (real con Google si está configurado, o simulado para la demo).
- Catálogo con buscador, filtros por categoría y posibilidad de marcar
  favoritos. Al añadir productos al carrito el emoji vuela hacia el icono del
  carrito.
- Banner con cuenta atrás hasta el próximo recreo.
- Carrito con elección de la franja horaria de recogida.
- Pago a través de Redsys (en esta versión simulamos el TPV; hay un 10% de
  probabilidad de que falle para poder probar también ese flujo).
- Pantalla final con código QR y código alfanumérico de recogida, más cuenta
  atrás hasta la hora elegida.
- Historial de pedidos.
- Perfil con modo oscuro y cierre de sesión.

Del lado del personal de la cafetería:

- Login propio con usuario y contraseña (hash bcrypt en la base de datos).
- Lista de pedidos filtrable por estado que se refresca sola cada pocos
  segundos. Desde ahí se marca un pedido como "listo" o "entregado".
- Gestión del menú: añadir, editar y eliminar productos (CRUD completo).
- Estadísticas con los KPIs del día, gráfico de ventas de los últimos días y
  ranking de productos más vendidos.


## Decisiones técnicas

### Frontend

React 18 con Vite. Router con React Router 6. Estado global con Context API
(sin Redux, porque para este tamaño no compensa). Llamadas HTTP con axios.
Generación de QR con la librería qrcode.

Hemos extraído custom hooks para no repetir lógica entre páginas: `useApi`
para llamadas con loading/error, `useDebounce` para el buscador, `useCountdown`
para las cuentas atrás, `useFavorites` para marcar productos favoritos y
`useFlyToCart` para la animación al añadir al carrito.

Los componentes que se renderizan en lista (tarjetas de producto, de pedido,
etc.) están envueltos en `React.memo` para que no se vuelvan a renderizar
cuando no toca.

La capa de servicios tiene dos implementaciones que cumplen la misma
interfaz: una con datos mock en `localStorage` y otra con axios contra el
backend. Se elige una u otra con una variable de entorno
(`VITE_USE_MOCKS`). Esto nos permitió desarrollar el frontend en paralelo
con el backend.

### Backend

Express + SQLite con `better-sqlite3`. Tablas para `users`, `products`,
`favorites`, `orders` y `order_items`. La base de datos se crea
automáticamente la primera vez que arranca, y siembra los productos iniciales
y el usuario admin.

Autenticación con JWT: access token de 15 min y refresh token de 7 días,
firmados con HS256. Las contraseñas del personal se guardan hasheadas con
bcrypt.

CORS configurado para aceptar la URL del frontend en Vercel y cualquier
preview generada por Vercel (subdominios `*.vercel.app`).

El endpoint de Redsys está simulado: respeta el contrato del PDF de diseño
(mismo input/output) pero no se conecta con el TPV real, ya que no
disponemos de credenciales del banco.


## Despliegue

El frontend está en Vercel y se redespliega automáticamente con cada push a
`main`. El backend está en Render (plan gratis) y también redespliega solo,
con la salvedad de que su carpeta raíz dentro del repo es `/backend`.


## Comandos

Frontend:

```
npm run dev      Servidor de desarrollo
npm run build    Build de producción en /dist
npm run preview  Sirve el build localmente
```

Backend:

```
npm start        Arranca el servidor en el puerto configurado
npm run dev      Igual pero con auto-recarga al editar archivos
```


## Notas

Si se ha probado la app en modo demo y se quiere empezar de cero, basta con
abrir DevTools del navegador y borrar el `localStorage` del sitio.

El pago en modo demo es totalmente simulado: no se conecta con Redsys de
verdad. En producción el flujo correcto sería que el frontend mande los datos
firmados al TPV de Redsys y que el backend reciba la notificación asíncrona
en `/payments/redsys/notify/`.

El código de recogida lo genera el backend cuando el pago se confirma, y se
guarda en la tabla `orders`.
