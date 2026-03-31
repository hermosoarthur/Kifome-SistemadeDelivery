import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import './Header.css';

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { count: cartCount, total: cartTotal } = useCart();

  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  return (
    <div className="layout-topbar">
      <div className="layout-topbar-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar} title="Menu">
          ☰
        </button>

        <div className="topbrand" onClick={() => navigate('/')} title="Kifome">Kifome</div>
        <nav className="top-links">
          <button className="top-link" onClick={() => navigate('/')}>Início</button>
        
          <button className="top-link" onClick={() => navigate('/restaurantes')}>Restaurantes</button>
          <button className="top-link" onClick={() => navigate('/mercados')}>Mercados</button>
          <button className="top-link" onClick={() => navigate('/bebidas')}>Bebidas</button>
          <button className="top-link" onClick={() => navigate('/farmacias')}>Farmácias</button>
          <button className="top-link" onClick={() => navigate('/pets')}>Pets</button>
          <button className="top-link" onClick={() => navigate('/shopping')}>Shopping</button>
        </nav>
      </div>

      <div className="layout-topbar-center">
        <div className="ifood-search-chip">
          <span className="search-icon"></span>
          <input
            className="ifood-search-input"
            placeholder="Busque por item ou loja"
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/buscar?q=${encodeURIComponent(e.target.value)}`); }}
          />
        </div>
      </div>

      <div className="layout-topbar-right">
        <div className="address">R. Cubatão, 726 ▾</div>
        <button className="icon-btn" onClick={() => navigate('/perfil')}>👤</button>
        <button className="icon-btn" onClick={() => navigate('/carrinho')}>
          🛒 {cartCount > 0 ? `${cartCount} • R$ ${cartTotal.toFixed(2)}` : <span className="cart-small">R$ 0,00</span>}
        </button>
      </div>
    </div>
  );
}