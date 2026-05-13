import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './Admin.css';

const TIPOS = ['', 'cliente', 'restaurante', 'entregador', 'admin'];

export default function AdminUsuarios() {
  const { authFetch } = useAdminAuth();
  const [lista, setLista] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [tipo, setTipo] = useState('');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async (pag = pagina) => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({ pagina: pag, por_pagina: 20 });
      if (tipo) params.set('tipo', tipo);
      if (busca) params.set('busca', busca);
      const res = await authFetch(`/api/admin/usuarios?${params}`);
      const data = await res.json();
      setLista(data.usuarios || []);
      setTotal(data.total || 0);
      setPaginas(data.paginas || 1);
    } finally {
      setCarregando(false);
    }
  }, [authFetch, pagina, tipo, busca]);

  useEffect(() => { carregar(pagina); }, [pagina, tipo]); // eslint-disable-line

  const handleBusca = (e) => { e.preventDefault(); setPagina(1); carregar(1); };

  const toggleAtivo = async (uid, ativo) => {
    await authFetch(`/api/admin/usuarios/${uid}/ativo`, {
      method: 'PUT',
      body: JSON.stringify({ ativo: !ativo }),
    });
    carregar(pagina);
  };

  const TIPO_COLORS = { cliente: '#3b82f6', restaurante: '#f59e0b', entregador: '#10b981', admin: '#8b5cf6' };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Usuarios</h1>
          <p className="admin-page-sub">{total} usuarios cadastrados</p>
        </div>
      </div>

      <div className="admin-card">
        <form className="admin-filters" onSubmit={handleBusca}>
          <select value={tipo} onChange={e => { setTipo(e.target.value); setPagina(1); }}>
            {TIPOS.map(t => <option key={t} value={t}>{t || 'Todos os tipos'}</option>)}
          </select>
          <input placeholder="Nome ou email..." value={busca} onChange={e => setBusca(e.target.value)} />
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
                  <th>Email</th>
                  <th>Tipo</th>
                  <th>Pedidos</th>
                  <th>Cadastro</th>
                  <th>Status</th>
                  <th>Acao</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 && (
                  <tr><td colSpan={8} className="admin-empty">Nenhum usuario encontrado</td></tr>
                )}
                {lista.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {u.avatar_url && (
                          <img src={u.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        )}
                        <span style={{ fontWeight: 600 }}>{u.nome}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: '#6b7280' }}>{u.email}</td>
                    <td>
                      <span className="admin-badge" style={{
                        background: `${TIPO_COLORS[u.tipo] || '#9ca3af'}22`,
                        color: TIPO_COLORS[u.tipo] || '#374151'
                      }}>
                        {u.tipo}
                      </span>
                    </td>
                    <td>{u.total_pedidos ?? '-'}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {u.criado_em ? new Date(u.criado_em).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td>
                      <span className={`admin-badge ${u.ativo ? 'badge-ativo' : 'badge-cancelado'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-btn-outline admin-btn-sm"
                        style={{ color: u.ativo ? '#ef4444' : '#10b981', borderColor: u.ativo ? '#ef4444' : '#10b981' }}
                        onClick={() => toggleAtivo(u.id, u.ativo)}
                      >
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
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
