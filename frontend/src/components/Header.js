import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { count: cartCount, total: cartTotal } = useCart();

  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  return (
    <div className="layout-topbar">
      <div className="layout-topbar-left">
        <div className="topbrand" onClick={() => navigate('/')} title="Kifome">Kifome</div>
        <nav className="top-links">
          <button className="top-link" onClick={() => navigate('/')}>Início</button>
          <button className="top-link" onClick={() => navigate('/restaurantes')}>Restaurantes</button>
          <button className="top-link">Mercados</button>
          <button className="top-link">Bebidas</button>
          <button className="top-link">Farmácias</button>
          <button className="top-link">Pets</button>
          <button className="top-link">Shopping</button>
        </nav>
      </div>

      <div className="layout-topbar-center">
        <div className="ifood-search-chip" title="Busque por item ou loja">
          <span className="search-icon">🔍</span>
          <input className="ifood-search-input" placeholder="Busque por item ou loja" onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/buscar?q=${encodeURIComponent(e.target.value)}`); }} />
        </div>
      </div>

      <div className="layout-topbar-right">
        <div className="address">R. Cubatão, 726 ▾</div>
        <button className="icon-btn" onClick={() => navigate('/perfil')} title={`Olá ${primeiroNome}`}>👤</button>
        <button className="icon-btn" onClick={() => navigate('/carrinho')} title="Carrinho">🛒 {cartCount > 0 ? `${cartCount} • R$ ${cartTotal.toFixed(2)}` : <span className="cart-small">R$ 0,00</span>}</button>
      </div>
    </div>
  );
}
