import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restauranteService, pedidoService } from '../../services';
import './RestauranteDash.css';

const STATUS_COR = {
  pendente: '#F59E0B', confirmado: '#3B82F6', preparando: '#F97316',
  saiu_entrega: '#8B5CF6', entregue: '#10B981', cancelado: '#EF4444',
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
    pendentes: pedidos.filter(p => p.status === 'pendente').length,
    preparando: pedidos.filter(p => ['confirmado', 'preparando'].includes(p.status)).length,
    entregues: pedidos.filter(p => p.status === 'entregue').length,
    faturamento: pedidos.filter(p => p.status === 'entregue').reduce((s, p) => s + p.total, 0),
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--texto-sec)', fontSize: 13, marginTop: 4 }}>Visão geral do seu restaurante</p>
        </div>
        {restaurantes.length === 0 && (
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/meu-restaurante')}>
            + Cadastrar Restaurante
          </button>
        )}
      </div>

      {restaurantes.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: 56 }}>🍽️</span>
          <h3 style={{ margin: '16px 0 8px', fontSize: 20 }}>Cadastre seu restaurante</h3>
          <p style={{ color: 'var(--texto-sec)', marginBottom: 20 }}>Comece a receber pedidos agora</p>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '13px 28px' }} onClick={() => navigate('/meu-restaurante')}>Cadastrar agora</button>
        </div>
      ) : (
        <>
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

          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '28px 0 14px' }}>Pedidos recentes</h2>
          {pedidos.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--texto-sec)' }}>Nenhum pedido ainda</div>
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
        </>
      )}
    </div>
  );
}
