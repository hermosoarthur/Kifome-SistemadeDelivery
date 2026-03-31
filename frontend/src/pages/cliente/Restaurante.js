import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restauranteService, produtoService } from '../../services';
import { useCart } from '../../contexts/CartContext';
import ProductCard from '../../components/ProductCard';
import ProductModal from '../../components/ProductModal';
import './Restaurante.css';

export default function RestaurantePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItems } = useCart();
  const [restaurante, setRestaurante] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [catAtiva, setCatAtiva] = useState('');
  const [loading, setLoading] = useState(true);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const [r, p] = await Promise.all([
          restauranteService.obter(id).then(d => d.restaurante || d),
          produtoService.listar(id).then(d => d.produtos || []),
        ]);
        setRestaurante(r);
        setProdutos(p.filter(x => x.disponivel !== false));
      } catch (e) {
        setRestaurante(null);
      } finally { setLoading(false); }
    }
    carregar();
  }, [id]);

  const cats = useMemo(() => {
    const map = new Map();
    produtos.forEach(p => {
      const c = p.categoria || 'Destaques';
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(p);
    });
    return Array.from(map.entries()).map(([nome, items]) => ({ nome, items }));
  }, [produtos]);

  const selectedCat = catAtiva && cats.find(c => c.nome === catAtiva) ? catAtiva : (cats[0]?.nome || '');
  const lista = cats.find(c => c.nome === selectedCat)?.items || [];

  function handleAdd(produto, qtd = 1) {
    addItems([{ produto, quantidade: qtd, restaurante_id: Number(id) }]);
  }

  if (loading) {
    return <div className="rest-page"><div className="rest-hero skeleton" /></div>;
  }

  if (!restaurante) {
    return (
      <div className="rest-page">
        <div className="rest-empty">
          <p>Restaurante não encontrado.</p>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rest-page">
      <div className="rest-hero" style={{ backgroundImage: `url(${restaurante.capa_url || restaurante.imagem_url || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&auto=format'})` }}>
        <div className="rest-hero-overlay" />
        <div className="rest-hero-content">
          <button className="rest-back" onClick={() => navigate(-1)}>←</button>
          <div className="rest-hero-box">
            <div>
              <div className="rest-rating">⭐ {(restaurante.nota || 4.7).toFixed(1)} • {restaurante.categoria || 'Especialidades'}</div>
              <h1>{restaurante.nome_fantasia}</h1>
              <p>{restaurante.endereco}</p>
            </div>
            <div className="rest-meta">
              <span>🕐 25-45 min</span>
              <span>•</span>
              <span>Entrega: grátis</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rest-body">
        <div className="rest-tabs">
          {cats.map(c => (
            <button key={c.nome} className={`rest-tab ${selectedCat === c.nome ? 'active' : ''}`} onClick={() => setCatAtiva(c.nome)}>{c.nome}</button>
          ))}
        </div>

        <div className="rest-products">
          {lista.map(p => (
            <ProductCard key={p.id} produto={p} onAdd={() => setProdutoSelecionado(p)} />
          ))}
          {lista.length === 0 && <div className="rest-empty"><p>Nenhum item nesta categoria.</p></div>}
        </div>
      </div>

      {produtoSelecionado && (
        <ProductModal
          produto={produtoSelecionado}
          restauranteId={Number(id)}
          onClose={() => setProdutoSelecionado(null)}
          onAdd={(prod, qtd) => handleAdd(prod, qtd)}
        />
      )}
    </div>
  );
}
