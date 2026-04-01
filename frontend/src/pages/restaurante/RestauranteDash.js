import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restauranteService, pedidoService } from '../../services';
import './RestauranteDash.css';

const STATUS_COR = {
  aguardando: '#F59E0B', confirmado: '#3B82F6', preparando: '#F97316',
  saiu_para_entrega: '#8B5CF6', entregue: '#10B981', cancelado: '#EF4444',
};

export default function RestauranteDash() {
  const navigate = useNavigate();
  const [restaurantes, setRestaurantes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const dr = await restauranteService.meus();
        const rs = dr.restaurantes || [];
        setRestaurantes(rs);
        if (rs.length > 0) {
          const dp = await pedidoService.doRestaurante(rs[0].id);
          setPedidos(dp.pedidos || []);
        }
      } catch {} finally { setLoading(false); }
    }
    carregar();
  }, []);

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: 64 }}>Carregando...</div>;

  const stats = {
    total: pedidos.length,
    pendentes: pedidos.filter(p => p.status === 'aguardando').length,
    preparando: pedidos.filter(p => ['confirmado', 'preparando'].includes(p.status)).length,
    entregues: pedidos.filter(p => p.status === 'entregue').length,
    faturamento: pedidos.filter(p => p.status === 'entregue').reduce((s, p) => s + p.total, 0),
  };

  return (
    <div className="page">
      <div className="rh-shell">
        <div className="section-heading">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral do seu restaurante, com foco em pedidos, faturamento e ações rápidas.</p>
          </div>
          {restaurantes.length === 0 && (
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/meu-restaurante')}>
              + Cadastrar Restaurante
            </button>
          )}
        </div>

        {restaurantes.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-emoji">🍽️</span>
            <h3>Cadastre seu restaurante</h3>
            <p>Crie o primeiro restaurante para liberar cardápio, pedidos e toda a operação administrativa do Kifome.</p>
            <div style={{ marginTop: 18 }}>
              <button className="btn btn-primary" style={{ width: 'auto', padding: '13px 28px' }} onClick={() => navigate('/meu-restaurante')}>Cadastrar agora</button>
            </div>
          </div>
        ) : (
          <>
            <div className="rest-hero">
              <div className="hero-panel">
                <span className="hero-chip">🍽️ Central Kifome para restaurantes</span>
                <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', margin: '16px 0 10px', letterSpacing: '-0.04em' }}>Controle pedidos, cardápio e operação em um painel mais direto.</h2>
                <p style={{ color: 'rgba(255,255,255,.78)', maxWidth: 560, lineHeight: 1.7 }}>Uma leitura mais parecida com apps de delivery: indicadores no topo, ações rápidas e pedidos recentes logo abaixo.</p>
              </div>

              <div className="card rest-focus-card">
                <div className="section-heading">
                  <h2 style={{ fontSize: 18 }}>Resumo do turno</h2>
                </div>
                <div className="rest-focus-list">
                  <div className="rest-focus-item"><span>⏳</span><div><strong>{stats.pendentes} pedidos pendentes</strong><p>Concentre-se nas próximas confirmações para reduzir o tempo de atendimento.</p></div></div>
                  <div className="rest-focus-item"><span>👨‍🍳</span><div><strong>{stats.preparando} em preparo</strong><p>Veja rapidamente o volume da cozinha e avance os status no momento certo.</p></div></div>
                  <div className="rest-focus-item"><span>💰</span><div><strong>R$ {stats.faturamento.toFixed(2)}</strong><p>Faturamento concluído com leitura simples no topo do painel.</p></div></div>
                </div>
              </div>
            </div>

            <div className="dash-stats">
            {[
              { icon: '📋', label: 'Total pedidos', val: stats.total, cor: '#6C63FF' },
              { icon: '⏳', label: 'Novos / pendentes', val: stats.pendentes, cor: '#F59E0B' },
              { icon: '👨‍🍳', label: 'Em preparo', val: stats.preparando, cor: '#F97316' },
              { icon: '✅', label: 'Entregues hoje', val: stats.entregues, cor: '#10B981' },
              { icon: '💰', label: 'Faturamento', val: `R$ ${stats.faturamento.toFixed(2)}`, cor: '#EC4899' },
            ].map(s => (
              <div key={s.label} className="stat-card card">
                <div className="stat-icon" style={{ background: `${s.cor}18`, color: s.cor }}>{s.icon}</div>
                <div>
                  <span className="stat-val" style={{ color: s.cor }}>{s.val}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              </div>
            ))}
            </div>

            <div>
              <div className="section-heading">
                <h2>Pedidos recentes</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/pedidos')}>Ver todos os pedidos</button>
              </div>
              {pedidos.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-emoji">📋</span>
                  <h3>Nenhum pedido ainda</h3>
                  <p>Assim que os clientes começarem a comprar, os pedidos vão aparecer aqui com leitura rápida e ações claras.</p>
                </div>
              ) : (
                <div className="table-wrap">
              <table className="table">
                <thead><tr><th>#</th><th>Cliente</th><th>Total</th><th>Status</th><th>Horário</th><th>Ações</th></tr></thead>
                <tbody>
                  {pedidos.slice(0, 10).map(p => (
                    <tr key={p.id}>
                      <td><strong>#{p.id}</strong></td>
                      <td>{p.cliente?.nome || '—'}</td>
                      <td><strong>R$ {p.total.toFixed(2)}</strong></td>
                      <td><span className="badge" style={{ background: `${STATUS_COR[p.status]}22`, color: STATUS_COR[p.status] }}>{p.status.replace('_', ' ')}</span></td>
                      <td style={{ color: 'var(--texto-sec)', fontSize: 13 }}>{new Date(p.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td><button className="btn btn-secondary btn-sm" onClick={() => navigate('/pedidos')}>Ver</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
