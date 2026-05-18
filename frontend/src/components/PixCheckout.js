import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pagamentoService, pedidoService } from '../services';

const PIX_EXPIRACAO_SEGUNDOS = 30 * 60; // 30 minutos

export default function PixCheckout({ pedidoId, onErro }) {
  const navigate = useNavigate();
  const [pixData, setPixData] = useState(null);   // { payment_id, qr_code, qr_code_base64 }
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(PIX_EXPIRACAO_SEGUNDOS);
  const [expirado, setExpirado] = useState(false);
  const [statusPago, setStatusPago] = useState(false);

  const pollingRef = useRef(null);
  const timerRef = useRef(null);
  // Ref para saber se pagamento foi aprovado — usado no cleanup de desmontagem
  const pagoRef = useRef(false);

  // Cancela o pedido no backend se pagamento não foi concluído
  const cancelarPedido = useCallback(async () => {
    if (pagoRef.current) return; // já aprovado, não cancela
    try {
      await pedidoService.cancelarPagamento(pedidoId);
    } catch {
      // silencioso — pode já estar cancelado ou não existir
    }
  }, [pedidoId]);

  const iniciarPolling = useCallback((paymentId, pid) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await pagamentoService.statusPix(paymentId);
        if (res.status === 'approved') {
          clearInterval(pollingRef.current);
          clearInterval(timerRef.current);
          pagoRef.current = true;
          setStatusPago(true);
          setTimeout(() => navigate(`/acompanhar-pedido/${pid}`, { replace: true }), 1500);
        }
      } catch {
        // continua tentando
      }
    }, 3000);
  }, [navigate]);

  const gerarPix = useCallback(async () => {
    setLoading(true);
    setErro('');
    setExpirado(false);
    setSegundosRestantes(PIX_EXPIRACAO_SEGUNDOS);
    try {
      const res = await pagamentoService.criarPix(pedidoId);
      setPixData(res);
      iniciarPolling(res.payment_id, pedidoId);

      // Timer regressivo
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSegundosRestantes((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            clearInterval(pollingRef.current);
            setExpirado(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      const msg = e.response?.data?.erro || 'Erro ao gerar QR Code PIX. Tente novamente.';
      setErro(msg);
      if (onErro) onErro(msg);
    } finally {
      setLoading(false);
    }
  }, [pedidoId, iniciarPolling, onErro]);

  useEffect(() => {
    gerarPix();
    return () => {
      // Ao desmontar (usuário navegou para fora): para polls e cancela pedido
      clearInterval(pollingRef.current);
      clearInterval(timerRef.current);
      cancelarPedido();
    };
  }, [gerarPix, cancelarPedido]);

  async function copiarCodigo() {
    if (!pixData?.qr_code) return;
    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      // fallback para navegadores antigos
      const ta = document.createElement('textarea');
      ta.value = pixData.qr_code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  }

  const minutos = String(Math.floor(segundosRestantes / 60)).padStart(2, '0');
  const segundos = String(segundosRestantes % 60).padStart(2, '0');

  // �??�?? Tela de sucesso
  if (statusPago) {
    return (
      <div style={estilos.card}>
        <div style={{ fontSize: 64 }}>�??</div>
        <h2 style={{ color: '#16a34a', margin: '12px 0 8px' }}>PIX aprovado!</h2>
        <p style={{ color: '#6b7280' }}>Redirecionando para acompanhar seu pedido...</p>
      </div>
    );
  }

  // �??�?? Carregando
  if (loading) {
    return (
      <div style={estilos.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <p style={{ color: '#6b7280' }}>Gerando QR Code PIX...</p>
      </div>
    );
  }

  // �??�?? Erro
  if (erro) {
    return (
      <div style={estilos.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>�?</div>
        <p style={{ color: '#ef4444', marginBottom: 20 }}>{erro}</p>
        <button style={estilos.btnPrimario} onClick={gerarPix}>Tentar novamente</button>
      </div>
    );
  }

  // �??�?? Expirado
  if (expirado) {
    return (
      <div style={estilos.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
        <h3 style={{ color: '#b45309', marginBottom: 8 }}>QR Code expirado</h3>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>O código PIX expirou após 30 minutos.</p>
        <button style={estilos.btnPrimario} onClick={gerarPix}>�??? Gerar novo QR Code</button>
      </div>
    );
  }

  return (
    <div style={estilos.card}>
      {/* Header PIX */}
      <div style={estilos.header}>
        <span style={estilos.pixIcone}>PIX</span>
        <div>
          <strong style={{ fontSize: 18 }}>Pagamento via PIX</strong>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Escaneie o QR Code ou copie o código
          </p>
        </div>
      </div>

      {/* Timer */}
      <div style={estilos.timer}>
        ⏱️ Expira em: <strong style={{ color: segundosRestantes < 300 ? '#ef4444' : '#374151' }}>{minutos}:{segundos}</strong>
      </div>

      {/* QR Code */}
      {pixData?.qr_code_base64 ? (
        <img
          src={`data:image/png;base64,${pixData.qr_code_base64}`}
          alt="QR Code PIX"
          style={estilos.qrcode}
        />
      ) : (
        <div style={{ ...estilos.qrcode, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
          <span style={{ color: '#9ca3af', fontSize: 13 }}>QR Code não disponível</span>
        </div>
      )}

      {/* Código copia e cola */}
      <div style={estilos.codigoCaixa}>
        <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>Código PIX (Copia e Cola)</p>
        <p style={estilos.codigoTexto}>{pixData?.qr_code}</p>
      </div>

      <button
        style={{ ...estilos.btnPrimario, background: copiado ? '#16a34a' : '#00b4d8' }}
        onClick={copiarCodigo}
      >
        {copiado ? '�?? Código copiado!' : '�??? Copiar código PIX'}
      </button>

      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16, textAlign: 'center' }}>
        Após o pagamento, esta tela será atualizada automaticamente.
      </p>
    </div>
  );
}

const estilos = {
  card: {
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
    padding: '36px 28px',
    maxWidth: 420,
    width: '100%',
    margin: '0 auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    textAlign: 'left',
    marginBottom: 4,
  },
  pixIcone: {
    background: '#00b4d8',
    color: '#fff',
    fontWeight: 800,
    fontSize: 13,
    borderRadius: 8,
    padding: '6px 10px',
    letterSpacing: 1,
    flexShrink: 0,
  },
  timer: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 10,
    padding: '8px 18px',
    fontSize: 14,
    color: '#374151',
    width: '100%',
  },
  qrcode: {
    width: 220,
    height: 220,
    margin: '8px auto',
    display: 'block',
    borderRadius: 12,
    border: '2px solid #e5e7eb',
  },
  codigoCaixa: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '12px 14px',
    width: '100%',
    textAlign: 'left',
  },
  codigoTexto: {
    fontSize: 11,
    color: '#374151',
    wordBreak: 'break-all',
    margin: 0,
    fontFamily: 'monospace',
    lineHeight: 1.6,
  },
  btnPrimario: {
    width: '100%',
    padding: '14px',
    background: '#00b4d8',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 15,
    transition: 'background 0.2s',
  },
};
