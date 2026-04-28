import React, { useState, useEffect } from 'react'; // Adicionado useEffect
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';
import Header from './Header';

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

const TIPO_NAV = { restaurante: NAV_RESTAURANTE, entregador: NAV_ENTREGADOR };
const TIPO_COR = { restaurante: '#6C63FF', entregador: '#00B894', cliente: '#ea1d2c' };

const TIPO_LABEL = {
  restaurante: '🍽️ Restaurante',
  entregador: '🛵 Entregador',
  cliente: '😋 Cliente' // Adicionado para não ficar vazio
};

export default function Layout({ children }) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const tipo = usuario?.tipo || 'cliente';
  const navItems = TIPO_NAV[tipo] || NAV_CLIENTE;
  const cor = TIPO_COR[tipo];

  // Monitora redimensionamento da tela
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setAberto(true); // Garante que a barra abre ao voltar pro desktop
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function handleSair() {
    if (window.confirm('Deseja sair?')) { await sair(); navigate('/login'); }
  }

  return (
    <div className={`layout ${!aberto ? 'sidebar-closed' : ''}`}>
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
            <NavLink 
              key={n.to} 
              to={n.to} 
              end={n.end}
              className={({ isActive }) => `sb-link ${isActive ? 'active' : ''}`}
              onClick={() => { if(isMobile) setAberto(false) }}
            >
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
          <button className="sb-sair" onClick={handleSair} title="Sair">✕</button>
        </div>
      </aside>

      <header className="mob-header">
        <button className="mob-menu" onClick={() => setAberto(!aberto)}>☰</button>
        <span className="mob-brand" style={{ color: cor }}>Kifome</span>
        <button className="mob-menu" onClick={() => navigate('/perfil')}>👤</button>
      </header>

      {/* Overlay corrigido com isMobile */}
      {aberto && isMobile && (
        <div className="mob-overlay" onClick={() => setAberto(false)} />
      )}

      <main className="layout-main">
        {tipo === 'cliente' && <Header onToggleSidebar={() => setAberto(!aberto)} />}
        <div className="layout-content">{children}</div>
      </main>
    </div>
  );
}