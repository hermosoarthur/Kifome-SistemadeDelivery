import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './Admin.css';

const MOEDA = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const PERIODOS = [
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
  { label: '90 dias', value: '90' },
];

// ── Relatorio 1: Faturamento por Restaurante ─────────────────────────────────
function RelatorioFaturamento({ authFetch }) {
  const [periodo, setPeriodo] = useState('30');
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await authFetch(`/api/admin/relatorios/faturamento?periodo=${periodo}`);
      const data = await res.json();
      setDados(data);
    } finally {
      setCarregando(false);
    }
  }, [authFetch, periodo]);

  useEffect(() => { carregar(); }, [carregar]);

  const restaurantes = dados?.restaurantes || [];
  const maxFat = Math.max(...restaurantes.map(r => r.faturamento), 1);

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 className="admin-card-title" style={{ margin: 0 }}>📊 Relatorio 1 — Faturamento por Restaurante</h3>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
            Receita gerada por cada restaurante na plataforma
          </p>
        </div>
        <div className="admin-period-tabs">
          {PERIODOS.map(p => (
            <button
              key={p.value}
              className={periodo === p.value ? 'active' : ''}
              onClick={() => setPeriodo(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {dados && (
        <div className="admin-stat-row">
          <div className="admin-stat-item">
            <strong>{MOEDA(dados.faturamento_total)}</strong>
            <span>Faturamento Total no Periodo</span>
          </div>
          <div className="admin-stat-item">
            <strong>{restaurantes.length}</strong>
            <span>Restaurantes com Pedidos</span>
          </div>
          <div className="admin-stat-item">
            <strong>{MOEDA(restaurantes.reduce((s, r) => s + r.ticket_medio, 0) / (restaurantes.length || 1))}</strong>
            <span>Ticket Medio Geral</span>
          </div>
          <div className="admin-stat-item">
            <strong style={{ color: '#ef4444' }}>
              {restaurantes.reduce((s, r) => s + r.cancelados, 0)}
            </strong>
            <span>Pedidos Cancelados</span>
          </div>
        </div>
      )}

      {carregando ? (
        <div className="admin-loading">Carregando relatorio...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Restaurante</th>
                <th>Categoria</th>
                <th>Pedidos</th>
                <th>Entregues</th>
                <th>Cancelados</th>
                <th>Ticket Medio</th>
                <th>Faturamento</th>
                <th>Barra</th>
              </tr>
            </thead>
            <tbody>
              {restaurantes.length === 0 && (
                <tr><td colSpan={9} className="admin-empty">Nenhum dado no periodo</td></tr>
              )}
              {restaurantes.map((r, i) => (
                <tr key={r.restaurante_id}>
                  <td style={{ color: '#6b7280', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{r.restaurante_nome}</td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{r.restaurante_categoria || '-'}</td>
                  <td>{r.total_pedidos}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>{r.entregues}</td>
                  <td style={{ color: r.cancelados > 0 ? '#ef4444' : '#9ca3af', fontWeight: 600 }}>{r.cancelados}</td>
                  <td>{MOEDA(r.ticket_medio)}</td>
                  <td style={{ fontWeight: 700, color: '#1f2937' }}>{MOEDA(r.faturamento)}</td>
                  <td style={{ width: 120 }}>
                    <div style={{ height: 8, background: '#f3f4f6', borderRadius: 20 }}>
                      <div style={{
                        width: `${Math.round((r.faturamento / maxFat) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(to right, #e63946, #ff8fa3)',
                        borderRadius: 20
                      }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Relatorio 3: Produtos Mais Vendidos ──────────────────────────────────────
function RelatorioProdutos({ authFetch }) {
  const [periodo, setPeriodo] = useState('30');
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await authFetch(`/api/admin/relatorios/produtos-mais-vendidos?periodo=${periodo}&limit=20`);
      const data = await res.json();
      setDados(data);
    } finally {
      setCarregando(false);
    }
  }, [authFetch, periodo]);

  useEffect(() => { carregar(); }, [carregar]);

  const produtos = dados?.produtos || [];
  const maxVendido = Math.max(...produtos.map(p => p.total_vendido), 1);

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 className="admin-card-title" style={{ margin: 0 }}>🏆 Relatorio 2 — Produtos Mais Vendidos</h3>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
            Ranking de itens mais pedidos na plataforma (pedidos nao cancelados)
          </p>
        </div>
        <div className="admin-period-tabs">
          {PERIODOS.map(p => (
            <button key={p.value} className={periodo === p.value ? 'active' : ''} onClick={() => setPeriodo(p.value)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {dados && (
        <div className="admin-stat-row">
          <div className="admin-stat-item">
            <strong>{produtos.reduce((s, p) => s + p.total_vendido, 0)}</strong>
            <span>Itens Vendidos no Periodo</span>
          </div>
          <div className="admin-stat-item">
            <strong>{MOEDA(produtos.reduce((s, p) => s + p.receita, 0))}</strong>
            <span>Receita Total dos Itens</span>
          </div>
          <div className="admin-stat-item">
            <strong>{produtos[0]?.produto_nome || '-'}</strong>
            <span>Produto #1 Mais Vendido</span>
          </div>
        </div>
      )}

      {carregando ? (
        <div className="admin-loading">Carregando relatorio...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Produto</th>
                <th>Restaurante</th>
                <th>Preco Unit.</th>
                <th>Unid. Vendidas</th>
                <th>Receita</th>
                <th>Popularidade</th>
              </tr>
            </thead>
            <tbody>
              {produtos.length === 0 && (
                <tr><td colSpan={7} className="admin-empty">Nenhum dado no periodo</td></tr>
              )}
              {produtos.map((p, i) => (
                <tr key={p.produto_id}>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: i === 0 ? '#f59e0b' : i === 1 ? '#6b7280' : i === 2 ? '#92400e' : '#9ca3af',
                      fontSize: 15,
                    }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.produto_imagem && (
                        <img src={p.produto_imagem} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      )}
                      <span style={{ fontWeight: 600 }}>{p.produto_nome}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{p.restaurante_nome}</td>
                  <td>{MOEDA(p.produto_preco)}</td>
                  <td style={{ fontWeight: 700 }}>{p.total_vendido} un.</td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>{MOEDA(p.receita)}</td>
                  <td style={{ width: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 20 }}>
                        <div style={{
                          width: `${Math.round((p.total_vendido / maxVendido) * 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                          borderRadius: 20,
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#6b7280', minWidth: 30 }}>
                        {Math.round((p.total_vendido / maxVendido) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Relatorio 4: Taxa de Cancelamento por Restaurante ────────────────────────
function RelatorioCancelamentos({ authFetch }) {
  const [periodo, setPeriodo] = useState('30');
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await authFetch(`/api/admin/relatorios/cancelamentos?periodo=${periodo}`);
      const data = await res.json();
      setDados(data);
    } finally {
      setCarregando(false);
    }
  }, [authFetch, periodo]);

  useEffect(() => { carregar(); }, [carregar]);

  const restaurantes = dados?.restaurantes || [];

  const corTaxa = (taxa) => {
    if (taxa <= 5) return '#10b981';
    if (taxa <= 15) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 className="admin-card-title" style={{ margin: 0 }}>⚠️ Relatorio 3 — Taxa de Cancelamento por Restaurante</h3>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
            Identifica restaurantes que mais cancelam pedidos (verde ≤5% · amarelo ≤15% · vermelho &gt;15%)
          </p>
        </div>
        <div className="admin-period-tabs">
          {PERIODOS.map(p => (
            <button key={p.value} className={periodo === p.value ? 'active' : ''} onClick={() => setPeriodo(p.value)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {dados && (
        <div className="admin-stat-row">
          <div className="admin-stat-item">
            <strong style={{ color: dados.media_taxa_cancelamento > 15 ? '#ef4444' : '#10b981' }}>
              {dados.media_taxa_cancelamento}%
            </strong>
            <span>Media de Cancelamento</span>
          </div>
          <div className="admin-stat-item">
            <strong style={{ color: '#ef4444' }}>
              {restaurantes.filter(r => r.taxa_cancelamento > 15).length}
            </strong>
            <span>Restaurantes Criticos (&gt;15%)</span>
          </div>
          <div className="admin-stat-item">
            <strong>{restaurantes.reduce((s, r) => s + r.cancelados, 0)}</strong>
            <span>Total de Cancelamentos</span>
          </div>
          <div className="admin-stat-item">
            <strong>{restaurantes.reduce((s, r) => s + r.total_pedidos, 0)}</strong>
            <span>Total de Pedidos no Periodo</span>
          </div>
        </div>
      )}

      {carregando ? (
        <div className="admin-loading">Carregando relatorio...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Restaurante</th>
                <th>Total Pedidos</th>
                <th>Entregues</th>
                <th>Cancelados</th>
                <th>Faturamento</th>
                <th>Taxa Cancelamento</th>
              </tr>
            </thead>
            <tbody>
              {restaurantes.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">Nenhum dado no periodo</td></tr>
              )}
              {restaurantes.map(r => (
                <tr key={r.restaurante_id}>
                  <td style={{ fontWeight: 600 }}>{r.restaurante_nome}</td>
                  <td>{r.total_pedidos}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>{r.entregues}</td>
                  <td style={{ color: r.cancelados > 0 ? '#ef4444' : '#9ca3af', fontWeight: 700 }}>{r.cancelados}</td>
                  <td>{MOEDA(r.faturamento)}</td>
                  <td style={{ width: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 20 }}>
                        <div style={{
                          width: `${Math.min(r.taxa_cancelamento, 100)}%`,
                          height: '100%',
                          background: corTaxa(r.taxa_cancelamento),
                          borderRadius: 20,
                          transition: 'width .3s',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, minWidth: 40, color: corTaxa(r.taxa_cancelamento) }}>
                        {r.taxa_cancelamento}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Relatorio 5: Retencao de Clientes ────────────────────────────────────────
function RelatorioRetencao({ authFetch }) {
  const [periodo, setPeriodo] = useState('30');
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await authFetch(`/api/admin/relatorios/retencao-clientes?periodo=${periodo}`);
      const data = await res.json();
      setDados(data);
    } finally {
      setCarregando(false);
    }
  }, [authFetch, periodo]);

  useEffect(() => { carregar(); }, [carregar]);

  const top = dados?.top_clientes || [];
  const freq = dados?.frequencia || {};

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 className="admin-card-title" style={{ margin: 0 }}>🔄 Relatorio 4 — Retencao de Clientes</h3>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
            Clientes novos vs recorrentes e frequencia de pedidos no periodo
          </p>
        </div>
        <div className="admin-period-tabs">
          {PERIODOS.map(p => (
            <button key={p.value} className={periodo === p.value ? 'active' : ''} onClick={() => setPeriodo(p.value)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {dados && (
        <>
          <div className="admin-stat-row">
            <div className="admin-stat-item">
              <strong>{dados.total_clientes}</strong>
              <span>Clientes Ativos no Periodo</span>
            </div>
            <div className="admin-stat-item">
              <strong style={{ color: '#3b82f6' }}>{dados.novos} <small style={{ fontSize: 13 }}>({dados.pct_novos}%)</small></strong>
              <span>Clientes Novos</span>
            </div>
            <div className="admin-stat-item">
              <strong style={{ color: '#10b981' }}>{dados.recorrentes} <small style={{ fontSize: 13 }}>({dados.pct_recorrentes}%)</small></strong>
              <span>Clientes Recorrentes</span>
            </div>
          </div>

          {/* Grafico de pizza simplificado (barras horizontais) */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Frequencia de Pedidos por Cliente</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '1 pedido (experimentou)', val: freq['1_pedido'] || 0, cor: '#6366f1' },
                { label: '2 a 5 pedidos (regular)', val: freq['2_a_5'] || 0, cor: '#3b82f6' },
                { label: 'Mais de 5 pedidos (fiel)', val: freq['mais_de_5'] || 0, cor: '#10b981' },
              ].map(item => {
                const pct = dados.total_clientes ? Math.round((item.val / dados.total_clientes) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                      <span style={{ color: '#374151' }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: item.cor }}>{item.val} clientes ({pct}%)</span>
                    </div>
                    <div style={{ height: 10, background: '#f3f4f6', borderRadius: 20 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: item.cor, borderRadius: 20, transition: 'width .4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {carregando ? (
        <div className="admin-loading">Carregando relatorio...</div>
      ) : (
        <>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Top 20 Clientes por Gasto</p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Pedidos no Periodo</th>
                  <th>Gasto no Periodo</th>
                  <th>Perfil</th>
                </tr>
              </thead>
              <tbody>
                {top.length === 0 && (
                  <tr><td colSpan={5} className="admin-empty">Nenhum dado no periodo</td></tr>
                )}
                {top.map((c, i) => (
                  <tr key={c.cliente_id}>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{c.cliente_nome}</td>
                    <td>{c.pedidos_periodo} pedidos</td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{MOEDA(c.gasto_periodo)}</td>
                    <td>
                      <span className={`admin-badge ${c.e_recorrente ? 'badge-entregue' : 'badge-aguardando'}`}>
                        {c.e_recorrente ? '🔄 Recorrente' : '🆕 Novo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Pagina Principal ──────────────────────────────────────────────────────────
export default function AdminRelatorios() {
  const { authFetch } = useAdminAuth();

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Relatorios</h1>
          <p className="admin-page-sub">Analise de faturamento e performance da plataforma</p>
        </div>
      </div>

      <RelatorioFaturamento authFetch={authFetch} />
      <RelatorioProdutos authFetch={authFetch} />
      <RelatorioCancelamentos authFetch={authFetch} />
      <RelatorioRetencao authFetch={authFetch} />
    </AdminLayout>
  );
}
