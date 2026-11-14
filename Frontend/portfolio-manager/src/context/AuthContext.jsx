import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api, { errMsg } from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const schemeFor = (token, data) => {
  if (import.meta.env.VITE_AUTH_SCHEME) return import.meta.env.VITE_AUTH_SCHEME;
  if (data.access || data.access_token) return 'Bearer';
  return String(token).split('.').length === 3 ? 'Bearer' : 'Token';
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('pf_token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pf_user'));
    } catch {
      return null;
    }
  });

  const login = useCallback(async (identifier, password) => {
    const body = { password };
    if (identifier.includes('@')) {
      body.email = identifier;
      body.username = identifier;
    } else body.username = identifier;
    const { data } = await api.post('/api/auth/login/', body);
    const t = data.token || data.access || data.key || data.access_token;
    if (!t) throw new Error('Login succeeded but the API did not return a token.');
    const u = data.user || { username: identifier };
    localStorage.setItem('pf_token', t);
    localStorage.setItem('pf_scheme', schemeFor(t, data));
    localStorage.setItem('pf_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const register = useCallback(async (f) => {
    const { data } = await api.post('/api/auth/register/', {
      name: f.name,
      first_name: f.name,
      email: f.email,
      username: f.username,
      password: f.password,
      password2: f.confirm,
      confirm_password: f.confirm,
    });
    return data;
  }, []);

  const logout = useCallback(() => {
    ['pf_token', 'pf_scheme', 'pf_user'].forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ token, user, login, register, logout, errMsg }), [token, user, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
