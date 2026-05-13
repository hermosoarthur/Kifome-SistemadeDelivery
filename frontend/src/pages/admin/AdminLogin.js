import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './Admin.css';

export default function AdminLogin() {
  const { login, autenticado, verificando } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!verificando && autenticado) navigate('/admin/dashboard', { replace: true });
  }, [autenticado, verificando, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setErro(err.message || 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="admin-login-bg">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <span className="admin-logo-icon">🍔</span>
          <h1>Kifome</h1>
          <span className="admin-login-badge">ADMIN</span>
        </div>
        <h2 className="admin-login-title">Painel Administrativo</h2>
        <p className="admin-login-sub">Acesso restrito a administradores</p>

        {erro && <div className="admin-alert-error">{erro}</div>}

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@kifome.com"
            required
            autoFocus
          />
          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button type="submit" className="admin-btn-primary" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
