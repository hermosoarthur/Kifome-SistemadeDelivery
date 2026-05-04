import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { restauranteService } from '../../services';
import RestaurantCard from '../../components/RestaurantCard';
import './ClienteHome.css';

// Lista de categorias completa e restaurada
const CATS = [
  { id: 1, nome: 'Lanches', icon: '🍔' },
  { id: 2, nome: 'Marmita', icon: '🍱' },
  { id: 3, nome: 'Italiana', icon: '🍝' },
  { id: 4, nome: 'Promoções', icon: '🏷️' },
  { id: 5, nome: 'Salgados', icon: '🥐' },
  { id: 6, nome: 'Saudável', icon: '🥗' },
  { id: 7, nome: 'Açaí', icon: '🍧' },
  { id: 8, nome: 'Árabe', icon: '🥙' },
  { id: 9, nome: 'Chinesa', icon: '🥢' },
  { id: 10, nome: 'Carnes', icon: '🥩' },
  { id: 11, nome: 'Pizza', icon: '🍕' },
  { id: 12, nome: 'Doces & Bolos', icon: '🍰' },
  { id: 13, nome: 'Padarias', icon: '🥖' },
  { id: 14, nome: 'Pastel', icon: '🥟' },
];

export default function ClienteHome() {
  const { tipo } = useParams();
  const { usuario } = useAuth();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();

  // Refs para os dois carrosséis
  const scrollRefCats = useRef(null);
  const scrollRefUltimas = useRef(null);

  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catAtiva, setCatAtiva] = useState('');

  const carregar = useCallback(async (filtros = {}) => {
    setLoading(true);
    try {
      // Prioriza o filtro do clique (filtros.categoria) ou da URL (tipo)
      const categoriaFiltro = filtros.categoria || tipo;
      const params = { per_page: 20 };

      if (categoriaFiltro && categoriaFiltro !== 'restaurantes') {
        params.categoria = categoriaFiltro;
      }

      const response = await restauranteService.listar(params);
      setRestaurantes(response.restaurantes || []);
    } catch (err) {
      console.error('Erro ao carregar:', err);
      setRestaurantes([]);
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => {
    carregar();
    if (!tipo) setCatAtiva(''); // Reseta a bolinha ativa se voltar para o início
  }, [tipo, carregar]);

  // Função de Scroll genérica
  const handleScroll = (ref, direction) => {
    if (ref.current) {
      const amt = ref.current.clientWidth * 0.7;
      ref.current.scrollBy({ left: direction === 'left' ? -amt : amt, behavior: 'smooth' });
    }
  };

  return (
    <div className="cliente-home">
      {/* Hero */}
      <div className="ch-hero">
        <div className="ch-hero-inner">
          <h1 className="ch-greeting">Oi, {usuario?.nome?.split(' ')[0] || 'Rafael'}! 👋</h1>
          <p className="ch-subtitle">{tipo ? `Explorando ${tipo}` : 'O que vamos pedir hoje?'}</p>
        </div>
      </div>

      {/* Banner de Cupons */}
      {!tipo && (
        <div className="coupon-container" onClick={() => navigate('/cupons')} style={{ cursor: 'pointer' }}>
          <div className="coupon-banner">
            <div className="coupon-inner">
              <div className="coupon-content">
                <span className="coupon-icon">🎟️</span>
                <span>Você tem <strong>1 cupom</strong> disponível</span>
              </div>
              {/* O clique no container já resolve, mas o botão reforça a ação */}
              <button className="coupon-cta">Ver todos →</button>
            </div>
          </div>
        </div>
      )}
      {/* Seção Categorias */}
      <div className="section">
        <div className="section-header"><h2>Categorias</h2></div>
        <div className="carousel-wrapper">
          <button className="nav-arrow left" onClick={() => handleScroll(scrollRefCats, 'left')}>‹</button>
          <div className="cats-scroll" ref={scrollRefCats}>
            {CATS.map(c => (
              <button
                key={c.id}
                className={`cat-btn ${catAtiva === c.nome ? 'ativo' : ''}`}
                onClick={() => {
                  const novoFiltro = catAtiva === c.nome ? '' : c.nome;
                  setCatAtiva(novoFiltro);
                  carregar(novoFiltro ? { categoria: novoFiltro } : {});
                }}
              >
                <span className="cat-circle">{c.icon}</span>
                <span className="cat-text">{c.nome}</span>
              </button>
            ))}
          </div>
          <button className="nav-arrow right" onClick={() => handleScroll(scrollRefCats, 'right')}>›</button>
        </div>
      </div>

      {/* SEÇÃO: ÚLTIMAS LOJAS (Com setas e scroll corrigido) */}
      {!tipo && (
        <div className="section">
          <div className="section-header">
            <h2>Últimas lojas</h2>
            <span className="see-more" onClick={() => navigate('/restaurantes')}>Ver todas</span>
          </div>

          <div className="carousel-wrapper">
            <button className="nav-arrow left" onClick={() => handleScroll(scrollRefUltimas, 'left')}>‹</button>

            <div className="ultimas-list" ref={scrollRefUltimas}>
              {[
                { id: 1, n: 'Burger King', t: '20-30 min', img: 'https://images.seeklogo.com/logo-png/2/1/burger-king-logo-png_seeklogo-23687.png' },
                { id: 2, n: 'Popeyes', t: '25-35 min', img: 'https://images.seeklogo.com/logo-png/38/1/popeyes-louisiana-kitchen-logo-png_seeklogo-389123.png' },
                { id: 3, n: 'Habib\'s', t: '15-25 min', img: 'https://images.seeklogo.com/logo-png/19/1/habibs-logo-png_seeklogo-193930.png' },
                { id: 4, n: 'McDonald\'s', t: '10-20 min', img: 'https://images.seeklogo.com/logo-png/16/1/mcdonalds-logo-png_seeklogo-168472.png' },
                { id: 5, n: 'Subway', t: '20-40 min', img: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Subway_2016_logo.svg' },
                { id: 6, n: 'Giraffas', t: '30-40 min', img: 'https://images.seeklogo.com/logo-png/33/1/giraffas-logo-png_seeklogo-334483.png' }
              ].map(loja => (
                <div key={loja.id} className="ultimas-card" onClick={() => navigate(`/restaurante/${loja.id}`)}>
                  <div className="ultimas-img-container">
                    <img src={loja.img} alt={loja.n} onError={(e) => e.target.src = '🍔'} />
                  </div>
                  <div className="ultimas-info">
                    <strong>{loja.n}</strong>
                    <span>{loja.t}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="nav-arrow right" onClick={() => handleScroll(scrollRefUltimas, 'right')}>›</button>
          </div>
        </div>
      )}

      {/* SEÇÃO: RESTAURANTES PARA VOCÊ */}
      <div className="section">
        <div className="section-header">
          <h2>{tipo ? `Destaques em ${tipo}` : 'Restaurantes para você'}</h2>
          <span className="results-count">{restaurantes.length} lojas</span>
        </div>

        {loading ? (
          <div className="r-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="r-skeleton" />)}
          </div>
        ) : (
          <div className="r-grid">
            {restaurantes.map(r => (
              <RestaurantCard key={r.id} restaurante={r} onSelect={() => navigate(`/restaurante/${r.id}`)} />
            ))}
          </div>
        )}
      </div>

      {cartCount > 0 && (
        <button className="cart-float" onClick={() => navigate('/carrinho')}>
          🛒 <span>{cartCount}</span>
        </button>
      )}
    </div>
  );
}