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
  const { addItems, items, clearCart, count, total } = useCart();
  const [restaurante, setRestaurante] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [catAtiva, setCatAtiva] = useState('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        // Busca os dados reais baseados no ID da URL
        const [r, p] = await Promise.all([
          restauranteService.obter(id).then(d => d.restaurante || d),
          produtoService.listar(id, { per_page: 100, disponivel: true, busca }).then(d => d.produtos || []),
        ]);
        setRestaurante(r);
        setProdutos(p.filter(x => x.disponivel !== false));
      } catch (e) {
        console.error("Erro ao carregar restaurante:", e);
        setRestaurante(null);
      } finally { setLoading(false); }
    }
    carregar();
  }, [id, busca]);

  // Organiza os produtos por categoria (ex: Lanches, Bebidas, Acompanhamentos)
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
  const temItensDesteRestaurante = items.length > 0 && Number(items[0]?.restaurante_id) === Number(id);

  function handleAdd(produto, qtd = 1) {
    const restauranteAtual = Number(id);
    const restauranteNoCarrinho = items[0]?.restaurante_id;
    if (restauranteNoCarrinho && restauranteNoCarrinho !== restauranteAtual) {
      const confirmarTroca = window.confirm('Seu carrinho possui itens de outro restaurante. Deseja limpar o carrinho para continuar?');
      if (!confirmarTroca) return false;
      clearCart();
    }

    addItems([{ produto, quantidade: qtd, restaurante_id: Number(id) }]);
    setProdutoSelecionado(null); // Fecha o modal após adicionar
    return true;
  }

  if (loading) {
    return <div className="rest-page"><div className="rest-hero skeleton" /></div>;
  }

  if (!restaurante) {
    return (
      <div className="rest-page">
        <div className="rest-empty">
          <h2>Ops! Restaurante não encontrado.</h2>
          <p>O restaurante com ID {id} pode não estar disponível.</p>
          <button className="btn-voltar" onClick={() => navigate('/')}>Voltar para o Início</button>
        </div>
      </div>
    );
  }

  // Lógica de Imagem de Capa: Prioriza o que vem do banco, senão usa um padrão de alta qualidade
  const capaBanner = restaurante.capa_url || restaurante.imagem_url || 
    (Number(id) === 1 
      ? 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200' // Foto Burger King real
      : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200');

  return (
    <div className="rest-page">
      <div className="rest-hero" style={{ backgroundImage: `url(${capaBanner})` }}>
        <div className="rest-hero-overlay" />
        <div className="rest-hero-content">
          <button className="rest-back" onClick={() => navigate(-1)}>←</button>
          
          <div className="rest-hero-box">
            <div className="rest-main-info">
              <div className="rest-rating">
                ⭐ {(restaurante.nota || 4.8).toFixed(1)} • {restaurante.categoria || 'Fast Food'}
              </div>
              <h1>{restaurante.nome_fantasia || restaurante.nome || 'Carregando...'}</h1>
              <p>{restaurante.endereco || 'Endereço não informado'}</p>
            </div>
            
            <div className="rest-meta">
              <div className="meta-item">
                <span className="icon">🕒</span>
                <span>20-35 min</span>
              </div>
              <span className="divider">•</span>
              <div className="meta-item">
                <span className="icon">🛵</span>
                <span>Entrega: Grátis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rest-body">
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Buscar no cardápio</label>
            <div className="input-box">
              <input
                type="text"
                placeholder="Ex.: x-burger, batata, refrigerante..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Menu de Categorias (Tabs) */}
        <div className="rest-tabs-container">
          <div className="rest-tabs">
            {cats.map(c => (
              <button 
                key={c.nome} 
                className={`rest-tab ${selectedCat === c.nome ? 'active' : ''}`} 
                onClick={() => setCatAtiva(c.nome)}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Listagem de Produtos */}
        <div className="rest-products-grid">
          {lista.map(p => (
            <ProductCard 
              key={p.id} 
              produto={p} 
              onAdd={() => setProdutoSelecionado(p)} 
            />
          ))}
          
          {lista.length === 0 && (
            <div className="rest-empty-cat">
              <p>Nenhum item disponível nesta categoria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Produto */}
      {produtoSelecionado && (
        <ProductModal
          produto={produtoSelecionado}
          restauranteId={Number(id)}
          onClose={() => setProdutoSelecionado(null)}
          onAdd={(prod, qtd) => handleAdd(prod, qtd)}
        />
      )}

      {temItensDesteRestaurante && (
        <button
          className="cart-float"
          onClick={() => navigate('/carrinho')}
          style={{ minWidth: 220, justifyContent: 'space-between', padding: '10px 16px' }}
        >
          <span>🛒 Ver sacola ({count})</span>
          <strong>R$ {Number(total || 0).toFixed(2)}</strong>
        </button>
      )}
    </div>
  );
}