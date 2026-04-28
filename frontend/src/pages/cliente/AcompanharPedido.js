import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pedidoService, pagamentoService } from '../../services';
import './AcompanharPedido.css';

// ── Definicao dos steps estilo iFood ─────────────────────────────────────────
const STEPS = [
  {
    key: 'aguardando',
    icon: '🍽️',
    label: 'Pedido recebido',
    desc: 'O restaurante recebeu seu pedido e vai confirmar em breve.',
  },
  {
    key: 'confirmado',
    icon: '✅',
    label: 'Pedido confirmado',
    desc: 'O restaurante confirmou e esta separando seus itens.',
  },
  {
    key: 'preparando',
    icon: '👨‍🍳',
    label: 'Preparando',
    desc: 'Seu pedido esta sendo preparado com carinho.',
  },
  {
    key: 'saiu_para_entrega',
    icon: '🛵',
    label: 'Saiu para entrega',
    desc: 'O entregador pegou seu pedido e esta a caminho.',
  },
  {
    key: 'entregue_aguardando_confirmacao_cliente',
    icon: '📦',
    label: 'Entregue — confirme!',
    desc: 'O entregador chegou. Confirme que voce recebeu o pedido.',
  },
  {
    key: 'entregue',
    icon: '🎉',
    label: 'Concluido',
    desc: 'Pedido entregue. Obrigado por usar o Kifome!',
  },
];

const STEP_KEYS = STEPS.map(s => s.key);

// Tempo estimado por status (em minutos)
const ETA = {
  aguardando: '30–45',
  confirmado: '25–40',
  preparando: '15–30',
  saiu_para_entrega: '5–15',
  entregue_aguardando_confirmacao_cliente: null,
  entregue: null,
  cancelado: null,
};

const PAGAMENTO_LABEL = {
  pix: 'PIX',
  cartao_app: 'Cartao no app',
  dinheiro: 'Dinheiro',
  maquininha: 'Cartao na entrega',
};

// Atrasos automáticos entre cada status de simulação (em segundos)
const SIM_DELAYS = {
  aguardando: 5,
  confirmado: 5,
  preparando: 5,
  saiu_para_entrega: 5,
  entregue_aguardando_confirmacao_cliente: 5,
};

const SIM_MENSAGENS = {
  aguardando: '🍽️ Aguardando o restaurante confirmar...',
  confirmado: '✅ Pedido confirmado! Agora está sendo preparado...',
  preparando: '👨‍🍳 Na cozinha! Em breve o entregador busca...',
  saiu_para_entrega: '🛵 O entregador está a caminho da sua casa!',
};

function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="acomp-stars">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          className={`acomp-star ${s <= (hover || value) ? 'ativa' : ''}`}
          onClick={() => !disabled && onChange(s)}
          onMouseEnter={() => !disabled && setHover(s)}
          onMouseLeave={() => !disabled && setHover(0)}
          disabled={disabled}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function AcompanharPedido() {
  const { pid } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [confirmacaoMsg, setConfirmacaoMsg] = useState('');
  const [avaliacaoAberta, setAvaliacaoAberta] = useState(false);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [avaliacaoMsg, setAvaliacaoMsg] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [simContagem, setSimContagem] = useState(null);
  const [codigoEntrega, setCodigoEntrega] = useState(null);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);
  const timerRef = useRef(null);
  const statusAnteriorRef = useRef(null);
  const pedidoRef = useRef(null);

  const STATUS_SIMULAVEIS = ['aguardando','confirmado','preparando','saiu_para_entrega','entregue_aguardando_confirmacao_cliente'];

  const carregarPedido = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    try {
      const data = await pedidoService.meus();
      const encontrado = (data.pedidos || []).find(p => String(p.id) === String(pid));
      if (!encontrado) { setErro('Pedido nao encontrado.'); return; }
      if (statusAnteriorRef.current && statusAnteriorRef.current !== encontrado.status) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
      statusAnteriorRef.current = encontrado.status;
      pedidoRef.current = encontrado;
      setPedido(encontrado);
      setUltimaAtualizacao(new Date());
    } catch {
      if (!silencioso) setErro('Nao foi possivel carregar o pedido.');
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }, [pid]);

  // Carga inicial
  useEffect(() => { carregarPedido(false); }, [carregarPedido]);

  // Polling 10s
  useEffect(() => {
    const terminais = ['entregue','cancelado'];
    if (pedido && !terminais.includes(pedido.status)) {
      timerRef.current = setInterval(() => carregarPedido(true), 10000);
    }
    return () => clearInterval(timerRef.current);
  }, [pedido?.status, carregarPedido]);

  // ── Simulação: loop async sequencial ─────────────────────────────────────
  useEffect(() => {
    let ativo = true;
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    async function loopSim() {
      // aguarda pedido carregar
      while (ativo && !pedidoRef.current) {
        await sleep(500);
      }

      while (ativo) {
        const p = pedidoRef.current;

        // Espera pagamento aprovado
        if (!p || p.pagamento_status !== 'aprovado') {
          setSimContagem(null);
          await sleep(1000);
          continue;
        }

        // Verifica se há mais passos para simular
        if (!STATUS_SIMULAVEIS.includes(p.status)) {
          setSimContagem(null);
          break; // concluído ou cancelado
        }

        // Countdown 5..1
        for (let seg = 5; seg >= 1; seg--) {
          if (!ativo) return;
          setSimContagem(seg);
          await sleep(1000);
        }
        if (!ativo) return;
        setSimContagem(null);

        // Avança um passo
        try {
          console.log('[sim] avançando de:', pedidoRef.current?.status);
          const resp = await pedidoService.simularPasso(pid);
          console.log('[sim] novo status:', resp.novo_status);
          if (resp.codigo_entrega) setCodigoEntrega(resp.codigo_entrega);

          // Recarrega pedido atualizado
          const data = await pedidoService.meus();
          const encontrado = (data.pedidos || []).find(p2 => String(p2.id) === String(pid));
          if (encontrado) {
            pedidoRef.current = encontrado;
            statusAnteriorRef.current = encontrado.status;
            setPedido(encontrado);
            setUltimaAtualizacao(new Date());
          }
        } catch (err) {
          console.warn('[sim] erro no passo:', err?.response?.data?.erro || err.message);
          // Tenta recarregar pedido e continua
          try {
            const data = await pedidoService.meus();
            const encontrado = (data.pedidos || []).find(p2 => String(p2.id) === String(pid));
            if (encontrado) { pedidoRef.current = encontrado; setPedido(encontrado); }
          } catch {}
          await sleep(3000); // pausa antes de tentar de novo
        }
      }
    }

    loopSim();
    return () => {
      ativo = false;
      setSimContagem(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  // Buscar código de entrega quando status = saiu_para_entrega
  useEffect(() => {
    if (pedido?.status === 'saiu_para_entrega' && !codigoEntrega) {
      pedidoService.codigoEntrega(pedido.id)
        .then(d => setCodigoEntrega(d.codigo))
        .catch(() => {});
    }
  }, [pedido?.status, pedido?.id]);

  async function confirmarRecebimento() {
    setConfirmando(true);
    setConfirmacaoMsg('');
    try {
      await pedidoService.confirmarRecebimento(pedido.id);
      await carregarPedido(true);
      setConfirmacaoMsg('');
    } catch (err) {
      setConfirmacaoMsg(err.response?.data?.erro || 'Erro ao confirmar. Tente novamente.');
    } finally {
      setConfirmando(false);
    }
  }

  async function confirmarPagamentoSandbox() {
    setConfirmandoPagamento(true);
    try {
      await pagamentoService.confirmarSandbox(pedido.id);
      await carregarPedido(true);
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao confirmar pagamento.');
    } finally {
      setConfirmandoPagamento(false);
    }
  }

  async function enviarAvaliacao() {
    if (nota < 1) { setAvaliacaoMsg('Selecione uma nota de 1 a 5 estrelas.'); return; }
    setEnviandoAvaliacao(true);
    setAvaliacaoMsg('');
    try {
      await pedidoService.avaliar(pedido.id, nota, comentario);
      await carregarPedido(true);
      setAvaliacaoAberta(false);
      setAvaliacaoMsg('');
    } catch (err) {
      setAvaliacaoMsg(err.response?.data?.erro || 'Erro ao enviar avaliacao.');
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="acomp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="acomp-spinner" />
          <p style={{ marginTop: 16, color: '#6b7280', fontSize: 14 }}>Carregando seu pedido...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="acomp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>😕</span>
          <p style={{ marginTop: 12, color: '#6b7280' }}>{erro}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/meus-pedidos')}>
            Ver meus pedidos
          </button>
        </div>
      </div>
    );
  }

  if (!pedido) return null;

  const isCancelado = pedido.status === 'cancelado';
  const isConcluido = pedido.status === 'entregue';
  const emAndamento = !isCancelado && !isConcluido;
  const currentStepIdx = STEP_KEYS.indexOf(pedido.status);
  const eta = ETA[pedido.status];
  const restauranteNome = pedido.restaurante?.nome_fantasia || 'Restaurante';
  const subtotal = (pedido.itens || []).reduce((acc, it) => acc + (it.preco_unitario * it.quantidade), 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="acomp-page">

      {/* ── Hero ── */}
      <div className="acomp-hero">
        <button className="acomp-hero-back" onClick={() => navigate('/meus-pedidos')}>
          ← Meus pedidos
        </button>

        {/* Emoji animado */}
        <div className="acomp-status-blob">
          {isCancelado ? '❌' : isConcluido ? '🎉' : STEPS[currentStepIdx]?.icon || '🍔'}
        </div>

        <div className="acomp-pedido-label">Pedido #{pedido.id}</div>
        <div className="acomp-restaurante">{restauranteNome}</div>
        <div className="acomp-subtitle">
          {isCancelado
            ? 'Este pedido foi cancelado.'
            : isConcluido
            ? 'Pedido concluido com sucesso!'
            : `Acompanhe em tempo real • atualiza a cada 10s`}
        </div>
      </div>

      <div className="acomp-body">

        {/* ── Card: Confirmar pagamento sandbox ── */}
        {pedido.pagamento_status === 'pendente' && pedido.pagamento_metodo !== 'dinheiro' && pedido.pagamento_metodo !== 'maquininha' && !isCancelado && (
          <div className="acomp-card" style={{ border: '2px solid #fde047', background: '#fefce8' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 28 }}>💳</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, marginBottom: 4, color: '#854d0e' }}>Pagamento pendente</p>
                <p style={{ fontSize: 13, color: '#92400e', marginBottom: 14 }}>
                  Se você já pagou no Mercado Pago, confirme aqui para o restaurante receber seu pedido.
                </p>
                <button
                  style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 15 }}
                  onClick={confirmarPagamentoSandbox}
                  disabled={confirmandoPagamento}
                >
                  {confirmandoPagamento ? '⏳ Confirmando...' : '✅ Confirmar pagamento recebido'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Card: Simulação automática (demo) ── */}
        {pedido.pagamento_status === 'aprovado' && !isCancelado && !isConcluido && STATUS_SIMULAVEIS.includes(pedido.status) && (
          <div className="acomp-card" style={{ border: '2px dashed #a855f7', background: '#faf5ff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 28 }}>🎬</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, marginBottom: 4, color: '#7c3aed' }}>Simulação automática (demo)</p>
                {simContagem !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 8, background: '#e9d5ff', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg,#a855f7,#7c3aed)',
                        borderRadius: 99,
                        width: `${((5 - simContagem) / 5) * 100}%`,
                        transition: 'width 1s linear',
                      }} />
                    </div>
                    <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700, minWidth: 30 }}>
                      {simContagem}s
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                  O próximo status será aplicado automaticamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Card: Código de entrega (mostrar ao motoboy) ── */}
        {(pedido.status === 'saiu_para_entrega' || pedido.status === 'entregue_aguardando_confirmacao_cliente') && codigoEntrega && (
          <div className="acomp-card" style={{ border: '2px solid #3b82f6', background: '#eff6ff' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#1d4ed8', marginBottom: 8 }}>🔐 Código de confirmação</p>
              <p style={{ fontSize: 13, color: '#3730a3', marginBottom: 16 }}>
                Mostre este código ao entregador para confirmar a entrega:
              </p>
              <div style={{
                fontSize: 42, fontWeight: 900, letterSpacing: 12, color: '#1d4ed8',
                background: '#dbeafe', borderRadius: 14, padding: '16px 24px',
                fontFamily: 'monospace', marginBottom: 10
              }}>
                {codigoEntrega}
              </div>
              <p style={{ fontSize: 11, color: '#6b7280', marginBottom: pedido.status === 'entregue_aguardando_confirmacao_cliente' ? 20 : 0 }}>
                Este código expira em 2 horas após geração
              </p>

              {/* Sem botão manual — a simulação avança automaticamente */}
            </div>
          </div>
        )}

        {/* ── Card: Tempo estimado + polling indicator ── */}
        {emAndamento && eta && (
          <div className="acomp-card">
            <div className="acomp-eta">
              <div className="acomp-eta-icon">⏱️</div>
              <div>
                <div className="acomp-eta-label">Tempo estimado</div>
                <div className="acomp-eta-val">{eta} min</div>
                <div className="acomp-eta-sub">Pode variar conforme o movimento</div>
              </div>
            </div>
            <div className="acomp-polling">
              <div className="acomp-polling-dot" />
              Atualizando automaticamente
              {ultimaAtualizacao && ` • ${ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
            </div>
          </div>
        )}

        {/* ── Card: Entregador ── */}
        {pedido.entregador_id && pedido.status !== 'aguardando' && pedido.status !== 'confirmado' && pedido.status !== 'preparando' && (
          <div className="acomp-card">
            <div className="acomp-section-title">Entregador</div>
            <div className="acomp-entregador">
              <div className="acomp-entregador-avatar">🛵</div>
              <div>
                <div className="acomp-entregador-nome">Entregador Kifome</div>
                <div className="acomp-entregador-info">A caminho do seu endereco</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Card: Pedido concluido ── */}
        {isConcluido && (
          <div className="acomp-card">
            <div className="acomp-concluded">
              <span className="acomp-concluded-emoji">🎉</span>
              <h3>Pedido entregue!</h3>
              <p>Obrigado por pedir no Kifome.<br />Esperamos que voce tenha adorado!</p>
            </div>

            {/* Avaliacao */}
            {!pedido.avaliacao_nota ? (
              <div style={{ marginTop: 20 }}>
                {!avaliacaoAberta ? (
                  <button
                    className="btn-confirmar-grande"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                    onClick={() => setAvaliacaoAberta(true)}
                  >
                    ⭐ Avaliar pedido
                  </button>
                ) : (
                  <div>
                    <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Como foi seu pedido?</p>
                    <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, marginBottom: 10 }}>Toque nas estrelas para avaliar</p>
                    <StarRating value={nota} onChange={setNota} disabled={enviandoAvaliacao} />
                    <textarea
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 14, resize: 'vertical', minHeight: 80, marginTop: 10 }}
                      placeholder="Deixe um comentario (opcional)"
                      value={comentario}
                      onChange={e => setComentario(e.target.value)}
                      maxLength={500}
                      disabled={enviandoAvaliacao}
                    />
                    {avaliacaoMsg && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{avaliacaoMsg}</p>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <button
                        className="btn-confirmar-grande"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                        onClick={enviarAvaliacao}
                        disabled={enviandoAvaliacao || nota === 0}
                      >
                        {enviandoAvaliacao ? 'Enviando...' : 'Enviar avaliacao'}
                      </button>
                      <button
                        style={{ flex: '0 0 auto', padding: '14px 18px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 14, cursor: 'pointer', fontWeight: 600, color: '#374151' }}
                        onClick={() => setAvaliacaoAberta(false)}
                        disabled={enviandoAvaliacao}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: 16, padding: '14px', background: '#fef3c7', borderRadius: 14 }}>
                <p style={{ fontWeight: 700, marginBottom: 6 }}>Sua avaliacao</p>
                <div className="acomp-stars" style={{ pointerEvents: 'none' }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`acomp-star ${s <= pedido.avaliacao_nota ? 'ativa' : ''}`} style={{ cursor: 'default' }}>★</span>
                  ))}
                </div>
                {pedido.avaliacao_comentario && (
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>"{pedido.avaliacao_comentario}"</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Card: Pedido cancelado ── */}
        {isCancelado && (
          <div className="acomp-card" style={{ textAlign: 'center', border: '1.5px solid #fee2e2' }}>
            <span style={{ fontSize: 52, display: 'block', marginBottom: 12 }}>😞</span>
            <h3 style={{ color: '#ef4444', marginBottom: 8 }}>Pedido cancelado</h3>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>Este pedido foi cancelado. Que tal fazer um novo pedido?</p>
            <button className="btn-confirmar-grande" onClick={() => navigate('/')}>
              Explorar restaurantes
            </button>
          </div>
        )}

        {/* ── Card: Progress steps ── */}
        {!isCancelado && (
          <div className="acomp-card">
            <div className="acomp-section-title">Andamento do pedido</div>
            <div className="acomp-steps">
              {STEPS.map((step, idx) => {
                const isDone = currentStepIdx > idx;
                const isActive = currentStepIdx === idx;
                const isPending = currentStepIdx < idx;
                const cls = isDone ? 'done' : isActive ? 'active' : 'pending';
                return (
                  <div key={step.key} className={`acomp-step ${cls}`}>
                    <div className="acomp-step-dot">
                      {isDone ? '✓' : isActive ? '' : step.icon}
                    </div>
                    <div className="acomp-step-info">
                      <div className="acomp-step-label">{step.label}</div>
                      {(isActive || isDone) && (
                        <div className="acomp-step-desc">{step.desc}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Card: Detalhes do pedido ── */}
        <div className="acomp-card">
          <div className="acomp-section-title">Itens do pedido</div>
          {(pedido.itens || []).map(it => (
            <div key={it.id} className="acomp-item-row">
              <div>
                <div className="acomp-item-nome">{it.produto?.nome || `Produto ${it.produto_id}`}</div>
                <div className="acomp-item-qtd">{it.quantidade}x • R$ {Number(it.preco_unitario).toFixed(2)} cada</div>
              </div>
              <div className="acomp-item-preco">
                R$ {(Number(it.preco_unitario) * it.quantidade).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* ── Card: Resumo financeiro ── */}
        <div className="acomp-card">
          <div className="acomp-section-title">Resumo</div>
          <div className="acomp-total-row">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="acomp-total-row">
            <span>Taxa de entrega ({pedido.tipo_entrega === 'rapida' ? 'Rapida' : 'Padrao'})</span>
            <span>R$ {Number(pedido.taxa_entrega || 0).toFixed(2)}</span>
          </div>
          <div className="acomp-total-row final">
            <span>Total</span>
            <span>R$ {Number(pedido.total).toFixed(2)}</span>
          </div>

          {/* Pagamento */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Pagamento:</span>
            <span className={`acomp-pag-chip ${pedido.pagamento_status || 'pendente'}`}>
              {pedido.pagamento_metodo === 'pix' ? '🔵' : pedido.pagamento_metodo === 'cartao_app' ? '💳' : '💵'}
              {' '}{PAGAMENTO_LABEL[pedido.pagamento_metodo] || pedido.pagamento_metodo}
              {pedido.pagamento_status && pedido.pagamento_status !== 'pendente'
                ? ` • ${pedido.pagamento_status}`
                : ''}
            </span>
          </div>
        </div>

        {/* ── Card: Endereco ── */}
        <div className="acomp-card">
          <div className="acomp-section-title">Endereco de entrega</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, marginTop: 2 }}>📍</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{pedido.endereco_entrega}</div>
              {pedido.observacao && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Obs: {pedido.observacao}</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Botao meus pedidos ── */}
        <button
          style={{ width: '100%', padding: '14px', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 14, cursor: 'pointer', fontWeight: 600, color: '#6b7280', fontSize: 14 }}
          onClick={() => navigate('/meus-pedidos')}
        >
          ← Voltar para Meus Pedidos
        </button>

      </div>
    </div>
  );
}
