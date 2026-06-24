import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);
const USER_KEY = 'showmine_user';
const TOKEN_KEY = 'showmine_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch {}
    }
    const headers = token ? { 'X-Auth-Token': token } : {};
    client.get('/auth.php?action=me', { headers })
      .then(res => {
        if (res.data.ok) {
          setUser(res.data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        } else {
          setUser(null);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch(() => { if (!cached) setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/auth.php?action=login', { email, password });
    if (res.data.ok) {
      setUser(res.data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      if (res.data.token) localStorage.setItem(TOKEN_KEY, res.data.token);
    }
    return res.data;
  };

  const loginForce = async (email, password) => {
    const res = await client.post('/auth.php?action=login_force', { email, password });
    if (res.data.ok) {
      setUser(res.data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      if (res.data.token) localStorage.setItem(TOKEN_KEY, res.data.token);
    }
    return res.data;
  };

  const logout = async () => {
    await client.post('/auth.php?action=logout').catch(() => {});
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginForce, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);