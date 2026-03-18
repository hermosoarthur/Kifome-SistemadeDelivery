// Arquivo: frontend/src/pages/shared/Auth.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services';
import { supabase } from '../../services/supabase';
import './Auth.css';

const AUTH_METHODS = {
  EMAIL_OTP: 'email_otp',
  SMS_OTP: 'sms_otp',
};

function normalizePhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
}

function getErrorMessage(err, fallback) {
  return err?.response?.data?.erro || err?.message || fallback;
}

function AuthShell({ children }) {
  return (
    <div className="auth-screen">
      <div className="auth-brand-corner">
        <span className="auth-brand-wordmark">Kifome</span>
      </div>

      <section className="auth-stage-panel">
        <div className="auth-stage-circle" />
        <div className="auth-stage-illustration">
          <div className="delivery-scene">
            <div className="scene-cloud cloud-one" />
            <div className="scene-cloud cloud-two" />
            <div className="scene-person person-wheelchair">
              <div className="person-head" />
              <div className="person-body" />
              <div className="wheel wheel-large" />
              <div className="wheel wheel-small" />
              <div className="food-bag">❤</div>
            </div>
            <div className="scene-person person-main">
              <div className="person-head" />
              <div className="person-body" />
              <div className="person-arm" />
              <div className="food-bag">❤</div>
            </div>
            <div className="scene-person person-side">
              <div className="person-head" />
              <div className="person-body" />
              <div className="food-bag small">❤</div>
            </div>
            <div className="scene-shadow shadow-one" />
            <div className="scene-shadow shadow-two" />
          </div>
        </div>
      </section>

      <section className="auth-card-panel">
        <div className="auth-reference-card">
          <button className="auth-help-button" aria-label="Ajuda">◌</button>
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

function OtpStepHeader({ title, subtitle, onBack }) {
  return (
    <div className="auth-step-header">
      <button type="button" className="auth-back-button" onClick={onBack}>← Voltar</button>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function AuthField({ label, icon, children }) {
  return (
    <div className="form-field auth-field">
      <label className="form-label">{label}</label>
      <div className="input-wrapper">
        <span className="input-icon">{icon}</span>
        {children}
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="provider-logo-svg google-logo">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.87-3c-1.07.72-2.44 1.16-4.06 1.16-3.12 0-5.76-2.1-6.7-4.92H1.3v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.34A7.2 7.2 0 0 1 4.93 12c0-.81.14-1.6.38-2.34V6.57H1.3A12 12 0 0 0 0 12c0 1.93.46 3.76 1.3 5.43l4-3.09Z" />
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.36.61 4.61 1.81l3.46-3.46C17.94 1.14 15.24 0 12 0A12 12 0 0 0 1.3 6.57l4 3.09c.94-2.82 3.58-4.89 6.7-4.89Z" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="provider-logo-svg facebook-logo">
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.43H7.08v-3.5h3.05V9.41c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.5 0-1.97.94-1.97 1.9v2.28h3.35l-.54 3.5h-2.81V24C19.61 23.1 24 18.1 24 12.07Z" />
      <path fill="#FFFFFF" d="m16.67 15.57.54-3.5h-3.35V9.79c0-.96.47-1.9 1.97-1.9h1.52V4.92s-1.38-.24-2.69-.24c-2.74 0-4.53 1.67-4.53 4.7v2.69H7.08v3.5h3.05V24a12.1 12.1 0 0 0 3.73 0v-8.43h2.81Z" />
    </svg>
  );
}

function LoginStart({ onEmail, onSms, onGoogle, onFacebook, loading }) {
  return (
    <>
      <div className="auth-card-heading auth-card-heading-center">
        <h2>Falta pouco para<br />matar sua fome!</h2>
        <p>Como deseja continuar?</p>
      </div>

      {supabase && (
        <div className="auth-provider-list">
          <button type="button" className="auth-provider-button facebook" onClick={onFacebook} disabled={loading}>
            <span className="provider-icon-box" aria-hidden="true"><FacebookLogo /></span>
            <span>Continuar com Facebook</span>
          </button>
          <button type="button" className="auth-provider-button google" onClick={onGoogle} disabled={loading}>
            <span className="provider-icon-google" aria-hidden="true"><GoogleLogo /></span>
            <span>Fazer login com o Google</span>
          </button>
        </div>
      )}

      {!supabase && (
        <p className="auth-provider-warning">
          Login com Google e Facebook fica disponível assim que o Supabase estiver configurado no frontend.
        </p>
      )}

      <div className="auth-continue-options">
        <button type="button" className="auth-choice-button" onClick={onSms} disabled={loading}>Celular</button>
        <button type="button" className="auth-choice-button" onClick={onEmail} disabled={loading}>E-mail</button>
      </div>
    </>
  );
}

function LoginEmailStep({ email, setEmail, loading, onSubmit, onBack }) {
  return (
    <form onSubmit={onSubmit} className="auth-reference-form">
      <button type="button" className="auth-arrow-back" onClick={onBack}>‹</button>
      <div className="auth-card-heading">
        <p>Informe o seu e-mail para continuar</p>
      </div>
      <input type="email" className="auth-reference-input" placeholder="Informe o seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
  <p className="auth-reference-disclaimer">A Kifome poderá enviar comunicações neste e-mail. Caso não queira receber mensagens nesse canal, você poderá ajustar isso depois nas configurações da sua conta.</p>
      <button type="submit" className="auth-primary-action" disabled={loading}>{loading ? 'Enviando...' : 'Continuar'}</button>
    </form>
  );
}

function LoginPhoneStep({ telefone, setTelefone, loading, onSubmit, onBack, title, subtitle, helpText }) {
  const telefoneFormatado = telefone.replace(/\D/g, '').slice(0, 11);

  function handlePhoneChange(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) {
      setTelefone(digits);
      return;
    }
    if (digits.length <= 7) {
      setTelefone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
      return;
    }
    setTelefone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
  }

  return (
    <form onSubmit={onSubmit} className="auth-reference-form auth-reference-form-wide">
      <button type="button" className="auth-arrow-back" onClick={onBack}>‹</button>
      <div className="auth-card-heading auth-card-heading-center">
        <h2>{title || 'Informe o número do seu celular para continuar'}</h2>
        <p>{subtitle || 'Você vai receber um código por SMS para entrar na sua conta.'}</p>
      </div>
      <div className="auth-phone-row">
        <div className="auth-country-chip">
          <span>🇧🇷</span>
          <strong>+55</strong>
        </div>
        <input type="tel" className="auth-reference-input" placeholder="(11) 99999-9999" value={telefone} onChange={(e) => handlePhoneChange(e.target.value)} required />
      </div>
      <p className="auth-phone-help">{helpText || 'Seu número será usado apenas para enviar o código de acesso por SMS.'}</p>
      <button type="submit" className="auth-primary-action" disabled={loading || telefoneFormatado.length < 10}>{loading ? 'Enviando...' : 'Receber código por SMS'}</button>
    </form>
  );
}

function LoginOtpStep({ title, subtitle, code, setCode, loading, onSubmit, onBack, buttonText }) {
  return (
    <form onSubmit={onSubmit} className="auth-reference-form">
      <button type="button" className="auth-arrow-back" onClick={onBack}>‹</button>
      <div className="auth-card-heading">
        <p>{title}</p>
        <small>{subtitle}</small>
      </div>
      <input type="text" className="auth-reference-input auth-code-input" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.slice(0, 6))} maxLength="6" required />
      <button type="submit" className="auth-primary-action" disabled={loading || code.length < 6}>{loading ? 'Validando...' : buttonText}</button>
    </form>
  );
}

/**
 * 🔐 Login Kifome-style - 100% Passwordless
 * Apenas 2 opções: Email OTP, SMS OTP + Google/Facebook
 */
export function Login() {
  const { requestOtpEmail, verifyOtpEmail, requestOtpSms, verifyOtpSms, loginGoogle, loginFacebook } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState(AUTH_METHODS.EMAIL_OTP);
  const [step, setStep] = useState('start');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  
  // Email OTP
  const [email, setEmail] = useState('');
  const [codigoEmail, setCodigoEmail] = useState('');
  const [enviouEmail, setEnviouEmail] = useState(false);
  
  // SMS OTP
  const [telefone, setTelefone] = useState('');
  const [codigoSms, setCodigoSms] = useState('');
  const [enviouSms, setEnviouSms] = useState(false);
  const [pendingSocialUser, setPendingSocialUser] = useState(null);

  function resetFeedback() {
    setErro('');
    setSucesso('');
  }

  function resetAuthState(nextStep = 'start') {
    setStep(nextStep);
    resetFeedback();
    setEmail('');
    setCodigoEmail('');
    setEnviouEmail(false);
    setTelefone('');
    setCodigoSms('');
    setEnviouSms(false);
  }

  async function runAuthAction(action, fallbackMessage) {
    setLoading(true);
    resetFeedback();
    try {
      return await action();
    } catch (err) {
      setErro(getErrorMessage(err, fallbackMessage));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function requestSmsCode({ successMessage, nextStep }) {
    const telefoneNormalizado = normalizePhone(telefone.trim());
    const response = await requestOtpSms(telefoneNormalizado);
    setTelefone(response?.telefone || telefoneNormalizado);
    setSucesso(response?.fallback
      ? 'O envio real de SMS não respondeu como esperado. Em ambiente de desenvolvimento, consulte o terminal do backend para ver o código OTP gerado.'
      : successMessage);
    setEnviouSms(true);
    setStep(nextStep);
    return response;
  }

  useEffect(() => {
    const pending = sessionStorage.getItem('@kifome:pending-social-oauth');
    const shouldCompletePhone = searchParams.get('complete') === 'google-phone';
    if (!pending || !shouldCompletePhone) return;

    try {
      const parsed = JSON.parse(pending);
      if (parsed?.user) {
        setPendingSocialUser(parsed.user);
        setMethod(AUTH_METHODS.SMS_OTP);
        setStep('social-phone-entry');
        setSucesso('Confirme seu celular com SMS para concluir seu primeiro acesso com Google.');
      }
    } catch {
      sessionStorage.removeItem('@kifome:pending-social-oauth');
    }
  }, [searchParams]);

  // ====== EMAIL OTP ======
  async function handleRequestEmail(e) {
    e.preventDefault();
    if (!email.trim()) { setErro('Preencha o email'); return; }
    const result = await runAuthAction(async () => {
      await requestOtpEmail(email.trim().toLowerCase());
      setSucesso('Código enviado pelo Supabase. Verifique seu email e também a caixa de spam.');
      setEnviouEmail(true);
      setStep('email-code');
      return true;
    }, 'Erro ao enviar código');
    return result;
  }

  async function handleVerifyEmail(e) {
    e.preventDefault();
    if (!codigoEmail) { setErro('Preencha o código'); return; }
    await runAuthAction(async () => {
      await verifyOtpEmail(email.trim().toLowerCase(), codigoEmail);
      navigate('/');
    }, 'Código incorreto');
  }

  // ====== SMS OTP ======
  async function handleRequestSms(e) {
    e.preventDefault();
    if (!telefone.trim()) { setErro('Preencha o telefone'); return; }
    await runAuthAction(
      () => requestSmsCode({ successMessage: 'Código enviado por SMS! Confira as mensagens do seu celular.', nextStep: 'sms-code' }),
      'Erro ao enviar SMS'
    );
  }

  async function handleRequestSocialSms(e) {
    e.preventDefault();
    if (!telefone.trim() || !pendingSocialUser) { setErro('Preencha o telefone para continuar'); return; }
    await runAuthAction(
      () => requestSmsCode({ successMessage: 'Código enviado por SMS! Agora falta só validar seu celular para liberar o acesso com Google.', nextStep: 'social-phone-code' }),
      'Erro ao enviar SMS'
    );
  }

  async function handleVerifySocialSms(e) {
    e.preventDefault();
    if (!codigoSms || !pendingSocialUser) { setErro('Preencha o código'); return; }
    await runAuthAction(async () => {
      await verifyOtpSms(normalizePhone(telefone.trim()), codigoSms, {
        nome: pendingSocialUser.nome,
        email: pendingSocialUser.email,
        tipo: pendingSocialUser.tipo || 'cliente',
      });

      const syncResponse = await authService.syncSupabaseUser({
        email: pendingSocialUser.email,
        supabase_uid: pendingSocialUser.supabase_uid,
        nome: pendingSocialUser.nome,
        telefone: normalizePhone(telefone.trim()),
        tipo: pendingSocialUser.tipo || 'cliente',
        avatar_url: pendingSocialUser.avatar_url || '',
      });

      sessionStorage.removeItem('@kifome:pending-social-oauth');
      localStorage.setItem('@kifome:token', syncResponse.token);
      localStorage.setItem('@kifome:usuario', JSON.stringify(syncResponse.usuario));
      navigate('/');
    }, 'Não foi possível confirmar seu celular');
  }

  async function handleVerifySms(e) {
    e.preventDefault();
    if (!codigoSms) { setErro('Preencha o código'); return; }
    await runAuthAction(async () => {
      await verifyOtpSms(normalizePhone(telefone.trim()), codigoSms);
      navigate('/');
    }, 'Código incorreto');
  }

  // ====== SOCIAL ======
  async function handleGoogle() {
    await runAuthAction(() => loginGoogle(), 'Erro ao entrar com Google');
  }

  async function handleFacebook() {
    await runAuthAction(() => loginFacebook(), 'Erro ao entrar com Facebook');
  }

  // ====== RESET ======
  function handleChangeMethod(newMethod) {
    setMethod(newMethod);
    resetAuthState(newMethod === AUTH_METHODS.EMAIL_OTP ? 'email-entry' : 'sms-entry');
  }

  function handleBackToStart() {
    resetAuthState('start');
  }

  return (
    <AuthShell>
      {erro && <AuthAlert type="error" onClose={() => setErro('')}>{erro}</AuthAlert>}
      {sucesso && <AuthAlert type="success" onClose={() => setSucesso('')}>{sucesso}</AuthAlert>}

      {step === 'start' && (
        <LoginStart
          onEmail={() => handleChangeMethod(AUTH_METHODS.EMAIL_OTP)}
          onSms={() => handleChangeMethod(AUTH_METHODS.SMS_OTP)}
          onGoogle={handleGoogle}
          onFacebook={handleFacebook}
          loading={loading}
        />
      )}

      {method === AUTH_METHODS.EMAIL_OTP && step === 'email-entry' && (
        <LoginEmailStep email={email} setEmail={setEmail} loading={loading} onSubmit={handleRequestEmail} onBack={handleBackToStart} />
      )}

      {method === AUTH_METHODS.EMAIL_OTP && step === 'email-code' && enviouEmail && (
        <LoginOtpStep title="Digite o código enviado para o seu e-mail" subtitle={email} code={codigoEmail} setCode={setCodigoEmail} loading={loading} onSubmit={handleVerifyEmail} onBack={() => { setEnviouEmail(false); setStep('email-entry'); }} buttonText="Continuar" />
      )}

      {method === AUTH_METHODS.SMS_OTP && step === 'sms-entry' && (
        <LoginPhoneStep telefone={telefone} setTelefone={setTelefone} loading={loading} onSubmit={handleRequestSms} onBack={handleBackToStart} />
      )}

      {method === AUTH_METHODS.SMS_OTP && step === 'social-phone-entry' && (
        <LoginPhoneStep
          telefone={telefone}
          setTelefone={setTelefone}
          loading={loading}
          onSubmit={handleRequestSocialSms}
          onBack={handleBackToStart}
          title={`Seu acesso com Google já foi reconhecido${pendingSocialUser?.nome ? `, ${pendingSocialUser.nome.split(' ')[0]}` : ''}`}
          subtitle="Agora falta confirmar seu celular por SMS para ativar sua conta Kifome com segurança."
          helpText={`Vamos vincular esse número ao e-mail ${pendingSocialUser?.email || 'da sua conta'} para concluir seu primeiro acesso.`}
        />
      )}

      {method === AUTH_METHODS.SMS_OTP && step === 'sms-code' && enviouSms && (
        <LoginOtpStep title="Digite o código enviado por SMS" subtitle={telefone} code={codigoSms} setCode={setCodigoSms} loading={loading} onSubmit={handleVerifySms} onBack={() => { setEnviouSms(false); setStep('sms-entry'); }} buttonText="Entrar" />
      )}

      {method === AUTH_METHODS.SMS_OTP && step === 'social-phone-code' && enviouSms && (
        <LoginOtpStep title="Confirme seu celular para concluir com Google" subtitle={`Código enviado para ${telefone}. Depois disso você já entra no Kifome.`} code={codigoSms} setCode={setCodigoSms} loading={loading} onSubmit={handleVerifySocialSms} onBack={() => { setEnviouSms(false); setStep('social-phone-entry'); }} buttonText="Validar celular e entrar" />
      )}
    </AuthShell>
  );
}

/**
 * 📝 Registro Kifome-style - 100% Passwordless
 */
export function Registro() {
  const { requestOtpEmail, verifyOtpEmail } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState('cliente');
  const [step, setStep] = useState(1); // 1: form, 2: otp verify

  // Form
  const [form, setForm] = useState({ nome: '', email: '', telefone: '' });
  const [codigo, setCodigo] = useState('');

  const TIPOS = [
    { v: 'cliente', l: 'Cliente', e: '🛒', desc: 'Faço pedidos' },
    { v: 'restaurante', l: 'Restaurante', e: '🍽️', desc: 'Tenho um restaurante' },
    { v: 'entregador', l: 'Entregador', e: '🛵', desc: 'Faço entregas' },
  ];

  async function handleSubmitForm(e) {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.telefone.trim()) {
      setErro('Preencha todos os campos');
      return;
    }
    
    setLoading(true);
    setErro('');
    setSucesso('');
    try {
      await requestOtpEmail(form.email.trim().toLowerCase());
      setSucesso('Código enviado pelo Supabase. Verifique seu email e também a caixa de spam.');
      setStep(2);
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao enviar código'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndRegister(e) {
    e.preventDefault();
    if (!codigo) {
      setErro('Preencha o código');
      return;
    }

    setLoading(true);
    setErro('');
    setSucesso('');
    try {
      await verifyOtpEmail(form.email.trim().toLowerCase(), codigo, {
        nome: form.nome,
        telefone: normalizePhone(form.telefone),
        tipo: tipoSelecionado,
      });
      navigate('/');
    } catch (err) {
      setErro(getErrorMessage(err, 'Erro ao registrar'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Cadastro inteligente"
      title="Crie sua conta em minutos"
      subtitle={step === 1 ? 'Escolha seu perfil e confirme os dados com validação por e-mail.' : 'Estamos quase lá. Falta confirmar seu código.'}
      heroBadge="Onboarding com foco em clareza"
      heroTitle="Uma jornada de cadastro simples para todo o ecossistema Kifome"
      heroText="Clientes, restaurantes e entregadores entram pela mesma base visual, com etapas claras e sensação de produto pronto para uso."
      heroAside={{ title: 'Cada perfil no lugar certo', text: 'Você escolhe seu papel e já cai no painel certo com uma experiência consistente em todo o app.' }}
    >
      {erro && <AuthAlert type="error">{erro}</AuthAlert>}
      {sucesso && <AuthAlert type="success">{sucesso}</AuthAlert>}

          {/* STEP 1: FORM */}
      {step === 1 && (
        <form onSubmit={handleSubmitForm} className="auth-form smart-form">
          <div className="tipo-grid tipo-grid-3">
            {TIPOS.map(tipo => (
              <button key={tipo.v} type="button" className={`tipo-card ${tipoSelecionado === tipo.v ? 'active' : ''}`} onClick={() => setTipoSelecionado(tipo.v)}>
                <span className="tipo-emoji">{tipo.e}</span>
                <div>
                  <span className="tipo-name">{tipo.l}</span>
                  <span className="tipo-desc">{tipo.desc}</span>
                </div>
              </button>
            ))}
          </div>

          <AuthField label="Seu nome" icon="👤">
            <input type="text" placeholder="João Silva" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="form-input" required />
          </AuthField>

          <AuthField label="E-mail" icon="📧">
            <input type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" className="form-input" required />
          </AuthField>

          <AuthField label="Celular" icon="📱">
            <input type="tel" placeholder="+55 11 99999-9999" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className="form-input" required />
          </AuthField>

          <div className="auth-info-banner gradient">
            <strong>Sem senha, menos fricção</strong>
            <p>O cadastro usa OTP por e-mail e já guarda o telefone para futuras jornadas com SMS.</p>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <><span className="btn-loader"></span>Enviando código...</> : <><span>Continuar cadastro</span><span className="btn-arrow">→</span></>}
          </button>
        </form>
      )}

          {/* STEP 2: OTP */}
      {step === 2 && (
        <form onSubmit={handleVerifyAndRegister} className="auth-form smart-form">
          <OtpStepHeader title="Confirme seu e-mail" subtitle={`Código enviado para ${form.email}`} onBack={() => setStep(1)} />
          <div className="form-field auth-field">
            <label className="form-label">Digite o código de 6 dígitos</label>
            <input type="text" placeholder="000000" value={codigo} onChange={e => setCodigo(e.target.value.slice(0, 6))} maxLength="6" className="form-input otp-input auth-otp-input" required />
          </div>
          <button type="submit" className="btn-submit" disabled={loading || codigo.length < 6}>
            {loading ? <><span className="btn-loader"></span>Criando conta...</> : <><span>Confirmar e entrar</span><span className="btn-arrow">→</span></>}
          </button>
          <p className="form-hint centered-hint">Não recebeu? <button type="button" className="link-btn" onClick={() => setStep(1)}>Enviar novamente</button></p>
        </form>
      )}

      <div className="form-footer auth-footer-note">
        <p>Já tem conta? <Link to="/login" className="link">Entrar</Link></p>
      </div>
    </AuthShell>
  );
}

/**
 * 🔑 Não precisa mais dessa página
 */
export function EsqueceuSenha() {
  return (
    <div className="page-loader">
      <div className="page-loader-card">
        <span className="logo-mark">🔐</span>
        <h2 style={{ fontSize: 24, margin: '18px 0 8px' }}>Aqui não tem senha</h2>
        <p style={{ color: 'var(--texto-sec)', marginBottom: 18 }}>O acesso do Kifome funciona por e-mail ou SMS com OTP, então você sempre entra de forma simples e segura.</p>
        <Link to="/login" className="btn btn-primary" style={{ width: 'auto' }}>← Voltar ao login</Link>
      </div>
    </div>
  );
}

// #
