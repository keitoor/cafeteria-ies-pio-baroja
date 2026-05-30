import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginAdmin(username, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.show('Credenciales inválidas', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login"
      style={{
        background: 'linear-gradient(160deg, #1f1f1f, #0a0a0a)',
      }}
    >
      <div className="login-header">
        <div className="login-emoji">🔒</div>
        <h1 className="login-title">Personal</h1>
        <p className="login-subtitle">Acceso del personal de cafetería</p>
      </div>

      <form className="login-card" onSubmit={submit}>
        <div className="form-field">
          <label className="form-label">Usuario</label>
          <input
            className="form-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Contraseña</label>
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ background: '#1f1f1f', marginTop: 8 }}
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar al panel'}
        </button>
        <p className="login-info">
          Demo: <strong>admin / 1234</strong>
        </p>
      </form>

      <div className="login-admin-link">
        <Link to="/login">← Volver al inicio de sesión de alumnos</Link>
      </div>
    </div>
  );
}
