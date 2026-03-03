import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { restauranteService, produtoService, pedidoService } from '../../services';
import './ClienteHome.css';

const CATS = [
  { id: '', l: 'Todos', e: '🍽️' }, { id: 'Pizza', l: 'Pizza', e: '🍕' },
  { id: 'Burger', l: 'Burger', e: '🍔' }, { id: 'Sushi', l: 'Sushi', e: '🍱' },
  { id: 'Açaí', l: 'Açaí', e: '🍧' }, { id: 'Fitness', l: 'Fitness', e: '🥗' },
  { id: 'Árabe', l: 'Árabe', e: '🥙' }, { id: 'Doces', l: 'Doces', e: '🍰' },
];

const IMGS = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format',
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&auto=format',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format',
];

function ModalPedido({ restaurante, onFechar, onPedido }) {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState({});
  const [endereco, setEndereco] = useState('');
  const [obs, setObs] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingP, setLoadingP] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    produtoService.listar(restaurante.id)
      .then(d => setProdutos(d.produtos || []))
      .catch(() => setProdutos([]))
      .finally(() => setLoadingP(false));
  }, [restaurante.id]);

  const add = (id) => setCarrinho(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const rem = (id) => setCarrinho(p => { const n = { ...p }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const total = produtos.reduce((s, p) => s + (carrinho[p.id] || 0) * p.preco, 0);
  const qtdTotal = Object.values(carrinho).reduce((s, v) => s + v, 0);

  async function confirmar() {
    if (!endereco.trim()) { setErro('Informe o endereço de entrega'); return; }
    if (qtdTotal === 0) { setErro('Adicione pelo menos um item'); return; }
    setLoading(true); setErro('');
    try {
      const itens = Object.entries(carrinho).map(([produto_id, quantidade]) => ({ produto_id: Number(produto_id), quantidade }));
      const d = await pedidoService.criar({ restaurante_id: restaurante.id, itens, endereco_entrega: endereco, observacao: obs });
      onPedido(d.pedido);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer pedido');
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-bg" onClick={onFechar}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>🍽️ {restaurante.nome_fantasia}</h3>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div className="modal-body">
          {erro && <div className="alert alert-erro">{erro}</div>}
          {loadingP ? <p style={{ textAlign: 'center', padding: 24 }}>Carregando cardápio...</p> : (
            <>
              <h4 style={{ marginBottom: 12, color: 'var(--texto-sec)', fontSize: 13, textTransform: 'uppercase' }}>Cardápio</h4>
              {produtos.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--texto-sec)', padding: '16px 0' }}>Nenhum produto disponível</p>
              ) : (
                <div className="produto-list">
                  {produtos.filter(p => p.disponivel).map(p => (
                    <div key={p.id} className="produto-item">
                      <div className="produto-info">
                        <strong>{p.nome}</strong>
                        {p.descricao && <small>{p.descricao}</small>}
                        <span className="produto-preco">R$ {p.preco.toFixed(2)}</span>
                      </div>
                      <div className="produto-qtd">
                        {carrinho[p.id] ? (
                          <>
                            <button className="qtd-btn" onClick={() => rem(p.id)}>−</button>
                            <span>{carrinho[p.id]}</span>
                            <button className="qtd-btn add" onClick={() => add(p.id)}>+</button>
                          </>
                        ) : (
                          <button className="qtd-btn add" onClick={() => add(p.id)}>+</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>📍 Endereço de entrega *</label>
                <div className="input-box"><input type="text" placeholder="Rua, número, bairro" value={endereco} onChange={e => setEndereco(e.target.value)} /></div>
              </div>
              <div className="form-group">
                <label>Observação</label>
                <div className="input-box"><textarea placeholder="Ex: sem cebola, ponto da carne..." value={obs} onChange={e => setObs(e.target.value)} /></div>
              </div>
              {total > 0 && (
                <div className="pedido-total">
                  <span>Total: <strong>R$ {total.toFixed(2)}</strong></span>
                  <span>{qtdTotal} ite{qtdTotal > 1 ? 'ns' : 'm'}</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primary" disabled={loading || qtdTotal === 0} style={{ width: 'auto', padding: '12px 28px' }} onClick={confirmar}>
            {loading ? <span className="spinner" /> : `Fazer Pedido ${total > 0 ? `• R$ ${total.toFixed(2)}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClienteHome() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [catAtiva, setCatAtiva] = useState('');
  const [restauranteSelecionado, setRestauranteSelecionado] = useState(null);
  const [pedidoSucesso, setPedidoSucesso] = useState(null);
  const buscaTimer = useRef(null);

  const carregar = useCallback(async (params = {}) => {
    setLoading(true);
    try { const d = await restauranteService.listar({ per_page: 20, ...params }); setRestaurantes(d.restaurantes || []); }
    catch { setRestaurantes([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function handleBusca(v) {
    setBusca(v);
    clearTimeout(buscaTimer.current);
    buscaTimer.current = setTimeout(() => carregar(v ? { busca: v } : {}), 400);
  }

  function handleCat(id) {
    setCatAtiva(id);
    carregar(id ? { busca: id } : {});
  }

  function handlePedidoFeito(pedido) {
    setRestauranteSelecionado(null);
    setPedidoSucesso(pedido);
    setTimeout(() => setPedidoSucesso(null), 5000);
  }

  return (
    <div className="cliente-home">
      <div className="ch-hero">
        <div className="ch-hero-inner">
          <h1>Olá, {usuario?.nome?.split(' ')[0]} 👋</h1>
          <p>📍 O que você quer comer hoje?</p>
          <div className="ch-busca">
            <span>🔍</span>
            <input type="text" placeholder="Buscar restaurante ou culinária..." value={busca} onChange={e => handleBusca(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 24 }}>
        {pedidoSucesso && (
          <div className="alert alert-sucesso">
            ✅ Pedido #{pedidoSucesso.id} realizado! <button className="btn btn-secondary btn-sm" style={{ marginLeft: 12 }} onClick={() => navigate('/meus-pedidos')}>Ver pedidos</button>
          </div>
        )}

        <div className="cats-scroll">
          {CATS.map(c => (
            <button key={c.id} className={`cat-btn ${catAtiva === c.id ? 'ativo' : ''}`} onClick={() => handleCat(c.id)}>
              <span>{c.e}</span><span>{c.l}</span>
            </button>
          ))}
        </div>

        <div className="sec-header">
          <h2 className="sec-title">Restaurantes</h2>
          <span style={{ fontSize: 13, color: 'var(--texto-sec)' }}>{restaurantes.length} disponíveis</span>
        </div>

        {loading ? (
          <div className="r-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="r-skeleton" />)}</div>
        ) : restaurantes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <span style={{ fontSize: 48 }}>🍽️</span>
            <h3 style={{ margin: '12px 0 6px' }}>Nenhum restaurante encontrado</h3>
            <p style={{ color: 'var(--texto-sec)' }}>Tente outro termo</p>
          </div>
        ) : (
          <div className="r-grid">
            {restaurantes.map((r, i) => (
              <div key={r.id} className="r-card" onClick={() => setRestauranteSelecionado(r)}>
                <div className="r-img">
                  <img src={r.imagem_url || IMGS[i % IMGS.length]} alt={r.nome_fantasia} loading="lazy" />
                  {r.categoria && <span className="r-tag">{r.categoria}</span>}
                </div>
                <div className="r-body">
                  <h3>{r.nome_fantasia}</h3>
                  <p>{r.endereco}</p>
                  <div className="r-meta">
                    <span>⭐ {(3.8 + (i * 0.2 % 1.1)).toFixed(1)}</span>
                    <span className="dot">•</span>
                    <span>🕐 {25 + (i * 8 % 35)} min</span>
                    <span className="dot">•</span>
                    <span style={{ color: 'var(--sucesso)', fontWeight: 700 }}>🚚 Grátis</span>
                  </div>
                  <button className="r-pedir-btn">Ver cardápio e pedir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {restauranteSelecionado && (
        <ModalPedido
          restaurante={restauranteSelecionado}
          onFechar={() => setRestauranteSelecionado(null)}
          onPedido={handlePedidoFeito}
        />
      )}
    </div>
  );
}
