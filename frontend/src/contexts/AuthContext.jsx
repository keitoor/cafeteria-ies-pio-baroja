import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Recupera la sesión al cargar la app
  useEffect(() => {
    (async () => {
      try {
        const me = await api.auth.me();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loginWithGoogle = async (idToken, fakeProfile) => {
    const data = await api.auth.loginWithGoogle(idToken, fakeProfile);
    setUser(data.user);
    return data.user;
  };

  const loginAdmin = async (username, password) => {
    const data = await api.auth.loginAdmin(username, password);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGoogle, loginAdmin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
