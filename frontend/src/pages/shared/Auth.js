import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import './Auth.css';

export function Login() {
  const { login, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ver, setVer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !senha) { setErro('Preencha email e senha'); return; }
    setLoading(true); setErro('');
    try {
      await login(email.trim().toLowerCase(), senha);
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Email ou senha incorretos');
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setLoadingGoogle(true); setErro('');
    try { await loginGoogle(); }
    catch (err) { setErro('Erro ao entrar com Google: ' + err.message); setLoadingGoogle(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <span className="auth-logo">🍔</span>
        <h1>Kifome</h1>
        <p>O sabor que você merece</p>
        <div className="auth-feats">
          <span>✅ Restaurantes parceiros</span>
          <span>✅ Entrega rápida</span>
          <span>✅ Acompanhe em tempo real</span>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Bem-vindo de volta!</h2>
          <p className="auth-sub">Faça login na sua conta</p>
          {erro && <div className="alert alert-erro">{erro}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Email</label>
              <div className="input-box"><span className="icon">📧</span><input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>
            </div>
            <div className="form-group">
              <label>Senha</label>
              <div className="input-box"><span className="icon">🔒</span><input type={ver ? 'text' : 'password'} placeholder="Sua senha" value={senha} onChange={e => setSenha(e.target.value)} autoComplete="current-password" /><button type="button" className="eye" onClick={() => setVer(!ver)}>{ver ? '🙈' : '👁️'}</button></div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : 'Entrar'}</button>
          </form>
          <div className="auth-divider"><span>ou</span></div>
          {supabase ? (
            <button className="btn-google" onClick={handleGoogle} disabled={loadingGoogle}>
              {loadingGoogle ? <span className="spinner" style={{borderTopColor:'#4285F4', borderColor:'#ddd'}} /> : <><span>🔵</span> Continuar com Google</>}
            </button>
          ) : (
            <div className="alert alert-info" style={{textAlign:'center', fontSize:13}}>Configure o Supabase para login com Google</div>
          )}
          <p className="auth-footer">Não tem conta? <Link to="/registro">Criar conta</Link></p>
        </div>
      </div>
    </div>
  );
}

const TIPOS = [
  { v: 'cliente', l: 'Cliente', e: '🛒', desc: 'Faço pedidos' },
  { v: 'restaurante', l: 'Restaurante', e: '🍽️', desc: 'Tenho um restaurante' },
  { v: 'entregador', l: 'Entregador', e: '🛵', desc: 'Faço entregas' },
];

export function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '', telefone: '', tipo: 'cliente' });
  const [ver, setVer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.senha) { setErro('Preencha todos os campos obrigatórios'); return; }
    if (form.senha !== form.confirmar) { setErro('As senhas não conferem'); return; }
    if (form.senha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres'); return; }
    setLoading(true); setErro('');
    try {
      await registro({ nome: form.nome.trim(), email: form.email.trim().toLowerCase(), senha: form.senha, telefone: form.telefone.trim(), tipo: form.tipo });
      setSucesso('Conta criada! Redirecionando para o login...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar conta');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <span className="auth-logo">🍔</span>
        <h1>Kifome</h1>
        <p>Crie sua conta grátis</p>
        <div className="auth-feats">
          <span>✅ Cadastro gratuito</span>
          <span>✅ Acesso imediato</span>
          <span>✅ Sem mensalidade</span>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Criar conta</h2>
          <p className="auth-sub">Escolha como quer usar o Kifome</p>
          <div className="tipos-row">
            {TIPOS.map(t => (
              <button key={t.v} type="button" className={`tipo-chip ${form.tipo === t.v ? 'ativo' : ''}`} onClick={() => set('tipo', t.v)}>
                <span>{t.e}</span><strong>{t.l}</strong><small>{t.desc}</small>
              </button>
            ))}
          </div>
          {erro && <div className="alert alert-erro">{erro}</div>}
          {sucesso && <div className="alert alert-sucesso">{sucesso}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group"><label>Nome *</label><div className="input-box"><span className="icon">👤</span><input type="text" placeholder="Seu nome" value={form.nome} onChange={e => set('nome', e.target.value)} /></div></div>
              <div className="form-group"><label>Telefone</label><div className="input-box"><span className="icon">📞</span><input type="tel" placeholder="(11) 99999-9999" value={form.telefone} onChange={e => set('telefone', e.target.value)} /></div></div>
            </div>
            <div className="form-group"><label>Email *</label><div className="input-box"><span className="icon">📧</span><input type="email" placeholder="seu@email.com" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" /></div></div>
            <div className="form-row">
              <div className="form-group"><label>Senha *</label><div className="input-box"><span className="icon">🔒</span><input type={ver ? 'text' : 'password'} placeholder="Mín. 6 caracteres" value={form.senha} onChange={e => set('senha', e.target.value)} autoComplete="new-password" /><button type="button" className="eye" onClick={() => setVer(!ver)}>{ver ? '🙈' : '👁️'}</button></div></div>
              <div className="form-group"><label>Confirmar *</label><div className="input-box"><span className="icon">🔒</span><input type={ver ? 'text' : 'password'} placeholder="Repita a senha" value={form.confirmar} onChange={e => set('confirmar', e.target.value)} autoComplete="new-password" /></div></div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || !!sucesso}>{loading ? <span className="spinner" /> : 'Criar conta'}</button>
          </form>
          <p className="auth-footer" style={{marginTop:16}}>Já tem conta? <Link to="/login">Fazer login</Link></p>
        </div>
      </div>
    </div>
  );
}
