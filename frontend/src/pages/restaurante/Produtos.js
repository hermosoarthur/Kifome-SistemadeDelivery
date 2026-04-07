import React, { useState, useEffect, useCallback } from 'react';
import { restauranteService, produtoService } from '../../services';

export default function Produtos() {
  const [restaurante, setRestaurante] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nome: '', descricao: '', preco: '', categoria: '', imagem_url: '', disponivel: true });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const dr = await restauranteService.meus();
      const rs = dr.restaurantes || [];
      if (rs.length > 0) {
        setRestaurante(rs[0]);
        const dp = await produtoService.listar(rs[0].id);
        setProdutos(dp.produtos || []);
      }
    } catch { setProdutos([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirModal(item = null) {
    setEditItem(item);
    setForm(item ? { nome: item.nome || '', descricao: item.descricao || '', preco: item.preco?.toString() || '', categoria: item.categoria || '', imagem_url: item.imagem_url || '', disponivel: item.disponivel !== false } : { nome: '', descricao: '', preco: '', categoria: '', imagem_url: '', disponivel: true });
    setErro(''); setModal(true);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    const preco = parseFloat(form.preco);
    if (isNaN(preco) || preco <= 0) { setErro('Preço inválido'); return; }
    if (!restaurante) { setErro('Nenhum restaurante cadastrado'); return; }
    setSalvando(true); setErro('');
    try {
      const data = { ...form, preco };
      if (editItem?.id) await produtoService.atualizar(restaurante.id, editItem.id, data);
      else await produtoService.criar(restaurante.id, data);
      setModal(false); carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setSalvando(false); }
  }

  async function excluir(p) {
    if (!window.confirm(`Excluir "${p.nome}"?`)) return;
    try { await produtoService.deletar(restaurante.id, p.id); setProdutos(prev => prev.filter(x => x.id !== p.id)); }
    catch (err) { alert(err.response?.data?.erro || 'Erro ao excluir'); }
  }

  async function toggleDisponivel(p) {
    try {
      await produtoService.atualizar(restaurante.id, p.id, { disponivel: !p.disponivel });
      setProdutos(prev => prev.map(x => x.id === p.id ? { ...x, disponivel: !p.disponivel } : x));
    } catch {}
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (loading) return <div className="page"><div className="loading-state"><h3>Carregando cardápio</h3><p>Estamos buscando os produtos do restaurante para montar a vitrine administrativa.</p></div></div>;

  if (!restaurante) return (
    <div className="page"><div className="empty-state">
      <span className="empty-state-emoji">🍽️</span>
      <h3>Cadastre seu restaurante primeiro</h3>
      <p>Você precisa de um restaurante ativo para poder gerenciar produtos e cardápio.</p>
    </div></div>
  );

  return (
    <div className="page">
      <div className="hero-panel" style={{ marginBottom: 20 }}>
        <span className="hero-chip">🍕 Cardápio Kifome</span>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', margin: '16px 0 10px', letterSpacing: '-0.04em' }}>Monte um cardápio mais visual, organizado e pronto para vender.</h2>
        <p style={{ color: 'rgba(255,255,255,.78)', maxWidth: 620, lineHeight: 1.7 }}>Gerencie itens, preços, disponibilidade e imagens com a mesma linguagem visual do restante da operação.</p>
      </div>

      <div className="section-heading">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Cardápio</h1>
          <p className="page-subtitle">{restaurante.nome_fantasia} • {produtos.length} produto{produtos.length !== 1 ? 's' : ''} com apresentação mais limpa e profissional.</p>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => abrirModal()}>+ Novo Produto</button>
      </div>

      {produtos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-emoji">🍕</span>
          <h3>Nenhum produto cadastrado</h3>
          <p>Adicione os primeiros itens do cardápio para transformar o restaurante em uma vitrine real de delivery.</p>
          <div style={{ marginTop: 18 }}><button className="btn btn-primary" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => abrirModal()}>+ Adicionar produto</button></div>
        </div>
      ) : (
        <div className="product-grid">
          {produtos.map(p => (
            <div key={p.id} className="card product-card" style={{ opacity: p.disponivel ? 1 : 0.7 }}>
              <div className="product-card-media">{p.imagem_url && <img src={p.imagem_url} alt={p.nome} />}</div>
              <div className="product-card-body">
                <div className="product-card-head">
                  <strong>{p.nome}</strong>
                  <strong className="product-card-price">R$ {p.preco.toFixed(2)}</strong>
                </div>
                {p.descricao && <p className="product-card-desc">{p.descricao}</p>}
                {p.categoria && <span className="badge badge-cinza" style={{ marginBottom: 10, display: 'inline-block' }}>{p.categoria}</span>}
                <div className="product-card-actions">
                  <button className="btn btn-sm" style={{ flex: 1, background: p.disponivel ? '#D1FAE5' : '#FEF3C7', color: p.disponivel ? '#065F46' : '#92400E', border: 'none' }} onClick={() => toggleDisponivel(p)}>
                    {p.disponivel ? '✅ Disponível' : '⏸️ Indisponível'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => abrirModal(p)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => excluir(p)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-bg" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editItem?.id ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {erro && <div className="alert alert-erro">{erro}</div>}
              <form onSubmit={salvar}>
                <div className="form-row">
                  <div className="form-group"><label>Nome *</label><div className="input-box"><input type="text" placeholder="Ex: Pizza Margherita" value={form.nome} onChange={e => set('nome', e.target.value)} /></div></div>
                  <div className="form-group"><label>Preço (R$) *</label><div className="input-box"><input type="number" step="0.01" min="0" placeholder="0,00" value={form.preco} onChange={e => set('preco', e.target.value)} /></div></div>
                </div>
                <div className="form-group"><label>Descrição</label><div className="input-box"><textarea placeholder="Ingredientes, tamanho..." value={form.descricao} onChange={e => set('descricao', e.target.value)} /></div></div>
                <div className="form-row">
                  <div className="form-group"><label>Categoria</label><div className="input-box"><input type="text" placeholder="Ex: Pizzas, Bebidas..." value={form.categoria} onChange={e => set('categoria', e.target.value)} /></div></div>
                  <div className="form-group"><label>URL da imagem</label><div className="input-box"><input type="url" placeholder="https://..." value={form.imagem_url} onChange={e => set('imagem_url', e.target.value)} /></div></div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 4 }}>
                  <input type="checkbox" checked={form.disponivel} onChange={e => set('disponivel', e.target.checked)} style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Disponível para pedidos</span>
                </label>
                <div className="modal-foot">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={salvando} style={{ width: 'auto', padding: '12px 28px' }}>{salvando ? <span className="spinner" /> : 'Salvar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
