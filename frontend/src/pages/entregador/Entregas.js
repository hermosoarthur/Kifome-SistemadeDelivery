import React, { useState, useEffect, useCallback } from 'react';
import { pedidoService } from '../../services';

const STATUS_COR = { saiu_para_entrega: '#8B5CF6', entregue_aguardando_confirmacao_cliente: '#f59e0b', entregue: '#10B981', cancelado: '#EF4444' };
const STATUS_LABEL = {
  saiu_para_entrega: 'Em rota',
  entregue_aguardando_confirmacao_cliente: 'Aguardando confirmacao',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

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
      await pedidoService.atualizarStatus(pedido.id, 'saiu_para_entrega');
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
          <p className="page-subtitle">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} aguardando entregador.</p>
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
  // Mapa: pedidoId -> { aberto: bool, codigo: string, enviando: bool, erro: string, sucesso: bool }
  const [validacaoState, setValidacaoState] = useState({});

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const d = await pedidoService.minhasEntregas();
      setEntregas(d.entregas || []);
    } catch {
      setEntregas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirValidacao(pid) {
    setValidacaoState(prev => ({ ...prev, [pid]: { aberto: true, codigo: '', enviando: false, erro: '', sucesso: false } }));
  }

  function fecharValidacao(pid) {
    setValidacaoState(prev => ({ ...prev, [pid]: { ...prev[pid], aberto: false } }));
  }

  function setCodigo(pid, val) {
    setValidacaoState(prev => ({ ...prev, [pid]: { ...prev[pid], codigo: val, erro: '' } }));
  }

  async function enviarCodigo(pid) {
    const st = validacaoState[pid] || {};
    const codigo = (st.codigo || '').trim();
    if (!codigo || codigo.length !== 6) {
      setValidacaoState(prev => ({ ...prev, [pid]: { ...prev[pid], erro: 'Informe o código de 6 dígitos fornecido pelo cliente.' } }));
      return;
    }
    setValidacaoState(prev => ({ ...prev, [pid]: { ...prev[pid], enviando: true, erro: '' } }));
    try {
      await pedidoService.validarEntrega(pid, codigo);
      setValidacaoState(prev => ({ ...prev, [pid]: { ...prev[pid], enviando: false, sucesso: true, aberto: false } }));
      await carregar();
    } catch (err) {
      const msg = err.response?.data?.erro || 'Código inválido ou expirado.';
      setValidacaoState(prev => ({ ...prev, [pid]: { ...prev[pid], enviando: false, erro: msg } }));
    }
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
          <p className="page-subtitle">Visualize rapidamente o histórico e conclua entregas em andamento.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={carregar}>🔄 Atualizar</button>
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
            const label = STATUS_LABEL[e.status] || e.status.replace(/_/g, ' ');
            const vst = validacaoState[e.id] || {};
            const emRota = e.status === 'saiu_para_entrega';
            const aguardando = e.status === 'entregue_aguardando_confirmacao_cliente';
            return (
              <div key={e.id} className="card restaurant-order-card" style={{ borderLeftColor: cor }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div className="restaurant-order-meta">
                      <strong>Pedido #{e.id}</strong>
                      <span className="badge" style={{ background: `${cor}22`, color: cor }}>{label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--texto-sec)' }}>🍽️ {e.restaurante?.nome_fantasia}</p>
                    <p style={{ fontSize: 13, color: 'var(--texto-sec)' }}>📍 {e.endereco_entrega}</p>
                    <p style={{ fontSize: 12, color: 'var(--texto-claro)', marginTop: 4 }}>{new Date(e.criado_em).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="restaurant-order-side">
                    <strong style={{ color: cor, fontSize: 18, display: 'block', marginBottom: 12 }}>R$ {e.total.toFixed(2)}</strong>

                    {/* Botão validar entrega: entregador insere código do cliente */}
                    {emRota && (
                      <button
                        className="btn btn-sm"
                        style={{ background: '#8B5CF6', color: '#fff', border: 'none' }}
                        onClick={() => abrirValidacao(e.id)}
                      >
                        🔑 Validar entrega
                      </button>
                    )}

                    {aguardando && (
                      <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>⏳ Aguardando confirmacao do cliente</p>
                    )}
                  </div>
                </div>

                {/* Painel de inserção do código */}
                {emRota && vst.aberto && (
                  <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--fundo-alt)', borderRadius: 10 }}>
                    <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>🔑 Insira o código de confirmação informado pelo cliente:</p>
                    <p style={{ fontSize: 12, color: 'var(--texto-sec)', marginBottom: 10 }}>
                      O cliente recebeu o código via notificação quando o pedido saiu para entrega.
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={vst.codigo || ''}
                        onChange={ev => setCodigo(e.id, ev.target.value.replace(/\D/g, ''))}
                        style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--borda)', fontSize: 20, letterSpacing: 6, fontWeight: 700, textAlign: 'center' }}
                        disabled={vst.enviando}
                      />
                      <button
                        className="btn btn-sm"
                        style={{ background: '#8B5CF6', color: '#fff', border: 'none' }}
                        onClick={() => enviarCodigo(e.id)}
                        disabled={vst.enviando}
                      >
                        {vst.enviando ? 'Validando...' : 'Confirmar'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => fecharValidacao(e.id)}
                        disabled={vst.enviando}
                      >
                        Cancelar
                      </button>
                    </div>
                    {vst.erro && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>⚠️ {vst.erro}</p>}
                  </div>
                )}

                {vst.sucesso && (
                  <div style={{ marginTop: 10, padding: '10px 14px', background: '#d1fae5', borderRadius: 8, color: '#065f46', fontWeight: 500, fontSize: 13 }}>
                    ✅ Entrega validada! Aguardando confirmação do cliente.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
