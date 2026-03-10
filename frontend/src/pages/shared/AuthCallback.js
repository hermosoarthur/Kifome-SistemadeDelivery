import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { authService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

/**
 * OAuth Callback Handler
 * 
 * Supabase redireciona aqui após autenticação via Google/Facebook
 * Este componente:
 * 1. Aguarda session Supabase
 * 2. Troca por JWT backend
 * 3. Salva token local
 * 4. Redireciona para home
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { salvarSessao } = useAuth();
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState('');

  useEffect(() => {
    async function handleCallback() {
      try {
        if (!supabase) throw new Error('Supabase não configurado no frontend');

        // 1. Obter session Supabase (após redirect)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('Nenhuma sessão encontrada');
  if (!session.access_token) throw new Error('Sessão OAuth inválida ou incompleta');

        const user = session.user;
        console.log('[AuthCallback] Supabase user:', user.email);

        // 2. Trocar por JWT backend
        const identities = user.identities || [];
        const inferredProvider = identities[0]?.provider || user.app_metadata?.provider || user.user_metadata?.provider;
        const provider = inferredProvider || 'oauth';
        let backendData;

        if (provider === 'google' || identities.some(i => i.provider === 'google')) {
          backendData = await authService.loginGoogle(session.access_token, session.provider_token, user);
        } else if (provider === 'facebook' || identities.some(i => i.provider === 'facebook')) {
          backendData = await authService.loginFacebook(session.access_token);
        } else {
          throw new Error(`Provider ${provider} não suportado`);
        }

        const { token, usuario } = backendData;
        if (backendData?.needs_phone_verification && backendData?.oauth_user) {
          sessionStorage.setItem('@kifome:pending-social-oauth', JSON.stringify({
            provider,
            user: backendData.oauth_user,
          }));
          navigate('/login?complete=google-phone');
          return;
        }

        if (!token || !usuario) {
          throw new Error('Resposta inválida do backend durante o login social');
        }
        console.log('[AuthCallback] Backend JWT recebido para:', usuario.email);

        // 3. Salvar session local
        salvarSessao(token, usuario);
  setCarregando(false);

        // 4. Redirecionar
        setTimeout(() => navigate('/'), 1000);
      } catch (err) {
        console.error('[AuthCallback] Erro:', err);
        setErro(err.message || 'Erro ao processar autenticação');
        setCarregando(false);
      }
    }

    handleCallback();
  }, [navigate, salvarSessao]);

  if (carregando) {
    return (
      <div className="page-loader">
        <div className="page-loader-card">
          <span className="logo-mark">🔐</span>
          <h2 style={{ fontSize: 24, margin: '18px 0 8px', letterSpacing: '-0.03em' }}>Conectando sua conta</h2>
          <p style={{ color: 'var(--texto-sec)', marginBottom: 18 }}>Estamos validando seu acesso com segurança para te levar ao app.</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--primaria)', fontWeight: 700 }}>
            <span className="spinner" style={{ borderColor: 'rgba(244,63,94,.22)', borderTopColor: 'var(--primaria)' }} />
            Autenticando...
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="page-loader">
        <div className="page-loader-card" style={{ textAlign: 'left' }}>
          <span className="logo-mark" style={{ background: 'linear-gradient(135deg, var(--erro), #f97316)' }}>⚠️</span>
          <h2 style={{ fontSize: 24, margin: '18px 0 8px', letterSpacing: '-0.03em' }}>Algo deu errado no login</h2>
          <p style={{ color: 'var(--texto-sec)', marginBottom: 18 }}>{erro}</p>
          <a href="/login" className="btn btn-primary" style={{ width: 'auto' }}>Voltar para o login</a>
        </div>
      </div>
    );
  }

  return null;
}
