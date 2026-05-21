import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const STORAGE_KEY = 'kifome_admin_token';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  const verificar = useCallback(async (tk) => {
    if (!tk) { setAutenticado(false); setVerificando(false); return; }
    try {
      const res = await fetch(`${BASE}/api/admin/verificar`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      setAutenticado(res.ok);
    } catch {
      setAutenticado(false);
    } finally {
      setVerificando(false);
    }
  }, []);

  useEffect(() => { verificar(token); }, [token, verificar]);

  const login = async (email, senha) => {
    const res = await fetch(`${BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Credenciais invalidas');
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setAutenticado(true);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setAutenticado(false);
  };

  const authFetch = useCallback((url, opts = {}) => {
    return fetch(`${BASE}${url}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    });
  }, [token]);

  return (
    <AdminAuthContext.Provider value={{ autenticado, verificando, login, logout, authFetch, token }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
