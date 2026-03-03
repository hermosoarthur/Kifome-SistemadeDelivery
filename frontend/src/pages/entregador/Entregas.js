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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Pedidos Disponíveis</h1>
          <p style={{ color: 'var(--texto-sec)', fontSize: 13, marginTop: 4 }}>{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} aguardando entregador</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={carregar}>🔄 Atualizar</button>
      </div>

      {loading ? <p style={{ textAlign: 'center', padding: 40 }}>Carregando...</p> : pedidos.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: 52 }}>🔔</span>
          <h3 style={{ margin: '12px 0 6px' }}>Nenhum pedido disponível</h3>
          <p style={{ color: 'var(--texto-sec)' }}>Aguarde novos pedidos confirmados pelos restaurantes</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pedidos.map(p => (
            <div key={p.id} className="card" style={{ padding: 20, borderLeft: '4px solid #10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ fontSize: 16 }}>Pedido #{p.id}</strong>
                    <span className="badge badge-azul">Confirmado ✅</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>🍽️ {p.restaurante?.nome_fantasia}</p>
                  <p style={{ fontSize: 13, color: 'var(--texto-sec)', marginBottom: 4 }}>📍 Entregar em: {p.endereco_entrega}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {(p.itens || []).map(it => (
                      <span key={it.id} style={{ background: 'var(--fundo)', border: '1px solid var(--bordas)', borderRadius: 7, padding: '3px 8px', fontSize: 11 }}>
                        {it.quantidade}x {it.produto?.nome}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
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

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: 64 }}>Carregando...</div>;

  return (
    <div className="page">
      <h1 className="page-title">Minhas Entregas</h1>
      {entregas.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: 52 }}>🛵</span>
          <h3 style={{ margin: '12px 0 6px' }}>Nenhuma entrega realizada ainda</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entregas.map(e => {
            const cor = STATUS_COR[e.status] || '#888';
            return (
              <div key={e.id} className="card" style={{ padding: 18, borderLeft: `4px solid ${cor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                      <strong>Pedido #{e.id}</strong>
                      <span className="badge" style={{ background: `${cor}22`, color: cor }}>{e.status.replace('_', ' ')}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--texto-sec)' }}>🍽️ {e.restaurante?.nome_fantasia}</p>
                    <p style={{ fontSize: 13, color: 'var(--texto-sec)' }}>📍 {e.endereco_entrega}</p>
                    <p style={{ fontSize: 12, color: 'var(--texto-claro)', marginTop: 4 }}>{new Date(e.criado_em).toLocaleString('pt-BR')}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
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
