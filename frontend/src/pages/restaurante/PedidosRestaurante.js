import React, { useState, useEffect, useCallback } from 'react';
import { restauranteService, pedidoService } from '../../services';

const STATUS_FLOW = ['pendente', 'confirmado', 'preparando', 'saiu_entrega', 'entregue'];
const STATUS_LABEL = { pendente: 'Pendente', confirmado: 'Confirmado', preparando: 'Preparando', saiu_entrega: 'Saiu p/ entrega', entregue: 'Entregue', cancelado: 'Cancelado' };
const STATUS_ICON = { pendente: '⏳', confirmado: '✅', preparando: '👨‍🍳', saiu_entrega: '🛵', entregue: '🎉', cancelado: '❌' };
const STATUS_COR = { pendente: '#F59E0B', confirmado: '#3B82F6', preparando: '#F97316', saiu_entrega: '#8B5CF6', entregue: '#10B981', cancelado: '#EF4444' };

export default function PedidosRestaurante() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [atualizando, setAtualizando] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const dr = await restauranteService.meus();
      const rs = dr.restaurantes || [];
      if (rs.length > 0) {
        const dp = await pedidoService.doRestaurante(rs[0].id, filtro ? { status: filtro } : {});
        setPedidos(dp.pedidos || []);
      }
    } catch { setPedidos([]); }
    finally { setLoading(false); }
  }, [filtro]);

  useEffect(() => { carregar(); }, [carregar]);

  // Auto-refresh a cada 30s
  useEffect(() => {
    const t = setInterval(carregar, 30000);
    return () => clearInterval(t);
  }, [carregar]);

  async function avancarStatus(pedido) {
    const idx = STATUS_FLOW.indexOf(pedido.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const proximo = STATUS_FLOW[idx + 1];
    setAtualizando(pedido.id);
    try {
      await pedidoService.atualizarStatus(pedido.id, proximo);
      setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, status: proximo } : p));
    } catch (err) { alert(err.response?.data?.erro || 'Erro ao atualizar'); }
    finally { setAtualizando(null); }
  }

  async function cancelar(pedido) {
    if (!window.confirm('Cancelar este pedido?')) return;
    setAtualizando(pedido.id);
    try {
      await pedidoService.atualizarStatus(pedido.id, 'cancelado');
      setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, status: 'cancelado' } : p));
    } catch (err) { alert(err.response?.data?.erro || 'Erro'); }
    finally { setAtualizando(null); }
  }

  const filtrados = filtro ? pedidos.filter(p => p.status === filtro) : pedidos;
  const pendentes = pedidos.filter(p => p.status === 'pendente').length;

  return (
    <div className="page">
      <div className="hero-panel" style={{ marginBottom: 20 }}>
        <span className="hero-chip">📋 Central de pedidos Kifome</span>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', margin: '16px 0 10px', letterSpacing: '-0.04em' }}>Avance status, filtre etapas e acompanhe a operação sem ruído.</h2>
        <p style={{ color: 'rgba(255,255,255,.78)', maxWidth: 620, lineHeight: 1.7 }}>A tela foi pensada para parecer uma central real de delivery: filtros rápidos, cards claros e ações imediatas por pedido.</p>
      </div>

      <div className="section-heading">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Pedidos {pendentes > 0 && <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', padding: '2px 8px', fontSize: 13, fontWeight: 700, marginLeft: 8 }}>{pendentes}</span>}
          </h1>
          <p className="page-subtitle">Atualizado automaticamente a cada 30 segundos, com foco em leitura rápida e ação imediata.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={carregar}>🔄 Atualizar</button>
      </div>

      <div className="orders-filter-row">
        {[{ v: '', l: 'Todos' }, ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ v, l }))].map(f => (
          <button key={f.v} className="btn btn-sm" style={{ background: filtro === f.v ? 'var(--texto)' : '#fff', color: filtro === f.v ? '#fff' : 'var(--texto-sec)', border: '1.5px solid var(--bordas)' }} onClick={() => setFiltro(f.v)}>
            {STATUS_ICON[f.v] || '📋'} {f.l}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-state"><h3>Carregando pedidos</h3><p>Estamos buscando os pedidos do restaurante e organizando os status para você.</p></div> : filtrados.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-emoji">📋</span>
          <h3>Nenhum pedido {filtro ? `com status "${STATUS_LABEL[filtro]}"` : 'ainda'}</h3>
          <p>A central vai exibir aqui os pedidos com badges, itens e ações rápidas assim que houver movimentação.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtrados.map(p => {
            const cor = STATUS_COR[p.status] || '#888';
            const idx = STATUS_FLOW.indexOf(p.status);
            const proximo = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
            return (
              <div key={p.id} className="card restaurant-order-card" style={{ borderLeftColor: cor }}>
                <div className="restaurant-order-head">
                  <div style={{ flex: 1 }}>
                    <div className="restaurant-order-meta">
                      <strong style={{ fontSize: 18 }}>Pedido #{p.id}</strong>
                      <span className="badge" style={{ background: `${cor}22`, color: cor }}>
                        {STATUS_ICON[p.status]} {STATUS_LABEL[p.status]}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--texto-sec)' }}>
                        {new Date(p.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="restaurant-order-items">
                      {(p.itens || []).map(it => (
                        <span key={it.id} className="restaurant-order-item">
                          {it.quantidade}x {it.produto?.nome} — R$ {(it.preco_unitario * it.quantidade).toFixed(2)}
                        </span>
                      ))}
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--texto-sec)' }}>📍 {p.endereco_entrega}</p>
                    {p.observacao && <p style={{ fontSize: 12, color: '#F97316', marginTop: 4 }}>💬 {p.observacao}</p>}
                  </div>

                  <div className="restaurant-order-side">
                    <strong style={{ color: '#6C63FF' }}>R$ {p.total.toFixed(2)}</strong>
                    <div className="restaurant-order-actions">
                      {proximo && p.status !== 'cancelado' && (
                        <button className="btn btn-sm" disabled={atualizando === p.id}
                          style={{ background: cor, color: '#fff', border: 'none' }}
                          onClick={() => avancarStatus(p)}>
                          {atualizando === p.id ? <span className="spinner" /> : `→ ${STATUS_LABEL[proximo]}`}
                        </button>
                      )}
                      {!['entregue', 'cancelado'].includes(p.status) && (
                        <button className="btn btn-danger btn-sm" disabled={atualizando === p.id} onClick={() => cancelar(p)}>Cancelar</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
