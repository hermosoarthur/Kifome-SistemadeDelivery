import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './Admin.css';

const MOEDA = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const STATUS_OPTS = ['', 'ativo', 'pendente', 'bloqueado'];
const BADGE = { ativo: 'badge-ativo', pendente: 'badge-pendente', bloqueado: 'badge-bloqueado' };

export default function AdminRestaurantes() {
  const { authFetch } = useAdminAuth();
  const [lista, setLista] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [status, setStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async (pag = pagina) => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({ pagina: pag, por_pagina: 20 });
      if (status) params.set('status', status);
      if (busca) params.set('busca', busca);
      const res = await authFetch(`/api/admin/restaurantes?${params}`);
      const data = await res.json();
      setLista(data.restaurantes || []);
      setTotal(data.total || 0);
      setPaginas(data.paginas || 1);
    } finally {
      setCarregando(false);
    }
  }, [authFetch, pagina, status, busca]);

  useEffect(() => { carregar(pagina); }, [pagina, status]); // eslint-disable-line

  const handleBusca = (e) => { e.preventDefault(); setPagina(1); carregar(1); };

  const mudarStatus = async (rid, novoStatus) => {
    await authFetch(`/api/admin/restaurantes/${rid}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: novoStatus }),
    });
    carregar(pagina);
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Restaurantes</h1>
          <p className="admin-page-sub">{total} restaurantes cadastrados</p>
        </div>
      </div>

      <div className="admin-card">
        <form className="admin-filters" onSubmit={handleBusca}>
          <select value={status} onChange={e => { setStatus(e.target.value); setPagina(1); }}>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s || 'Todos'}</option>)}
          </select>
          <input placeholder="Buscar por nome..." value={busca} onChange={e => setBusca(e.target.value)} />
          <button type="submit" className="admin-btn-primary admin-btn-sm">Buscar</button>
        </form>

        {carregando ? (
          <div className="admin-loading">Carregando...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Pedidos</th>
                  <th>Faturamento</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 && (
                  <tr><td colSpan={7} className="admin-empty">Nenhum restaurante</td></tr>
                )}
                {lista.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {r.imagem_url && (
                          <img src={r.imagem_url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.nome_fantasia}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{r.endereco?.slice(0, 40)}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 12 }}>{r.categoria || '-'}</span></td>
                    <td>{r.total_pedidos}</td>
                    <td>{MOEDA(r.faturamento)}</td>
                    <td>
                      <span className={`admin-badge ${BADGE[r.status] || ''}`}>{r.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.status !== 'ativo' && (
                          <button className="admin-btn-outline admin-btn-sm" onClick={() => mudarStatus(r.id, 'ativo')}>
                            Ativar
                          </button>
                        )}
                        {r.status !== 'pendente' && (
                          <button className="admin-btn-outline admin-btn-sm" onClick={() => mudarStatus(r.id, 'pendente')}>
                            Pendente
                          </button>
                        )}
                        {r.status !== 'bloqueado' && (
                          <button
                            className="admin-btn-outline admin-btn-sm"
                            style={{ color: '#ef4444', borderColor: '#ef4444' }}
                            onClick={() => mudarStatus(r.id, 'bloqueado')}
                          >
                            Bloquear
                          </button>
                        )}
                      </div>
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
