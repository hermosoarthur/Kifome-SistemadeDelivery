import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usuarioService } from '../../services';
import './Perfil.css';

const TE = { cliente: '🛒', restaurante: '🍽️', entregador: '🛵' };
const COR = { cliente: 'var(--primaria)', restaurante: '#6C63FF', entregador: 'var(--sucesso)' };

export default function Perfil() {
  const { usuario, sair, atualizarUsuario } = useAuth();
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nome: usuario?.nome || '', telefone: usuario?.telefone || '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ tipo: '', texto: '' });
  const cor = COR[usuario?.tipo] || 'var(--primaria)';

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) { setMsg({ tipo: 'erro', texto: 'Nome é obrigatório' }); return; }
    setLoading(true);
    try {
      const d = await usuarioService.atualizar(usuario.id, { nome: form.nome.trim(), telefone: form.telefone.trim() });
      atualizarUsuario(d.usuario);
      setEditando(false);
      setMsg({ tipo: 'sucesso', texto: '✅ Perfil atualizado!' });
      setTimeout(() => setMsg({ tipo: '', texto: '' }), 3000);
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.response?.data?.erro || 'Erro ao salvar' });
    } finally { setLoading(false); }
  }

  async function handleSair() {
    if (window.confirm('Deseja sair?')) { await sair(); navigate('/login'); }
  }

  async function deletarConta() {
    if (!window.confirm('Tem certeza que deseja desativar sua conta? Esta ação pode ser reversível via admin.')) return;
    setLoading(true);
    try {
      await usuarioService.deletar(usuario.id);
      // após desativar, deslogue e redirecione
      await sair();
      navigate('/login');
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.response?.data?.erro || 'Erro ao desativar conta' });
    } finally { setLoading(false); }
  }

  return (
    <div className="page">
      <h1 className="page-title">Meu Perfil</h1>

      <div className="perfil-hero card" style={{ '--cor': cor }}>
        <div className="p-avatar">{TE[usuario?.tipo] || '👤'}</div>
        <div className="p-info">
          <h2>{usuario?.nome}</h2>
          <p>{usuario?.email}</p>
          <span className="p-badge" style={{ background: `color-mix(in srgb, ${cor} 15%, white)`, color: cor }}>{usuario?.tipo}</span>
        </div>
      </div>

      {msg.texto && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}

      <div className="card p-card">
        <div className="p-card-head">
          <h3>Informações pessoais</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => { setEditando(!editando); setMsg({ tipo: '', texto: '' }); setForm({ nome: usuario?.nome || '', telefone: usuario?.telefone || '' }); }}>
            {editando ? '✕ Cancelar' : '✏️ Editar'}
          </button>
        </div>

        {editando ? (
          <form onSubmit={salvar}>
            <div className="form-row">
              <div className="form-group"><label>Nome completo</label><div className="input-box"><input type="text" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div></div>
              <div className="form-group"><label>Telefone</label><div className="input-box"><input type="tel" placeholder="(11) 99999-9999" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} /></div></div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: 'auto', padding: '12px 28px' }}>{loading ? <span className="spinner" /> : '💾 Salvar'}</button>
          </form>
        ) : (
          <div className="p-dados">
            {[{ i: '👤', l: 'Nome', v: usuario?.nome }, { i: '📧', l: 'Email', v: usuario?.email }, { i: '📞', l: 'Telefone', v: usuario?.telefone || 'Não informado' }, { i: '🏷️', l: 'Tipo de conta', v: usuario?.tipo }].map(d => (
              <div key={d.l} className="p-row">
                <span className="p-ic">{d.i}</span>
                <div><span className="p-label">{d.l}</span><span className="p-val">{d.v}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-card" style={{ display: 'grid', gap: 8 }}>
        <button className="btn btn-danger" onClick={handleSair} style={{ width: '100%' }}>🚪 Sair da conta</button>
        <button className="btn btn-danger-outline" onClick={deletarConta} disabled={loading} style={{ width: '100%' }}>🗑️ Desativar conta</button>
      </div>
    </div>
  );
}
