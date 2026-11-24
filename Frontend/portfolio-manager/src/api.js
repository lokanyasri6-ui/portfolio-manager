import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

export const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

const api = axios.create({ baseURL: BASE_URL, timeout: 20000 });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('pf_token');
  if (token) cfg.headers.Authorization = `${localStorage.getItem('pf_scheme') || 'Bearer'} ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      ['pf_token', 'pf_scheme', 'pf_user'].forEach((k) => localStorage.removeItem(k));
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/** first array found in a response (handles plain arrays and paginated {results: []}) */
export const firstArray = (d) => {
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    if (Array.isArray(d.results)) return d.results;
    const v = Object.values(d).find(Array.isArray);
    if (v) return v;
  }
  return [];
};

/** readable message from any axios error */
export const errMsg = (e) => {
  if (!e) return 'Something went wrong';
  if (e.response) {
    const d = e.response.data;
    if (typeof d === 'string') return d.length > 200 ? `Server error (${e.response.status})` : d;
    if (d && typeof d === 'object') {
      if (d.detail) return String(d.detail);
      if (d.message) return String(d.message);
      if (d.error) return String(d.error);
      const parts = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : v}`);
      if (parts.length) return parts.join(' · ');
    }
    return `Request failed (${e.response.status})`;
  }
  if (e.request) return 'Cannot reach the API at ' + BASE_URL + '. Is the backend running?';
  return e.message || 'Something went wrong';
};

/** tiny data-loading hook */
export function useLoad(fn, deps = []) {
  const [s, set] = useState({ data: null, loading: true, error: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    set((p) => ({ ...p, loading: true, error: null }));
    try {
      set({ data: await fn(), loading: false, error: null });
    } catch (e) {
      set({ data: null, loading: false, error: errMsg(e) });
    }
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { ...s, reload: run };
}

export default api;
