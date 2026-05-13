import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './Admin.css';

const MOEDA = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const STATUS_LIST = [
  '', 'aguardando', 'confirmado', 'preparando',
  'saiu_para_entrega', 'entregue', 'cancelado',
];

const BADGE_CLASS = {
  aguardando: 'badge-aguardando', confirmado: 'badge-confirmado',
  preparando: 'badge-preparando', saiu_para_entrega: 'badge-saiu_para_entrega',
  entregue: 'badge-entregue', cancelado: 'badge-cancelado',
};

export default function AdminPedidos() {
  const { authFetch } = useAdminAuth();
  const [pedidos, setPedidos] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [status, setStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(null);

  const carregar = useCallback(async (pag = pagina) => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({ pagina: pag, por_pagina: 20 });
      if (status) params.set('status', status);
      if (busca) params.set('busca', busca);
      const res = await authFetch(`/api/admin/pedidos?${params}`);
      const data = await res.json();
      setPedidos(data.pedidos || []);
      setTotal(data.total || 0);
      setPaginas(data.paginas || 1);
    } finally {
      setCarregando(false);
    }
  }, [authFetch, pagina, status, busca]);

  useEffect(() => { carregar(pagina); }, [pagina, status]); // eslint-disable-line

  const handleBusca = (e) => {
    e.preventDefault();
    setPagina(1);
    carregar(1);
  };

  const atualizarStatus = async (pid, novoStatus) => {
    setAtualizando(pid);
    try {
      await authFetch(`/api/admin/pedidos/${pid}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: novoStatus }),
      });
      carregar(pagina);
    } finally {
      setAtualizando(null);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Pedidos</h1>
          <p className="admin-page-sub">{total} pedidos no sistema</p>
        </div>
      </div>

      <div className="admin-card">
        <form className="admin-filters" onSubmit={handleBusca}>
          <select value={status} onChange={e => { setStatus(e.target.value); setPagina(1); }}>
            {STATUS_LIST.map(s => (
              <option key={s} value={s}>{s || 'Todos os status'}</option>
            ))}
          </select>
          <input
            placeholder="Buscar por ID do pedido..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <button type="submit" className="admin-btn-primary admin-btn-sm">Buscar</button>
        </form>

        {carregando ? (
          <div className="admin-loading">Carregando pedidos...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Cliente</th>
                  <th>Restaurante</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Acao</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.length === 0 && (
                  <tr><td colSpan={8} className="admin-empty">Nenhum pedido encontrado</td></tr>
                )}
                {pedidos.map(p => (
                  <tr key={p.id}>
                    <td><strong>#{p.id}</strong></td>
                    <td>{p.cliente_nome}</td>
                    <td>{p.restaurante_nome}</td>
                    <td>{MOEDA(p.total)}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {p.pagamento_metodo || '-'}<br />
                      <span style={{ color: p.pagamento_status === 'aprovado' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {p.pagamento_status || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${BADGE_CLASS[p.status] || ''}`}>{p.status}</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {p.criado_em ? new Date(p.criado_em).toLocaleString('pt-BR') : '-'}
                    </td>
                    <td>
                      <select
                        disabled={atualizando === p.id}
                        defaultValue={p.status}
                        onChange={e => atualizarStatus(p.id, e.target.value)}
                        style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}
                      >
                        {STATUS_LIST.filter(Boolean).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-pagination">
          <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>&#8249;</button>
          {Array.from({ length: Math.min(paginas, 7) }, (_, i) => i + 1).map(p => (
            <button key={p} className={pagina === p ? 'active' : ''} onClick={() => setPagina(p)}>{p}</button>
          ))}
          <button disabled={pagina === paginas} onClick={() => setPagina(p => p + 1)}>&#8250;</button>
        </div>
      </div>
    </AdminLayout>
  );
}
