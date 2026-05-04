import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificacaoService } from '../services';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext({});

export function NotificationsProvider({ children }) {
  const { autenticado } = useAuth();
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [toasts, setToasts] = useState([]);
  const ultimoIdRef = useRef(null);
  const timerRef = useRef(null);

  const carregarNotificacoes = useCallback(async () => {
    if (!autenticado) return;
    try {
      const data = await notificacaoService.minhas({ per_page: 50 });
      const lista = data.notificacoes || [];
      setNotificacoes(lista);
      setNaoLidas(data.nao_lidas || 0);

      // Detectar notificações novas para toast/browser push
      if (lista.length > 0) {
        const maisRecente = lista[0];
        if (ultimoIdRef.current !== null && maisRecente.id !== ultimoIdRef.current && !maisRecente.lida) {
          mostrarToast(maisRecente);
          notificarNavegador(maisRecente);
        }
        ultimoIdRef.current = maisRecente.id;
      }
    } catch {
      // Silencioso
    }
  }, [autenticado]);

  useEffect(() => {
    if (!autenticado) {
      setNotificacoes([]);
      setNaoLidas(0);
      return;
    }
    carregarNotificacoes();
    timerRef.current = setInterval(carregarNotificacoes, 20000); // polling 20s
    return () => clearInterval(timerRef.current);
  }, [autenticado, carregarNotificacoes]);

  function mostrarToast(notificacao) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, titulo: notificacao.titulo, mensagem: notificacao.mensagem }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }

  function notificarNavegador(notificacao) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(notificacao.titulo, { body: notificacao.mensagem, icon: '/favicon.ico' });
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification(notificacao.titulo, { body: notificacao.mensagem, icon: '/favicon.ico' });
        }
      });
    }
  }

  async function marcarLida(nid) {
    try {
      await notificacaoService.marcarLida(nid);
      setNotificacoes(prev => prev.map(n => n.id === nid ? { ...n, lida: true } : n));
      setNaoLidas(prev => Math.max(0, prev - 1));
    } catch { /* silencioso */ }
  }

  async function marcarTodasLidas() {
    try {
      await notificacaoService.marcarTodasLidas();
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      setNaoLidas(0);
    } catch { /* silencioso */ }
  }

  function fecharToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <NotificationsContext.Provider value={{
      notificacoes,
      naoLidas,
      carregarNotificacoes,
      marcarLida,
      marcarTodasLidas,
    }}>
      {children}

      {/* Toast container */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'var(--fundo-card, #fff)',
            border: '1px solid var(--borda, #e5e7eb)',
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,.15)',
            animation: 'slideInUp .3s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <strong style={{ fontSize: 14 }}>{t.titulo}</strong>
              <button onClick={() => fecharToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--texto-sec)', fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--texto-sec)', marginTop: 4, lineHeight: 1.5 }}>{t.mensagem}</p>
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
