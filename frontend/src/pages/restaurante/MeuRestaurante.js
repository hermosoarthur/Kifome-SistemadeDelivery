import React, { useState, useEffect, useCallback } from 'react';
import { restauranteService } from '../../services';

const CATS = ['Italiana','Japonesa','Brasileira','Árabe','Chinesa','Americana','Mexicana','Fitness','Pizzaria','Hamburgeria','Açaí'];

export default function MeuRestaurante() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ nome_fantasia: '', descricao: '', endereco: '', telefone: '', categoria: '', imagem_url: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try { const d = await restauranteService.meus(); setRestaurantes(d.restaurantes || []); }
    catch { setRestaurantes([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirModal(item = null) {
    setEditItem(item);
    setForm(item ? { nome_fantasia: item.nome_fantasia || '', descricao: item.descricao || '', endereco: item.endereco || '', telefone: item.telefone || '', categoria: item.categoria || '', imagem_url: item.imagem_url || '' } : { nome_fantasia: '', descricao: '', endereco: '', telefone: '', categoria: '', imagem_url: '' });
    setErro(''); setModal(true);
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome_fantasia.trim()) { setErro('Nome é obrigatório'); return; }
    if (!form.endereco.trim()) { setErro('Endereço é obrigatório'); return; }
    setSalvando(true); setErro('');
    try {
      if (editItem?.id) await restauranteService.atualizar(editItem.id, form);
      else await restauranteService.criar(form);
      setModal(false); carregar();
      setMsg(editItem ? 'Restaurante atualizado!' : 'Restaurante criado!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setSalvando(false); }
  }

  async function excluir(r) {
    if (!window.confirm(`Excluir "${r.nome_fantasia}"?`)) return;
    try { await restauranteService.deletar(r.id); setRestaurantes(p => p.filter(x => x.id !== r.id)); }
    catch (err) { alert(err.response?.data?.erro || 'Erro ao excluir'); }
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="page">
      <div className="hero-panel" style={{ marginBottom: 20 }}>
        <span className="hero-chip">🏪 Identidade do seu negócio no Kifome</span>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', margin: '16px 0 10px', letterSpacing: '-0.04em' }}>Organize os dados do restaurante com uma apresentação mais forte e comercial.</h2>
        <p style={{ color: 'rgba(255,255,255,.78)', maxWidth: 620, lineHeight: 1.7 }}>Nome, endereço, categoria e imagem ficam centralizados aqui para deixar sua operação pronta para cardápio e pedidos.</p>
      </div>

      <div className="section-heading">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Meu Restaurante</h1>
          <p className="page-subtitle">Cadastre, edite e organize os dados do seu restaurante com aparência mais profissional.</p>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => abrirModal()}>+ Novo Restaurante</button>
      </div>

      {msg && <div className="alert alert-sucesso">{msg}</div>}

      {loading ? <div className="loading-state"><h3>Carregando restaurantes</h3><p>Estamos buscando os dados do seu negócio para montar o painel.</p></div> : restaurantes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-emoji">🍽️</span>
          <h3>Nenhum restaurante cadastrado</h3>
          <p>Cadastre seu primeiro restaurante para ativar cardápio, pedidos e toda a experiência administrativa.</p>
          <div style={{ marginTop: 18 }}><button className="btn btn-primary" style={{ width: 'auto', padding: '12px 28px' }} onClick={() => abrirModal()}>+ Cadastrar agora</button></div>
        </div>
      ) : (
        <div className="rest-card-list">
          {restaurantes.map(r => (
            <div key={r.id} className="card rest-entity-card">
              <div className="rest-entity-thumb">🍽️</div>
              <div className="rest-entity-content">
                <div className="rest-entity-meta">
                  <strong>{r.nome_fantasia}</strong>
                  <span className={`badge ${r.status === 'aprovado' ? 'badge-verde' : 'badge-amarelo'}`}>{r.status}</span>
                  {r.categoria && <span className="badge badge-cinza">{r.categoria}</span>}
                </div>
                <p className="rest-entity-line">📍 {r.endereco}</p>
                {r.telefone && <p className="rest-entity-line">📞 {r.telefone}</p>}
              </div>
              <div className="rest-entity-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => abrirModal(r)}>✏️ Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => excluir(r)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-bg" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editItem?.id ? 'Editar Restaurante' : 'Novo Restaurante'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {erro && <div className="alert alert-erro">{erro}</div>}
              <form onSubmit={salvar}>
                <div className="form-row">
                  <div className="form-group"><label>Nome fantasia *</label><div className="input-box"><input type="text" placeholder="Ex: Pizzaria do João" value={form.nome_fantasia} onChange={e => set('nome_fantasia', e.target.value)} /></div></div>
                  <div className="form-group"><label>Telefone</label><div className="input-box"><input type="tel" placeholder="(11) 99999-9999" value={form.telefone} onChange={e => set('telefone', e.target.value)} /></div></div>
                </div>
                <div className="form-group"><label>Endereço *</label><div className="input-box"><input type="text" placeholder="Rua, número, bairro" value={form.endereco} onChange={e => set('endereco', e.target.value)} /></div></div>
                <div className="form-group"><label>Descrição</label><div className="input-box"><textarea placeholder="Conte sobre seu restaurante..." value={form.descricao} onChange={e => set('descricao', e.target.value)} /></div></div>
                <div className="form-row">
                  <div className="form-group"><label>Categoria</label><div className="input-box"><select value={form.categoria} onChange={e => set('categoria', e.target.value)}><option value="">Selecione...</option>{CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
                  <div className="form-group"><label>URL da imagem</label><div className="input-box"><input type="url" placeholder="https://..." value={form.imagem_url} onChange={e => set('imagem_url', e.target.value)} /></div></div>
                </div>
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
