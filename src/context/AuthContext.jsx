import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/auth.php?action=me')
      .then(res => { if (res.data.ok) setUser(res.data.user); })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/auth.php?action=login', { email, password });
    if (res.data.ok) setUser(res.data.user);
    return res.data;
  };
  const loginForce = async (email, password) => {
    const res = await client.post('/auth.php?action=login_force', { email, password });
    if (res.data.ok) setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await client.post('/auth.php?action=logout');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginForce, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);