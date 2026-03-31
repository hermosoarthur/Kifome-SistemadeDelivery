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
        // Busca os dados reais baseados no ID da URL
        const [r, p] = await Promise.all([
          restauranteService.obter(id).then(d => d.restaurante || d),
          produtoService.listar(id).then(d => d.produtos || []),
        ]);
        setRestaurante(r);
        setProdutos(p.filter(x => x.disponivel !== false));
      } catch (e) {
        console.error("Erro ao carregar restaurante:", e);
        setRestaurante(null);
      } finally { setLoading(false); }
    }
    carregar();
  }, [id]);

  // Procure o useEffect que faz o carregar()
useEffect(() => {
  async function carregar() {
    try {
      const [r, p] = await Promise.all([
        restauranteService.obter(id).then(d => d.restaurante || d),
        produtoService.listar(id).then(d => d.produtos || []),
      ]);

      let listaFinal = p;

      // SE FOR O ID 1 (BURGER KING), ADICIONAMOS OS ITENS AQUI
      if (id === '1') {
        const itensBK = [
          { id: 501, nome: 'Whopper de Plantas', descricao: 'Hambúrguer de plantas grelhado no fogo.', preco: 32.90, categoria: 'Hambúrguer', disponivel: true },
          { id: 502, nome: 'BK Chicken 10 unid', descricao: 'Crocantes pedaços de frango.', preco: 19.90, categoria: 'Acompanhamentos', disponivel: true },
          { id: 503, nome: 'Pepsi 500ml', descricao: 'Refresco gelado.', preco: 12.00, categoria: 'Bebidas', disponivel: true }
        ];
        listaFinal = [...p, ...itensBK];
      }

      setRestaurante(r);
      setProdutos(listaFinal.filter(x => x.disponivel !== false));
    } catch (e) { console.error(e); }
  }
  carregar();
}, [id]);

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

  function handleAdd(produto, qtd = 1) {
    addItems([{ produto, quantidade: qtd, restaurante_id: Number(id) }]);
    setProdutoSelecionado(null); // Fecha o modal após adicionar
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
    </div>
  );
}