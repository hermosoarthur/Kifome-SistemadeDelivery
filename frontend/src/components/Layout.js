import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const NAV_CLIENTE = [
  { to: '/', label: 'Início', icon: '🏠', end: true },
  { to: '/meus-pedidos', label: 'Meus Pedidos', icon: '📦' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
];

const NAV_RESTAURANTE = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/meu-restaurante', label: 'Meu Restaurante', icon: '🍽️' },
  { to: '/produtos', label: 'Cardápio', icon: '🍕' },
  { to: '/pedidos', label: 'Pedidos', icon: '📋' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
];

const NAV_ENTREGADOR = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/disponivel', label: 'Disponíveis', icon: '🔔' },
  { to: '/minhas-entregas', label: 'Minhas Entregas', icon: '🛵' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
];

const TIPO_NAV = {
  cliente: NAV_CLIENTE,
  restaurante: NAV_RESTAURANTE,
  entregador: NAV_ENTREGADOR,
};

const TIPO_COR = {
  cliente: '#FF6B35',
  restaurante: '#6C63FF',
  entregador: '#00B894',
};

const TIPO_LABEL = {
  cliente: '🛒 Cliente',
  restaurante: '🍽️ Restaurante',
  entregador: '🛵 Entregador',
};

const TIPO_TITULO = {
  cliente: 'Peça comida, mercado e muito mais',
  restaurante: 'Gerencie sua operação em tempo real',
  entregador: 'Aceite corridas e mova a cidade',
};

export default function Layout({ children }) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);

  const tipo = usuario?.tipo || 'cliente';
  const navItems = TIPO_NAV[tipo] || NAV_CLIENTE;
  const cor = TIPO_COR[tipo];

  async function handleSair() {
    if (window.confirm('Deseja sair?')) { await sair(); navigate('/login'); }
  }

  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';
  const saudacao = tipo === 'cliente'
    ? 'Encontre restaurantes, acompanhe pedidos e mate a fome sem fricção.'
    : tipo === 'restaurante'
      ? 'Gerencie seu negócio, acompanhe pedidos e destaque seu cardápio.'
      : 'Aceite entregas, monitore corridas e mantenha seu dia produtivo.';

  return (
    <div className="layout">
      <aside className={`sidebar ${aberto ? 'open' : ''}`} style={{ '--cor-tipo': cor }}>
        <div className="sb-brand">
          <span className="sb-brand-mark">K</span>
          <div className="sb-brand-copy">
            <small>delivery app</small>
            <span className="sb-nome">Kifome</span>
          </div>
        </div>

        <div className="sb-tipo-badge">{TIPO_LABEL[tipo]}</div>

        <nav className="sb-nav">
          {navItems.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
              onClick={() => setAberto(false)}>
              <span className="sb-icon">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">{usuario?.nome?.[0]?.toUpperCase() || '?'}</div>
            <div className="sb-user-info">
              <span className="sb-user-nome">{usuario?.nome?.split(' ')[0]}</span>
              <span className="sb-user-tipo" style={{ color: cor }}>{tipo}</span>
            </div>
          </div>
          <button className="sb-sair" onClick={handleSair} title="Sair">🚪</button>
        </div>
      </aside>

      <header className="mob-header">
        <button className="mob-menu" onClick={() => setAberto(!aberto)}>☰</button>
        <span className="mob-brand" style={{ color: cor }}>Kifome</span>
        <button className="mob-menu" onClick={() => navigate('/perfil')} aria-label="Ir para perfil">👤</button>
      </header>

      {aberto && <div className="mob-overlay" onClick={() => setAberto(false)} />}
      <main className="layout-main">
        <div className="layout-topbar">
          <div className="layout-topbar-copy">
            <span className="layout-eyebrow">{TIPO_LABEL[tipo]}</span>
            <h1>{TIPO_TITULO[tipo]}</h1>
            <p>{saudacao}</p>
          </div>
          <div className="layout-topbar-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/perfil')}>Minha conta</button>
            <div className="layout-user-chip">
              <div className="avatar">{usuario?.nome?.[0]?.toUpperCase() || '?'}</div>
              <div>
                <strong style={{ display: 'block', fontSize: 13 }}>{primeiroNome}</strong>
                <span style={{ fontSize: 11, color: 'var(--texto-sec)', textTransform: 'capitalize' }}>Bem-vindo ao Kifome</span>
              </div>
            </div>
          </div>
        </div>
        <div className="layout-content">{children}</div>
      </main>
    </div>
  );
}
