import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    try {
      const token = localStorage.getItem('@kifome:token');
      const raw = localStorage.getItem('@kifome:usuario');
      if (token && raw) setUsuario(JSON.parse(raw));
    } catch {
      localStorage.removeItem('@kifome:token');
      localStorage.removeItem('@kifome:usuario');
    } finally {
      setCarregando(false);
    }

    // Supabase auth state listener
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('@kifome:token');
          localStorage.removeItem('@kifome:usuario');
          setUsuario(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const salvarSessao = (token, usuario) => {
    localStorage.setItem('@kifome:token', token);
    localStorage.setItem('@kifome:usuario', JSON.stringify(usuario));
    setUsuario(usuario);
  };

  const login = useCallback(async (email, senha) => {
    const data = await authService.login(email, senha);
    salvarSessao(data.token, data.usuario);
    return data;
  }, []);

  const requestMagicLink = useCallback(async (email) => {
    return await authService.requestMagicLink(email);
  }, []);

  const verifyMagicLink = useCallback(async (token) => {
    const data = await authService.verifyMagicLink(token);
    salvarSessao(data.token, data.usuario);
    return data;
  }, []);

  const requestOtpEmail = useCallback(async (email) => {
    return await authService.requestOtpEmail(email);
  }, []);

  const verifyOtpEmail = useCallback(async (email, codigo, extras = {}) => {
    const data = await authService.verifyOtpEmail(email, codigo, extras);
    salvarSessao(data.token, data.usuario);
    return data;
  }, []);

  const requestOtpSms = useCallback(async (telefone) => {
    return await authService.requestOtpSms(telefone);
  }, []);

  const verifyOtpSms = useCallback(async (telefone, codigo, extras = {}) => {
    const data = await authService.verifyOtpSms(telefone, codigo, extras);
    salvarSessao(data.token, data.usuario);
    return data;
  }, []);

  const loginGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) throw error;
  }, []);

  const loginFacebook = useCallback(async () => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) throw error;
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    return await authService.requestPasswordReset(email);
  }, []);

  const verifyPasswordReset = useCallback(async (token, novaSenha) => {
    const data = await authService.verifyPasswordReset(token, novaSenha);
    salvarSessao(data.token, data.usuario);
    return data;
  }, []);

  const sair = useCallback(async () => {
    localStorage.removeItem('@kifome:token');
    localStorage.removeItem('@kifome:usuario');
    if (supabase) await supabase.auth.signOut().catch(() => {});
    setUsuario(null);
  }, []);

  const atualizarUsuario = useCallback((dados) => {
    const novo = { ...usuario, ...dados };
    localStorage.setItem('@kifome:usuario', JSON.stringify(novo));
    setUsuario(novo);
  }, [usuario]);

  return (
    <AuthContext.Provider value={{
      usuario, carregando, autenticado: !!usuario,
      login, loginGoogle, loginFacebook,
      requestMagicLink, verifyMagicLink,
      requestOtpEmail, verifyOtpEmail,
      requestOtpSms, verifyOtpSms,
      requestPasswordReset, verifyPasswordReset,
      sair, atualizarUsuario, salvarSessao
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}

