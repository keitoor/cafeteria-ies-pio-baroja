import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { isMockMode } from '../../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '173389070517-cshco3miahc2p281a0adrb2ps0a449pj.apps.googleusercontent.com';

function decodeGoogleJWT(token) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch { return null; }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const googleBtnRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const initGoogle = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline', size: 'large',
          width: Math.min(320, window.innerWidth - 64),
          text: 'continue_with',
        });
        window.google.accounts.id.prompt();
      }
    };
    if (window.google) { initGoogle(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true; script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    try {
      const payload = decodeGoogleJWT(response.credential);
      const profile = payload ? { email: payload.email, name: payload.name, picture: payload.picture } : null;
      await loginWithGoogle(response.credential, profile);
      navigate('/catalog', { replace: true });
    } catch {
      toast.show('Error al iniciar sesión con Google', 'error');
    } finally { setLoading(false); }
  };

  const handleManualLogin = async () => {
    if (!manualName.trim() || !manualEmail.trim()) {
      toast.show('Introduce tu nombre y email', 'error'); return;
    }
    if (!manualEmail.includes('@')) {
      toast.show('Email no válido', 'error'); return;
    }
    setLoading(true);
    try {
      await loginWithGoogle('mock-token', { email: manualEmail, name: manualName, picture: null });
      navigate('/catalog', { replace: true });
    } catch { toast.show('Error al iniciar sesión', 'error'); }
    finally { setLoading(false); }
  };

  const handleSimulatedLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle('mock-token', { email: 'demo@gmail.com', name: 'Usuario Demo', picture: null, role: 'client' });
      navigate('/catalog', { replace: true });
    } catch { toast.show('Error', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="login">
      <div className="login-header">
        <div className="login-emoji">☕</div>
        <h1 className="login-title">Cafetería</h1>
        <p className="login-subtitle">IES Pío Baroja</p>
      </div>

      <div className="login-card">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Bienvenido</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          Inicia sesión con tu cuenta de Google
        </p>

        {/* Botón Google real */}
        {GOOGLE_CLIENT_ID && (
          <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }} />
        )}

        {/* Botón demo (sin Google Client ID) */}
        {!GOOGLE_CLIENT_ID && !showManual && (
          <button className="btn btn-google" onClick={handleSimulatedLogin} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8, flexShrink: 0 }}>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            {loading ? 'Iniciando...' : 'Continuar con Google'}
          </button>
        )}

        {/* Formulario manual (modo demo) */}
        {!GOOGLE_CLIENT_ID && showManual && (
          <div>
            <div className="form-field">
              <label className="form-label">Tu nombre</label>
              <input className="form-input" placeholder="Ej: Manuel García" value={manualName}
                onChange={e => setManualName(e.target.value)} autoFocus />
            </div>
            <div className="form-field">
              <label className="form-label">Tu email</label>
              <input className="form-input" placeholder="correo@gmail.com" type="email"
                value={manualEmail} onChange={e => setManualEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleManualLogin} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowManual(false)} style={{ marginTop: 8 }}>
              Cancelar
            </button>
          </div>
        )}

        <div className="login-divider"><span>o</span></div>

        {/* Opción manual */}
        {!GOOGLE_CLIENT_ID && !showManual && (
          <button className="btn btn-secondary" onClick={() => setShowManual(true)} style={{ fontSize: 14 }}>
            ✏️ Entrar con nombre y email
          </button>
        )}

        <p className="login-info" style={{ marginTop: 16 }}>
          Accede con cualquier cuenta de Google.
          {isMockMode && <><br /><span style={{ color: 'var(--orange)', fontWeight: 600 }}>· Modo demo ·</span></>}
        </p>
      </div>

      <div className="login-admin-link">
        <Link to="/admin/login">🔐 Acceso del personal</Link>
      </div>
    </div>
  );
}
