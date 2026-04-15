import React, { useState, useEffect } from 'react';
import { pedidoService } from '../../services';

const STATUS_INFO = {
  aguardando: { label: 'Aguardando', cls: 'badge status-pendente', icon: '⏳' },
  confirmado: { label: 'Confirmado', cls: 'badge status-confirmado', icon: '✅' },
  preparando: { label: 'Preparando', cls: 'badge status-preparando', icon: '👨‍🍳' },
  saiu_para_entrega: { label: 'Saiu para entrega', cls: 'badge status-saiu_entrega', icon: '🛵' },
  entregue: { label: 'Entregue', cls: 'badge status-entregue', icon: '🎉' },
  cancelado: { label: 'Cancelado', cls: 'badge status-cancelado', icon: '❌' },
};

function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hover || value) ? 'active' : ''}`}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          disabled={disabled}
          aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [avaliacaoAberta, setAvaliacaoAberta] = useState(null);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [avaliacaoMsg, setAvaliacaoMsg] = useState(null);

  const ordemStatus = ['aguardando', 'confirmado', 'preparando', 'saiu_para_entrega', 'entregue'];

  function formatarData(valor) {
    if (!valor) return 'Data indisponível';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return 'Data indisponível';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  async function carregarPedidos({ silencioso = false } = {}) {
    if (silencioso) setAtualizando(true);
    else setLoading(true);

    try {
      const d = await pedidoService.meus();
      setPedidos(d.pedidos || []);
    } catch {
      setPedidos([]);
    } finally {
      if (silencioso) setAtualizando(false);
      else setLoading(false);
    }
  }

  useEffect(() => {
    carregarPedidos();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      carregarPedidos({ silencioso: true });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function abrirAvaliacao(pedidoId) {
    setAvaliacaoAberta(pedidoId);
    setNota(0);
    setComentario('');
    setAvaliacaoMsg(null);
  }

  function fecharAvaliacao() {
    setAvaliacaoAberta(null);
    setNota(0);
    setComentario('');
    setAvaliacaoMsg(null);
  }

  async function enviarAvaliacao(pedidoId) {
    if (nota < 1 || nota > 5) {
      setAvaliacaoMsg({ tipo: 'erro', texto: 'Selecione uma nota de 1 a 5 estrelas.' });
      return;
    }
    setEnviandoAvaliacao(true);
    setAvaliacaoMsg(null);
    try {
      await pedidoService.avaliar(pedidoId, nota, comentario);
      setAvaliacaoMsg({ tipo: 'sucesso', texto: 'Avaliação enviada com sucesso!' });
      setPedidos(prev => prev.map(p => p.id === pedidoId
        ? { ...p, avaliacao_nota: nota, avaliacao_comentario: comentario }
        : p
      ));
      setTimeout(() => fecharAvaliacao(), 1500);
    } catch (err) {
      const msg = err.response?.data?.erro || 'Erro ao enviar avaliação.';
      setAvaliacaoMsg({ tipo: 'erro', texto: msg });
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  if (loading) return <div className="page"><div className="loading-state"><h3>Carregando seus pedidos</h3><p>Estamos organizando sua linha do tempo de pedidos para você acompanhar tudo em um só lugar.</p></div></div>;

  return (
    <div className="page">
      <div className="hero-panel" style={{ marginBottom: 20 }}>
        <span className="hero-chip">📦 Acompanhe seus pedidos no Kifome</span>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', margin: '16px 0 10px', letterSpacing: '-0.04em' }}>Tudo o que você pediu aparece aqui com status e progresso claros.</h2>
        <p style={{ color: 'rgba(255,255,255,.78)', maxWidth: 620, lineHeight: 1.7 }}>Uma visualização mais parecida com apps de delivery: restaurante, itens, endereço, total e andamento do pedido no mesmo fluxo.</p>
      </div>

      <div className="section-heading">
        <div>
          <h1 className="page-title">Meus Pedidos</h1>
          <p className="page-subtitle">Acompanhe status e progresso de cada pedido</p>
        </div>
        <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => carregarPedidos({ silencioso: true })} disabled={atualizando}>
          {atualizando ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {pedidos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-emoji">📦</span>
          <h3>Nenhum pedido ainda</h3>
          <p>Explore os restaurantes do Kifome e faça seu primeiro pedido para ver o acompanhamento completo aqui.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pedidos.map(p => {
            const info = STATUS_INFO[p.status] || STATUS_INFO.aguardando;
            const atual = ordemStatus.indexOf(p.status);
            const total = Number(p.total || 0);
            return (
              <div key={p.id} className="card order-card">
                <div className="order-card-head">
                  <div>
                    <div className="order-title-wrap">
                      <span style={{ fontSize: 20 }}>{info.icon}</span>
                      <strong>{p.restaurante?.nome_fantasia || 'Restaurante'}</strong>
                      <span className={info.cls}>{info.label}</span>
                    </div>
                    <p className="order-meta">Pedido #{p.id} • {formatarData(p.criado_em)}</p>
                    <div className="order-item-list">
                      {(p.itens || []).map(it => (
                        <span key={it.id} className="order-item-chip">
                          {it.quantidade}x {it.produto?.nome || 'Item'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="order-side">
                    <strong className="order-total">R$ {total.toFixed(2)}</strong>
                    <p className="order-address">📍 {p.endereco_entrega || 'Endereço não informado'}</p>
                  </div>
                </div>

                <div className="order-progress">
                  <div className="order-progress-track" role="progressbar" aria-label={`Status: ${info.label}`} aria-valuenow={atual + 1} aria-valuemin={1} aria-valuemax={5}>
                    {['aguardando', 'confirmado', 'preparando', 'saiu_para_entrega', 'entregue'].map(s => {
                      const este = ordemStatus.indexOf(s);
                      return (
                        <div key={s} className={`order-progress-step ${este <= atual && p.status !== 'cancelado' ? 'active' : ''}`} title={STATUS_INFO[s]?.label}>
                          <div className="order-progress-dot" />
                          <span className="order-progress-icon">
                            {STATUS_INFO[s]?.icon}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Avaliação do Pedido */}
                {p.status === 'entregue' && (
                  <div className="order-avaliacao">
                    {p.avaliacao_nota ? (
                      <div className="avaliacao-feita">
                        <span className="avaliacao-feita-label">Sua avaliação</span>
                        <div className="star-rating disabled">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={`star-btn ${star <= p.avaliacao_nota ? 'active' : ''}`}>★</span>
                          ))}
                        </div>
                        {p.avaliacao_comentario && (
                          <p className="avaliacao-comentario-exibido">"{p.avaliacao_comentario}"</p>
                        )}
                      </div>
                    ) : avaliacaoAberta === p.id ? (
                      <div className="avaliacao-form">
                        <p className="avaliacao-titulo">Como foi seu pedido?</p>
                        <StarRating value={nota} onChange={setNota} disabled={enviandoAvaliacao} />
                        <div className="input-box" style={{ marginTop: 10 }}>
                          <textarea
                            placeholder="Deixe um comentário (opcional)"
                            value={comentario}
                            onChange={e => setComentario(e.target.value)}
                            maxLength={500}
                            disabled={enviandoAvaliacao}
                            rows={2}
                          />
                        </div>
                        {avaliacaoMsg && (
                          <div className={`alert alert-${avaliacaoMsg.tipo}`} style={{ marginTop: 8 }}>
                            {avaliacaoMsg.texto}
                          </div>
                        )}
                        <div className="avaliacao-actions">
                          <button className="btn btn-ghost btn-sm" onClick={fecharAvaliacao} disabled={enviandoAvaliacao}>
                            Cancelar
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={() => enviarAvaliacao(p.id)} disabled={enviandoAvaliacao || nota === 0}>
                            {enviandoAvaliacao ? 'Enviando...' : 'Enviar avaliação'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-secondary btn-sm avaliacao-btn" onClick={() => abrirAvaliacao(p.id)}>
                        ⭐ Avaliar pedido
                      </button>
                    )}
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
