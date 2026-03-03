import React, { useState, useEffect } from 'react';
import { pedidoService } from '../../services';

const STATUS_INFO = {
  pendente: { label: 'Pendente', cls: 'badge status-pendente', icon: '⏳' },
  confirmado: { label: 'Confirmado', cls: 'badge status-confirmado', icon: '✅' },
  preparando: { label: 'Preparando', cls: 'badge status-preparando', icon: '👨‍🍳' },
  saiu_entrega: { label: 'Saiu para entrega', cls: 'badge status-saiu_entrega', icon: '🛵' },
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

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: 64 }}><span className="spinner" style={{ width: 32, height: 32, borderTopColor: 'var(--primaria)', borderColor: 'var(--bordas)', borderWidth: 3 }} /></div>;

  return (
    <div className="page">
      <h1 className="page-title">Meus Pedidos</h1>
      {pedidos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <span style={{ fontSize: 52 }}>📦</span>
          <h3 style={{ margin: '12px 0 6px' }}>Nenhum pedido ainda</h3>
          <p style={{ color: 'var(--texto-sec)' }}>Explore os restaurantes e faça seu primeiro pedido!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pedidos.map(p => {
            const info = STATUS_INFO[p.status] || STATUS_INFO.pendente;
            return (
              <div key={p.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 20 }}>{info.icon}</span>
                      <strong style={{ fontSize: 16 }}>{p.restaurante?.nome_fantasia || 'Restaurante'}</strong>
                      <span className={info.cls}>{info.label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--texto-sec)', marginBottom: 8 }}>Pedido #{p.id} • {new Date(p.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(p.itens || []).map(it => (
                        <span key={it.id} style={{ background: 'var(--fundo)', border: '1px solid var(--bordas)', borderRadius: 8, padding: '3px 9px', fontSize: 12 }}>
                          {it.quantidade}x {it.produto?.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: 18, color: 'var(--primaria)' }}>R$ {p.total.toFixed(2)}</strong>
                    <p style={{ fontSize: 12, color: 'var(--texto-sec)', marginTop: 3 }}>📍 {p.endereco_entrega}</p>
                  </div>
                </div>

                {/* Barra de progresso do pedido */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    {['pendente', 'confirmado', 'preparando', 'saiu_entrega', 'entregue'].map(s => {
                      const ordem = ['pendente','confirmado','preparando','saiu_entrega','entregue'];
                      const atual = ordem.indexOf(p.status);
                      const este = ordem.indexOf(s);
                      return (
                        <div key={s} style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', margin: '0 auto 3px', background: este <= atual && p.status !== 'cancelado' ? 'var(--primaria)' : 'var(--bordas)' }} />
                          <span style={{ fontSize: 9, color: este <= atual && p.status !== 'cancelado' ? 'var(--primaria)' : 'var(--texto-claro)' }}>
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
