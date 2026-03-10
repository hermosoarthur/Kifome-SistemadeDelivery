import React, { useState, useEffect, useCallback } from 'react';
import { pedidoService } from '../../services';

const STATUS_COR = { saiu_entrega: '#8B5CF6', entregue: '#10B981', cancelado: '#EF4444' };

export function PedidosDisponiveis() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aceitando, setAceitando] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { const d = await pedidoService.disponiveis(); setPedidos(d.pedidos || []); }
    catch { setPedidos([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function aceitar(pedido) {
    setAceitando(pedido.id);
    try {
      await pedidoService.atualizarStatus(pedido.id, 'saiu_entrega');
      setPedidos(prev => prev.filter(p => p.id !== pedido.id));
    } catch (err) { alert(err.response?.data?.erro || 'Erro ao aceitar entrega'); }
    finally { setAceitando(null); }
  }

  return (
    <div className="page">
      <div className="hero-panel" style={{ marginBottom: 20 }}>
        <span className="hero-chip">🔔 Novas corridas no Kifome</span>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', margin: '16px 0 10px', letterSpacing: '-0.04em' }}>Veja os pedidos disponíveis e aceite a próxima entrega mais rápido.</h2>
        <p style={{ color: 'rgba(255,255,255,.78)', maxWidth: 620, lineHeight: 1.7 }}>Informações essenciais ficam em destaque para a tomada de decisão: restaurante, endereço, itens e valor.</p>
      </div>

      <div className="section-heading">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Pedidos Disponíveis</h1>
          <p className="page-subtitle">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} aguardando entregador com informação mais objetiva.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={carregar}>🔄 Atualizar</button>
      </div>

      {loading ? <div className="loading-state"><h3>Carregando pedidos disponíveis</h3><p>Estamos buscando novas corridas para você aceitar.</p></div> : pedidos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-emoji">🔔</span>
          <h3>Nenhum pedido disponível</h3>
          <p>Aguarde novos pedidos confirmados pelos restaurantes para aceitar uma nova entrega.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pedidos.map(p => (
            <div key={p.id} className="card restaurant-order-card" style={{ borderLeftColor: '#10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="restaurant-order-meta">
                    <strong style={{ fontSize: 18 }}>Pedido #{p.id}</strong>
                    <span className="badge badge-azul">Confirmado ✅</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🍽️ {p.restaurante?.nome_fantasia}</p>
                  <p style={{ fontSize: 13, color: 'var(--texto-sec)', marginBottom: 4 }}>📍 Entregar em: {p.endereco_entrega}</p>
                  <div className="restaurant-order-items">
                    {(p.itens || []).map(it => (
                      <span key={it.id} className="restaurant-order-item">
                        {it.quantidade}x {it.produto?.nome}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="restaurant-order-side" style={{ flexShrink: 0 }}>
                  <strong style={{ fontSize: 18, color: '#10B981', display: 'block', marginBottom: 12 }}>R$ {p.total.toFixed(2)}</strong>
                  <button className="btn btn-sm" style={{ background: '#10B981', color: '#fff', border: 'none' }} disabled={aceitando === p.id} onClick={() => aceitar(p)}>
                    {aceitando === p.id ? <span className="spinner" /> : '🛵 Aceitar entrega'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MinhasEntregas() {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pedidoService.minhasEntregas()
      .then(d => setEntregas(d.entregas || []))
      .catch(() => setEntregas([]))
      .finally(() => setLoading(false));
  }, []);

  async function concluir(e) {
    try {
      await pedidoService.atualizarStatus(e.id, 'entregue');
      setEntregas(prev => prev.map(x => x.id === e.id ? { ...x, status: 'entregue' } : x));
    } catch (err) { alert(err.response?.data?.erro || 'Erro'); }
  }

  if (loading) return <div className="page"><div className="loading-state"><h3>Carregando entregas</h3><p>Estamos organizando suas corridas em andamento e o histórico recente.</p></div></div>;

  return (
    <div className="page">
      <div className="hero-panel" style={{ marginBottom: 20 }}>
        <span className="hero-chip">🛵 Histórico e entregas em andamento</span>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', margin: '16px 0 10px', letterSpacing: '-0.04em' }}>Acompanhe suas corridas e conclua entregas com menos cliques.</h2>
        <p style={{ color: 'rgba(255,255,255,.78)', maxWidth: 620, lineHeight: 1.7 }}>A leitura da tela foi simplificada para mostrar status, restaurante, endereço e ação principal de forma imediata.</p>
      </div>

      <div className="section-heading">
        <div>
          <h1 className="page-title">Minhas Entregas</h1>
          <p className="page-subtitle">Visualize rapidamente o histórico e conclua entregas em andamento com menos ruído visual.</p>
        </div>
      </div>
      {entregas.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-emoji">🛵</span>
          <h3>Nenhuma entrega realizada ainda</h3>
          <p>Assim que você aceitar corridas, elas aparecerão aqui com status e ações de conclusão.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entregas.map(e => {
            const cor = STATUS_COR[e.status] || '#888';
            return (
              <div key={e.id} className="card restaurant-order-card" style={{ borderLeftColor: cor }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div className="restaurant-order-meta">
                      <strong>Pedido #{e.id}</strong>
                      <span className="badge" style={{ background: `${cor}22`, color: cor }}>{e.status.replace('_', ' ')}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--texto-sec)' }}>🍽️ {e.restaurante?.nome_fantasia}</p>
                    <p style={{ fontSize: 13, color: 'var(--texto-sec)' }}>📍 {e.endereco_entrega}</p>
                    <p style={{ fontSize: 12, color: 'var(--texto-claro)', marginTop: 4 }}>{new Date(e.criado_em).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="restaurant-order-side">
                    <strong style={{ color: cor, fontSize: 18, display: 'block' }}>R$ {e.total.toFixed(2)}</strong>
                    {e.status === 'saiu_entrega' && (
                      <button className="btn btn-sm" style={{ marginTop: 10, background: '#10B981', color: '#fff', border: 'none' }} onClick={() => concluir(e)}>
                        ✅ Confirmar entrega
                      </button>
                    )}
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
