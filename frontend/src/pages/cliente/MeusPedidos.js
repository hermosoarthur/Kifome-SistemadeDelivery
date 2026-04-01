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

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pedidoService.meus()
      .then(d => setPedidos(d.pedidos || []))
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, []);

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
            return (
              <div key={p.id} className="card order-card">
                <div className="order-card-head">
                  <div>
                    <div className="order-title-wrap">
                      <span style={{ fontSize: 20 }}>{info.icon}</span>
                      <strong>{p.restaurante?.nome_fantasia || 'Restaurante'}</strong>
                      <span className={info.cls}>{info.label}</span>
                    </div>
                    <p className="order-meta">Pedido #{p.id} • {new Date(p.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    <div className="order-item-list">
                      {(p.itens || []).map(it => (
                        <span key={it.id} className="order-item-chip">
                          {it.quantidade}x {it.produto?.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="order-side">
                    <strong className="order-total">R$ {p.total.toFixed(2)}</strong>
                    <p className="order-address">📍 {p.endereco_entrega}</p>
                  </div>
                </div>

                <div className="order-progress">
                  <div className="order-progress-track">
                    {['aguardando', 'confirmado', 'preparando', 'saiu_para_entrega', 'entregue'].map(s => {
                      const ordem = ['aguardando','confirmado','preparando','saiu_para_entrega','entregue'];
                      const atual = ordem.indexOf(p.status);
                      const este = ordem.indexOf(s);
                      return (
                        <div key={s} className={`order-progress-step ${este <= atual && p.status !== 'cancelado' ? 'active' : ''}`}>
                          <div className="order-progress-dot" />
                          <span className="order-progress-icon">
                            {STATUS_INFO[s]?.icon}
                          </span>
                        </div>
                      );
                    })}
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
