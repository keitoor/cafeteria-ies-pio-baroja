import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import MockBanner from './components/MockBanner';

// ── Lazy loading de páginas para mejor rendimiento ────────────────────────────
// Cada página se carga solo cuando el usuario la necesita,
// reduciendo el bundle inicial y mejorando el tiempo de carga.
const SplashPage       = lazy(() => import('./pages/client/SplashPage'));
const OnboardingPage   = lazy(() => import('./pages/client/OnboardingPage'));
const LoginPage        = lazy(() => import('./pages/client/LoginPage'));
const CatalogPage      = lazy(() => import('./pages/client/CatalogPage'));
const CartPage         = lazy(() => import('./pages/client/CartPage'));
const OrderQRPage      = lazy(() => import('./pages/client/OrderQRPage'));
const OrdersPage       = lazy(() => import('./pages/client/OrdersPage'));
const ProfilePage      = lazy(() => import('./pages/client/ProfilePage'));
const AdminLoginPage   = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'));

// Fallback minimalista mientras se carga una página
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>☕</div>
        <div className="loader" style={{ margin: '0 auto' }} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <MockBanner />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Pantallas públicas */}
                  <Route path="/" element={<SplashPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />

                  {/* Rutas del cliente */}
                  <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
                  <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                  <Route path="/orders/:id/qr" element={<ProtectedRoute><OrderQRPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                  {/* Rutas del staff */}
                  <Route path="/admin" element={<ProtectedRoute requireRole="staff"><AdminDashboard /></ProtectedRoute>} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
