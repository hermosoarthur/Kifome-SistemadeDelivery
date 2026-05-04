import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { pagamentoService } from '../../services';

/**
 * Retorno do Mercado Pago.
 *
 * Caso A — aberta em nova aba (window.opener existe):
 *   → Confirma pagamento no banco, avisa a aba pai via postMessage, fecha a aba.
 *
 * Caso B — mesma aba:
 *   → Confirma e redireciona para /acompanhar-pedido/:id.
 */
export default function PagamentoRetorno() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [fase, setFase] = useState('carregando'); // carregando | fechando | recusado

  const statusParam = params.get('status') || 'aprovado';
  const pedidoId = params.get('pedido_id') || sessionStorage.getItem('kifome_pedido_aguardando');
  const isNovaAba = Boolean(window.opener && !window.opener.closed);

  useEffect(() => {
    sessionStorage.removeItem('kifome_pedido_aguardando');

    async function processar() {
      if (statusParam === 'recusado') {
        setFase('recusado');
        return;
      }

      // Confirmar no banco automaticamente (webhook nao funciona em localhost)
      if (pedidoId) {
        try {
          await pagamentoService.confirmarSandbox(pedidoId);
        } catch { /* ignora — pode ja estar aprovado */ }
      }

      if (isNovaAba) {
        // Avisar a aba pai e fechar esta aba
        try {
          window.opener.postMessage(
            { tipo: 'kifome_pagamento_ok', pedidoId },
            window.location.origin
          );
        } catch {}
        setFase('fechando');
        setTimeout(() => window.close(), 1200);
      } else {
        // Mesma aba: ir direto para o acompanhamento
        if (pedidoId) {
          navigate(`/acompanhar-pedido/${pedidoId}`, { replace: true });
        } else {
          navigate('/meus-pedidos', { replace: true });
        }
      }
    }

    processar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Carregando / Fechando aba ────────────────────────────────────────────
  if (fase === 'carregando' || fase === 'fechando') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {fase === 'fechando' ? '✅' : '⏳'}
          </div>
          <h2 style={{ marginBottom: 10, color: fase === 'fechando' ? '#22c55e' : '#374151' }}>
            {fase === 'fechando' ? 'Pagamento confirmado!' : 'Verificando pagamento...'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7 }}>
            {fase === 'fechando'
              ? 'Esta aba será fechada. Volte para a aba do Kifome para acompanhar seu pedido.'
              : 'Aguarde um momento...'}
          </p>
        </div>
      </div>
    );
  }

  // ── Recusado ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
        <span style={{ fontSize: 64, display: 'block', marginBottom: 16 }}>❌</span>
        <h2 style={{ color: '#ef4444', marginBottom: 10 }}>Pagamento não aprovado</h2>
        <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 28 }}>
          Seu pagamento foi recusado. Tente novamente com outro método de pagamento.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => navigate('/carrinho')}>
            🔄 Tentar novamente
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/meus-pedidos')}>
            Ver meus pedidos
          </button>
        </div>
      </div>
    </div>
  );
}
