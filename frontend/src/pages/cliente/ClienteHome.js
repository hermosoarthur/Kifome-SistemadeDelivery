// Arquivo: frontend/src/pages/cliente/ClienteHome.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { restauranteService } from '../../services';
import RestaurantCard from '../../components/RestaurantCard';
import CategoryCarousel from '../../components/CategoryCarousel';
import './ClienteHome.css';

const CATS = [
  { id: '', l: 'Todos', e: '🍽️' }, { id: 'Pizza', l: 'Pizza', e: '🍕' },
  { id: 'Burger', l: 'Burger', e: '🍔' }, { id: 'Sushi', l: 'Sushi', e: '🍱' },
  { id: 'Açaí', l: 'Açaí', e: '🍧' }, { id: 'Fitness', l: 'Fitness', e: '🥗' },
  { id: 'Árabe', l: 'Árabe', e: '🥙' }, { id: 'Doces', l: 'Doces', e: '🍰' },
];

export default function ClienteHome() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca] = useState('');
  const [catAtiva, setCatAtiva] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem('@kifome:carrinho') || '{}');
      const count = Object.values(c).reduce((s, v) => s + (Number(v) || 0), 0);
      setCartCount(count);
    } catch (e) { setCartCount(0); }
  }, []);

  const carregar = useCallback(async (params = {}) => {
    setLoading(true);
    try { const d = await restauranteService.listar({ per_page: 20, ...params }); setRestaurantes(d.restaurantes || []); }
    catch { setRestaurantes([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);


  function handleCat(id) {
    setCatAtiva(id);
    carregar(id ? { categoria: id } : {});
  }

  return (
    <div className="cliente-home">
      <div className="page">
        <div className="ch-page">
          <div className="ch-hero">
            <div className="ch-hero-inner">
              <div className="ch-hero-copy">
                <span className="ch-brand-chip">Kifome</span>
                <div className="ch-hero-badges">
                  <span>🍔 Restaurantes perto de você</span>
                  <span>🧭 Busca rápida</span>
                  <span>🛵 Entrega prática</span>
                </div>
                <h1>Olá, {usuario?.nome?.split(' ')[0]} 👋<br />O que você quer pedir hoje?</h1>
                <p>Escolha restaurantes, filtre por categoria e abra o cardápio com uma navegação mais direta, limpa e no estilo de app de delivery.</p>
                {/* busca centralizada foi movida para o header global */}
              </div>

              <div className="ch-highlight-card">
                <strong>Peça no seu ritmo</strong>
                <p>Sem poluição visual: busque, filtre, escolha um restaurante e monte seu pedido de forma simples.</p>
                <div className="ch-highlight-list">
                  <div className="ch-highlight-item">
                    <div className="chi-icon">📍</div>
                    <div className="chi-text">
                      <span className="chi-title">Endereço e categoria</span>
                      <span className="chi-sub">decisão mais rápida</span>
                    </div>
                  </div>
                  <div className="ch-highlight-item">
                    <div className="chi-icon">⭐</div>
                    <div className="chi-text">
                      <span className="chi-title">Nota, tempo e entrega</span>
                      <span className="chi-sub">tudo no mesmo card</span>
                    </div>
                  </div>
                  <div className="ch-highlight-item">
                    <div className="chi-icon">🧾</div>
                    <div className="chi-text">
                      <span className="chi-title">Pedido direto</span>
                      <span className="chi-sub">cardápio com total visível</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Banner de cupons bem parecido com iFood */}
          <div className="coupon-banner">
            <div className="coupon-inner">
              <div className="coupon-left">🎁 Você tem <strong>203 cupons!</strong> Aproveite seus descontos</div>
              <div className="coupon-cta">▾</div>
            </div>
          </div>

          <div className="ch-top-grid">
            <div className="card ch-section-card">
              <div className="section-heading">
                <h2>Categorias</h2>
                <span className="page-subtitle">Navegue por estilos de cozinha</span>
              </div>
              <CategoryCarousel categories={CATS} activeId={catAtiva} onSelect={handleCat} />
            </div>

            <div className="card ch-section-card">
              <div className="section-heading">
                <h2>Visão rápida</h2>
              </div>
              <div className="ch-mini-list">
                <div className="ch-mini-item"><span>🏪</span><div><strong>{restaurantes.length} restaurantes</strong><p>Opções encontradas na sua busca atual.</p></div></div>
                <div className="ch-mini-item"><span>⚡</span><div><strong>Fluxo rápido</strong><p>Abra o restaurante e faça o pedido sem etapas desnecessárias.</p></div></div>
                <div className="ch-mini-item"><span>📦</span><div><strong>Pedidos organizados</strong><p>Acompanhe depois tudo em uma linha do tempo simples.</p></div></div>
              </div>
            </div>
          </div>

          <div className="card ch-section-card">
            <div className="section-heading">
              <h2>Seu momento no Kifome</h2>
              <span className="page-subtitle">Uma home limpa, sem cupons e focada em busca, categorias e restaurantes</span>
            </div>
            <div className="ch-stat-strip">
              <div className="ch-stat-item"><strong>{restaurantes.length}</strong><span>Restaurantes disponíveis</span></div>
              <div className="ch-stat-item"><strong>{catAtiva || 'Todos'}</strong><span>Categoria em destaque</span></div>
              <div className="ch-stat-item"><strong>{busca ? 'Busca ativa' : 'Exploração livre'}</strong><span>Contexto da vitrine atual</span></div>
            </div>
          </div>

          <div>
            <div className="sec-header">
              <h2 className="sec-title">Restaurantes</h2>
              <span className="page-subtitle">{restaurantes.length} disponíveis para pedir agora</span>
            </div>

            {/* Últimas Lojas - exemplo similar ao iFood */}
            <div className="ultimas-lojas">
              <h3>Últimas Lojas</h3>
              <div className="ultimas-list">
                <div className="ultimas-card" onClick={() => { /* navegar para restaurante de exemplo */ navigate('/restaurante/1'); }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Burger_King_Logo.svg" alt="Burger King" />
                  <div className="ultimas-info"><strong>Burger King - Jk Iguatemi</strong></div>
                </div>
                <div className="ultimas-card" onClick={() => { navigate('/restaurante/2'); }}>
                  <img src="https://seeklogo.com/images/P/popeyes-logo-2B39F4C4B6-seeklogo.com.png" alt="Popeyes" />
                  <div className="ultimas-info"><strong>Popeyes - Frango Frito - Vila Olímpia</strong></div>
                </div>
              </div>
              <div style={{ textAlign: 'right', marginTop: 8 }}><button className="link-like" onClick={() => navigate('/restaurantes')}>Ver mais</button></div>
            </div>

            {loading ? (
              <div className="r-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="r-skeleton" />)}</div>
            ) : restaurantes.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-emoji">🍽️</span>
                <h3>Nenhum restaurante encontrado</h3>
                <p>Tente outro termo de busca ou remova o filtro de categoria para explorar o marketplace.</p>
              </div>
            ) : (
              <div className="r-grid">
                {restaurantes.map((r, i) => (
                  <RestaurantCard key={r.id} restaurante={r} index={i} onSelect={(rest) => navigate(`/restaurante/${rest.id}`)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão flutuante do carrinho (estilo iFood) */}
      <button className="cart-float" onClick={() => navigate('/carrinho')} aria-label="Abrir carrinho">
        <span className="cart-emoji">🛒</span>
        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
      </button>
    </div>
  );
}
