// Arquivo: frontend/src/pages/shared/LoginRestaurante.js
// Tela dedicada para cadastro/login de Restaurante
// Tipo é sempre forçado como 'restaurante', sem opção de troca
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { AUTH_METHODS, normalizePhone, getErrorMessage } from './authUtils';
import './Auth.css';

/* ── Shell visual com tema roxo ── */
function AuthShellRestaurante({ children }) {
  return (
    <div className="auth-screen">
      <div className="auth-brand-corner">
        <span className="auth-brand-wordmark" style={{ color: '#6C63FF' }}>Kifome</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6C63FF', marginLeft: 6, opacity: 0.7 }}>restaurante</span>
      </div>

      <section className="auth-stage-panel">
        <div className="auth-stage-circle" />
        <div className="auth-stage-illustration">
          <div className="delivery-scene">
            <div className="scene-cloud cloud-one" />
            <div className="scene-cloud cloud-two" />
            <div className="scene-person person-main">
              <div className="person-head" />
              <div className="person-body" />
              <div className="person-arm" />
              <div className="food-bag">🍽️</div>
            </div>
            <div className="scene-shadow shadow-one" />
          </div>
        </div>
      </section>

      <section className="auth-card-panel">
        <div className="auth-reference-card">
          <div className="auth-form-shell auth-reference-shell">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthAlert({ type, children, onClose }) {
  return (
    <div className={`auth-alert ${type}`}>
      <span>{type === 'error' ? '⚠️' : '✅'}</span>
      <div>{children}</div>
      {onClose ? <button type="button" onClick={onClose} aria-label="Fechar">✕</button> : <span />}
    </div>
  );
}

export default function LoginRestaurante() {
  const { requestOtpEmail, requestOtpSms, salvarSessao } = useAuth();
  const navigate = useNavigate();

  // Modo: 'escolha' → 'cadastro' → 'otp' OU 'login-escolha' → 'login-email'/'login-sms' → 'login-otp'
  const [modo, setModo] = useState('escolha');
  const [method, setMethod] = useState(AUTH_METHODS.EMAIL_OTP);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Cadastro fields (RF01)
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginTelefone, setLoginTelefone] = useState('');
  const [loginCodigo, setLoginCodigo] = useState('');

  function resetFeedback() { setErro(''); setSucesso(''); }

  function resetAll() {
    resetFeedback();
    setNome(''); setEmail(''); setTelefone(''); setCodigo('');
    setLoginEmail(''); setLoginTelefone(''); setLoginCodigo('');
  }

  async function runAction(action, fallback) {
    setLoading(true);
    resetFeedback();
    try { return await action(); }
    catch (err) { setErro(getErrorMessage(err, fallback)); return null; }
    finally { setLoading(false); }
  }

  /* ────────── CADASTRO ────────── */

  function validateCadastroForm() {
    if (!nome.trim()) { setErro('Nome é obrigatório'); return false; }
    if (nome.trim().length > 100) { setErro('Nome deve ter no máximo 100 caracteres'); return false; }
    if (!email.trim()) { setErro('E-mail é obrigatório'); return false; }
    const emailVal = email.trim().toLowerCase();
    if (emailVal.length < 5 || emailVal.length > 150) { setErro('E-mail deve ter entre 5 e 150 caracteres'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { setErro('Formato de e-mail inválido'); return false; }
    if (!telefone.trim()) { setErro('Telefone é obrigatório'); return false; }
    const telDigits = telefone.replace(/\D/g, '');
    if (telDigits.length < 10 || telDigits.length > 15) { setErro('Telefone deve ter entre 10 e 15 dígitos'); return false; }
    return true;
  }

  async function handleCadastroSubmit(e) {
    e.preventDefault();
    if (!validateCadastroForm()) return;
    await runAction(async () => {
      await requestOtpEmail(email.trim().toLowerCase());
      setSucesso('Código enviado! Verifique seu email (inclusive spam).');
      setModo('otp');
    }, 'Erro ao enviar código');
  }

  async function handleCadastroVerify(e) {
    e.preventDefault();
    if (!codigo || codigo.length < 6) { setErro('Digite o código de 6 dígitos'); return; }
    await runAction(async () => {
      // Usa authService diretamente para NÃO salvar sessão antes de validar o tipo
      const data = await authService.verifyOtpEmail(email.trim().toLowerCase(), codigo, {
        nome: nome.trim(),
        tipo: 'restaurante',
        telefone: telefone.replace(/\D/g, ''),
      });
      if (data.usuario?.tipo !== 'restaurante') {
        setErro(`Este e-mail já está cadastrado como "${data.usuario?.tipo}". Use outro e-mail para criar uma conta de restaurante.`);
        return;
      }
      // Só salva sessão se for restaurante de fato
      salvarSessao(data.token, data.usuario);
      navigate('/');
    }, 'Código incorreto ou expirado');
  }

  /* ────────── LOGIN ────────── */

  async function handleLoginEmailSubmit(e) {
    e.preventDefault();
    if (!loginEmail.trim()) { setErro('Preencha o e-mail'); return; }
    await runAction(async () => {
      await requestOtpEmail(loginEmail.trim().toLowerCase());
      setSucesso('Código enviado! Verifique seu email.');
      setMethod(AUTH_METHODS.EMAIL_OTP);
      setModo('login-otp');
    }, 'Erro ao enviar código');
  }

  async function handleLoginSmsSubmit(e) {
    e.preventDefault();
    const digits = loginTelefone.replace(/\D/g, '');
    if (digits.length < 10) { setErro('Telefone inválido'); return; }
    await runAction(async () => {
      const tel = normalizePhone(loginTelefone.trim());
      const response = await requestOtpSms(tel);
      setLoginTelefone(response?.telefone || tel);
      setSucesso(response?.fallback
        ? 'SMS indisponível. Consulte o terminal do backend para ver o código OTP.'
        : 'Código enviado por SMS!');
      setMethod(AUTH_METHODS.SMS_OTP);
      setModo('login-otp');
    }, 'Erro ao enviar SMS');
  }

  async function handleLoginVerify(e) {
    e.preventDefault();
    if (!loginCodigo || loginCodigo.length < 6) { setErro('Digite o código de 6 dígitos'); return; }
    await runAction(async () => {
      let data;
      // Usa authService diretamente para NÃO salvar sessão antes de validar o tipo
      if (method === AUTH_METHODS.EMAIL_OTP) {
        data = await authService.verifyOtpEmail(loginEmail.trim().toLowerCase(), loginCodigo, { tipo: 'restaurante' });
      } else {
        data = await authService.verifyOtpSms(normalizePhone(loginTelefone.trim()), loginCodigo, { tipo: 'restaurante' });
      }
      if (data.usuario?.tipo !== 'restaurante') {
        setErro(`Esta conta está cadastrada como "${data.usuario?.tipo}". Para acessar o painel de restaurante, cadastre uma conta de restaurante.`);
        return;
      }
      // Só salva sessão se for restaurante de fato
      salvarSessao(data.token, data.usuario);
      navigate('/');
    }, 'Código incorreto');
  }

  /* ────────── Phone format helper ────────── */
  function formatPhone(value, setter) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) { setter(digits); return; }
    if (digits.length <= 7) { setter(`(${digits.slice(0, 2)}) ${digits.slice(2)}`); return; }
    setter(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
  }

  /* ────────── RENDER ────────── */
  return (
    <AuthShellRestaurante>
      {erro && <AuthAlert type="error" onClose={() => setErro('')}>{erro}</AuthAlert>}
      {sucesso && <AuthAlert type="success" onClose={() => setSucesso('')}>{sucesso}</AuthAlert>}

      {/* ══════ TELA INICIAL — Escolha ══════ */}
      {modo === 'escolha' && (
        <>
          <div className="auth-card-heading auth-card-heading-center">
            <div className="auth-rest-icon">🍽️</div>
            <h2 style={{ color: '#6C63FF' }}>Portal do Restaurante</h2>
            <p>Cadastre ou acesse seu restaurante no Kifome</p>
          </div>

          <div className="registro-rest-options">
            <button type="button" className="registro-rest-option-btn primary" onClick={() => { resetAll(); setModo('cadastro'); }}>
              <span className="registro-rest-option-icon">📝</span>
              <div>
                <strong>Criar conta de restaurante</strong>
                <span>Cadastre-se para começar a vender</span>
              </div>
            </button>
            <button type="button" className="registro-rest-option-btn secondary" onClick={() => { resetAll(); setModo('login-escolha'); }}>
              <span className="registro-rest-option-icon">🔑</span>
              <div>
                <strong>Já tenho conta</strong>
                <span>Entrar no painel do restaurante</span>
              </div>
            </button>
          </div>

          <div className="auth-rest-footer">
            <Link to="/login" className="auth-rest-link-back">← Voltar ao login normal</Link>
          </div>
        </>
      )}

      {/* ══════ CADASTRO — Formulário (RF01) ══════ */}
      {modo === 'cadastro' && (
        <form onSubmit={handleCadastroSubmit} className="registro-form">
          <button type="button" className="registro-back-btn" style={{ color: '#6C63FF' }} onClick={() => { resetAll(); setModo('escolha'); }}>
            <span>←</span> Voltar
          </button>

          <div className="registro-heading">
            <h2 style={{ color: '#6C63FF' }}>Cadastro de Restaurante</h2>
            <p>Preencha os dados para criar sua conta</p>
          </div>

          {/* Tipo fixo — restaurante (sem opção de troca) */}
          <div className="registro-tipo-fixed">
            <span className="registro-tipo-fixed-emoji">🍽️</span>
            <div>
              <strong>Restaurante</strong>
              <span>Conta exclusiva para estabelecimentos</span>
            </div>
            <span className="registro-tipo-fixed-check">✓</span>
          </div>

          <div className="registro-field">
            <label className="registro-label">Nome completo *</label>
            <div className="registro-input-wrap">
              <span className="registro-input-icon">👤</span>
              <input type="text" className="registro-input registro-input-rest" placeholder="Seu nome completo" value={nome} onChange={e => setNome(e.target.value)} maxLength={100} required />
            </div>
            <span className="registro-field-hint">{nome.length}/100 caracteres</span>
          </div>

          <div className="registro-field">
            <label className="registro-label">E-mail *</label>
            <div className="registro-input-wrap">
              <span className="registro-input-icon">📧</span>
              <input type="email" className="registro-input registro-input-rest" placeholder="restaurante@email.com" value={email} onChange={e => setEmail(e.target.value)} maxLength={150} required />
            </div>
            <span className="registro-field-hint">Usado para login e receber o código de verificação</span>
          </div>

          <div className="registro-field">
            <label className="registro-label">Telefone *</label>
            <div className="registro-input-wrap registro-phone-wrap">
              <span className="registro-phone-flag">🇧🇷 +55</span>
              <input type="tel" className="registro-input registro-input-rest registro-input-phone" placeholder="(11) 99999-9999" value={telefone} onChange={e => formatPhone(e.target.value, setTelefone)} required />
            </div>
            <span className="registro-field-hint">10 a 15 dígitos com DDD</span>
          </div>

          <div className="registro-info-banner" style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', borderColor: '#c4b5fd' }}>
            <div className="registro-info-icon">🔒</div>
            <div>
              <strong style={{ color: '#5b21b6' }}>Verificação por código</strong>
              <p style={{ color: '#6d28d9' }}>Um código OTP será enviado para o e-mail informado. Sem necessidade de senha.</p>
            </div>
          </div>

          <button type="submit" className="registro-submit" style={{ background: '#6C63FF' }} disabled={loading}>
            {loading ? <><span className="registro-spinner" />Enviando código...</> : <>Continuar cadastro<span className="registro-submit-arrow">→</span></>}
          </button>
        </form>
      )}

      {/* ══════ CADASTRO — OTP ══════ */}
      {modo === 'otp' && (
        <form onSubmit={handleCadastroVerify} className="registro-form">
          <div className="registro-otp-header">
            <button type="button" className="registro-back-btn" style={{ color: '#6C63FF' }} onClick={() => setModo('cadastro')}>
              <span>←</span> Voltar
            </button>
            <div className="registro-otp-title">
              <h3 style={{ color: '#6C63FF' }}>Confirme seu e-mail</h3>
              <p>Código enviado para <strong>{email}</strong></p>
            </div>
          </div>

          <div className="registro-field">
            <label className="registro-label">Código de 6 dígitos</label>
            <input type="text" className="registro-input registro-otp-input" placeholder="000000" value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength="6" required />
          </div>

          <button type="submit" className="registro-submit" style={{ background: '#6C63FF' }} disabled={loading || codigo.length < 6}>
            {loading ? <><span className="registro-spinner" />Criando conta...</> : <>Confirmar e entrar<span className="registro-submit-arrow">→</span></>}
          </button>

          <p className="registro-hint">
            Não recebeu? <button type="button" className="registro-link-btn" style={{ color: '#6C63FF' }} onClick={() => setModo('cadastro')}>Enviar novamente</button>
          </p>
        </form>
      )}

      {/* ══════ LOGIN — Escolha método ══════ */}
      {modo === 'login-escolha' && (
        <>
          <button type="button" className="registro-back-btn" style={{ color: '#6C63FF' }} onClick={() => { resetAll(); setModo('escolha'); }}>
            <span>←</span> Voltar
          </button>

          <div className="auth-card-heading auth-card-heading-center" style={{ marginTop: 8 }}>
            <h2 style={{ color: '#6C63FF', fontSize: 28 }}>Entrar como Restaurante</h2>
            <p>Escolha como deseja continuar</p>
          </div>

          <div className="auth-continue-options">
            <button type="button" className="auth-choice-button auth-choice-rest" onClick={() => { resetFeedback(); setModo('login-email'); }}>E-mail</button>
            <button type="button" className="auth-choice-button auth-choice-rest" onClick={() => { resetFeedback(); setModo('login-sms'); }}>Celular</button>
          </div>
        </>
      )}

      {/* ══════ LOGIN — Email ══════ */}
      {modo === 'login-email' && (
        <form onSubmit={handleLoginEmailSubmit} className="auth-reference-form">
          <button type="button" className="auth-arrow-back" style={{ color: '#6C63FF' }} onClick={() => setModo('login-escolha')}>‹</button>
          <div className="auth-card-heading">
            <p>Informe o e-mail do restaurante</p>
          </div>
          <input type="email" className="auth-reference-input auth-input-rest" placeholder="restaurante@email.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
          <button type="submit" className="auth-primary-action auth-action-rest" disabled={loading}>{loading ? 'Enviando...' : 'Continuar'}</button>
        </form>
      )}

      {/* ══════ LOGIN — SMS ══════ */}
      {modo === 'login-sms' && (
        <form onSubmit={handleLoginSmsSubmit} className="auth-reference-form auth-reference-form-wide">
          <button type="button" className="auth-arrow-back" style={{ color: '#6C63FF' }} onClick={() => setModo('login-escolha')}>‹</button>
          <div className="auth-card-heading auth-card-heading-center">
            <h2 style={{ color: '#6C63FF' }}>Celular do restaurante</h2>
            <p>Você receberá um código por SMS.</p>
          </div>
          <div className="auth-phone-row">
            <div className="auth-country-chip"><span>🇧🇷</span><strong>+55</strong></div>
            <input type="tel" className="auth-reference-input" placeholder="(11) 99999-9999" value={loginTelefone} onChange={e => formatPhone(e.target.value, setLoginTelefone)} required />
          </div>
          <button type="submit" className="auth-primary-action auth-action-rest" disabled={loading || loginTelefone.replace(/\D/g, '').length < 10}>{loading ? 'Enviando...' : 'Receber código'}</button>
        </form>
      )}

      {/* ══════ LOGIN — OTP Verify ══════ */}
      {modo === 'login-otp' && (
        <form onSubmit={handleLoginVerify} className="auth-reference-form">
          <button type="button" className="auth-arrow-back" style={{ color: '#6C63FF' }} onClick={() => setModo(method === AUTH_METHODS.EMAIL_OTP ? 'login-email' : 'login-sms')}>‹</button>
          <div className="auth-card-heading">
            <p>Digite o código de verificação</p>
            <small>{method === AUTH_METHODS.EMAIL_OTP ? loginEmail : loginTelefone}</small>
          </div>
          <input type="text" className="auth-reference-input auth-code-input" placeholder="000000" value={loginCodigo} onChange={e => setLoginCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength="6" required />
          <button type="submit" className="auth-primary-action auth-action-rest" disabled={loading || loginCodigo.length < 6}>{loading ? 'Validando...' : 'Entrar'}</button>
        </form>
      )}
    </AuthShellRestaurante>
  );
}
