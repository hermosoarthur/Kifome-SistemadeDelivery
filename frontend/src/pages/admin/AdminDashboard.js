import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './Admin.css';

const MOEDA = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const STATUS_LABELS = {
  aguardando:  'Aguardando',
  confirmado:  'Confirmado',
  preparando:  'Preparando',
  saiu_para_entrega: 'Em rota',
  entregue:    'Entregue',
  cancelado:   'Cancelado',
  entregue_aguardando_confirmacao_cliente: 'Aguard. cliente',
};

function KpiCard({ icon, value, label, sub, color }) {
  return (
    <div className="admin-kpi-card" style={{ borderTop: `3px solid ${color || '#e63946'}` }}>
      <span className="admin-kpi-icon">{icon}</span>
      <span className="admin-kpi-value">{value}</span>
      <span className="admin-kpi-label">{label}</span>
      {sub && <span className="admin-kpi-sub">{sub}</span>}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.pedidos), 1);
  return (
    <div className="admin-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="admin-bar-col">
          <span className="admin-bar-value">{d.pedidos}</span>
          <div className="admin-bar" style={{ height: `${Math.round((d.pedidos / max) * 80)}px` }} />
          <span className="admin-bar-label">{d.data.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { authFetch } = useAdminAuth();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await authFetch('/api/admin/dashboard');
      const json = await res.json();
      setDados(json);
    } catch {
      // silencia
    } finally {
      setCarregando(false);
    }
  }, [authFetch]);

  useEffect(() => { carregar(); }, [carregar]);

  if (carregando) return (
    <AdminLayout>
      <div className="admin-loading">Carregando dashboard...</div>
    </AdminLayout>
  );

  const d = dados || {};
  const statusEntries = Object.entries(d.pedidos_por_status || {})
    .sort((a, b) => b[1] - a[1]);

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-sub">Visao geral da plataforma Kifome</p>
        </div>
        <button className="admin-btn-outline" onClick={carregar}>↻ Atualizar</button>
      </div>

      {/* KPIs Faturamento */}
      <div className="admin-kpi-grid">
        <KpiCard icon="💰" value={MOEDA(d.faturamento_hoje)} label="Faturamento Hoje" color="#10b981" />
        <KpiCard icon="📅" value={MOEDA(d.faturamento_mes)} label="Faturamento no Mes" color="#3b82f6" />
        <KpiCard icon="🏆" value={MOEDA(d.faturamento_total)} label="Faturamento Total" color="#8b5cf6" />
        <KpiCard icon="🛍️" value={d.pedidos_hoje ?? '-'} label="Pedidos Hoje" sub={`${d.pedidos_mes ?? 0} no mes`} color="#f59e0b" />
        <KpiCard icon="👥" value={d.usuarios ?? '-'} label="Clientes" color="#e63946" />
        <KpiCard icon="🍽️" value={`${d.restaurantes_ativos ?? '-'}/${d.restaurantes ?? '-'}`} label="Restaurantes Ativos" color="#e63946" />
        <KpiCard icon="🚴" value={d.entregadores ?? '-'} label="Entregadores Ativos" color="#0ea5e9" />
        <KpiCard icon="📦" value={d.pedidos_total ?? '-'} label="Total de Pedidos" color="#6366f1" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Grafico 7 dias */}
        <div className="admin-card">
          <h3 className="admin-card-title">Pedidos por Dia (ultimos 7 dias)</h3>
          {d.pedidos_7dias && <BarChart data={d.pedidos_7dias} />}
          {/* Faturamento por dia */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(d.pedidos_7dias || []).map((dd, i) => (
              <div key={i} style={{ flex: 1, minWidth: 80, background: '#f4f6fb', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{dd.data.slice(5)}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{MOEDA(dd.faturamento)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pedidos por status */}
        <div className="admin-card">
          <h3 className="admin-card-title">Pedidos por Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {statusEntries.length === 0 && <span className="admin-empty">Sem dados</span>}
            {statusEntries.map(([status, qtd]) => {
              const pct = d.pedidos_total ? Math.round((qtd / d.pedidos_total) * 100) : 0;
              const colors = {
                entregue: '#10b981', cancelado: '#ef4444', preparando: '#f59e0b',
                aguardando: '#6366f1', saiu_para_entrega: '#3b82f6', confirmado: '#0ea5e9',
              };
              const cor = colors[status] || '#9ca3af';
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{STATUS_LABELS[status] || status}</span>
                    <span style={{ color: '#6b7280' }}>{qtd} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#f3f4f6', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: 20 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
