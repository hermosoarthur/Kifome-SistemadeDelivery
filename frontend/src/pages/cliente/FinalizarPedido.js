import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useCart } from '../../contexts/CartContext';

import { useAuth } from '../../contexts/AuthContext';

import { pedidoService, restauranteService, usuarioService, pagamentoService } from '../../services';

import AddressModal from '../../components/address/AddressModal';

import './FinalizarPedido.css';



const TAXAS = {

  padrao: 4.99,

  rapida: 7.99,

};



export default function FinalizarPedido() {

  const { items, total, clearCart } = useCart();

  const { usuario, atualizarUsuario } = useAuth();

  const location = useLocation();

  const navigate = useNavigate();



  const [restauranteNome, setRestauranteNome] = useState('Seu pedido');

  const [enderecoInfo, setEnderecoInfo] = useState(null);

  const [endereco, setEndereco] = useState('');

  const [observacao, setObservacao] = useState('');

  const [salvarComoPrincipal, setSalvarComoPrincipal] = useState(true);

  const [entregaTipo, setEntregaTipo] = useState('padrao');

  const [pagamentoTab, setPagamentoTab] = useState('site');

  const [metodoPagamento, setMetodoPagamento] = useState('pix');

  const [cupom, setCupom] = useState('');

  const [cpfNota, setCpfNota] = useState('');

  const [erro, setErro] = useState('');

  const [loading, setLoading] = useState(false);

  const [loadingMsg, setLoadingMsg] = useState('Fazendo pedido...');

  const [abrirEndereco, setAbrirEndereco] = useState(false);

  // Estado para aguardar pagamento na nova aba
  const [aguardandoPagamento, setAguardandoPagamento] = useState(null); // { pedidoId, url }
  const pollingRef = useRef(null);
  const mpTabRef = useRef(null);



  const restauranteId = items[0]?.restaurante_id;

  const taxaEntrega = items.length > 0 ? TAXAS[entregaTipo] : 0;

  const totalGeral = useMemo(() => total + taxaEntrega, [total, taxaEntrega]);



  // Sincronizar mÃ©todo de pagamento ao mudar tab

  useEffect(() => {

    if (pagamentoTab === 'site') setMetodoPagamento('pix');

    else setMetodoPagamento('dinheiro');

  }, [pagamentoTab]);



  useEffect(() => {

    if (items.length === 0) {

      navigate('/carrinho', { replace: true });

      return;

    }



    const estado = location.state || {};

    const inicialEnderecoInfo = estado.enderecoInfo || usuario?.endereco_json || {

      formatted_address: usuario?.endereco_principal || '',

      lat: usuario?.latitude ?? null,

      lng: usuario?.longitude ?? null,

      details: usuario?.endereco_json?.details || {},

    };



    setEnderecoInfo(inicialEnderecoInfo);

    setEndereco(estado.endereco || inicialEnderecoInfo?.endereco_principal || inicialEnderecoInfo?.formatted_address || usuario?.endereco_principal || '');

    setObservacao(estado.observacao || '');

    setSalvarComoPrincipal(estado.salvarComoPrincipal !== false);

  }, [items, location.state, navigate, usuario]);



  useEffect(() => {

    async function carregarRestaurante() {

      if (!restauranteId) return;

      try {

        const r = await restauranteService.obter(restauranteId);

        const restaurante = r?.restaurante || r;

        setRestauranteNome(restaurante?.nome_fantasia || 'Seu pedido');

      } catch {

        setRestauranteNome('Seu pedido');

      }

    }

    carregarRestaurante();

  }, [restauranteId]);

  // Limpar polling ao desmontar o componente
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // Ouvir postMessage da aba do MP quando confirmar pagamento
  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.tipo === 'kifome_pagamento_ok') {
        clearInterval(pollingRef.current);
        const pid = event.data.pedidoId || (aguardandoPagamento?.pedidoId);
        if (pid) {
          navigate(`/acompanhar-pedido/${pid}`, { replace: true });
        } else {
          navigate('/meus-pedidos', { replace: true });
        }
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate, aguardandoPagamento]);



  async function confirmarPedido() {

    setErro('');

    const enderecoFinal = enderecoInfo?.endereco_principal || endereco.trim() || usuario?.endereco_principal || '';



    if (!enderecoFinal.trim()) {

      setErro('Informe o endereço de entrega para continuar.');

      return;

    }



    if (items.length === 0) {

      setErro('Sua sacola está vazia.');

      return;

    }



    const restaurantes = Array.from(new Set(items.map((i) => Number(i.restaurante_id))));

    if (restaurantes.length !== 1) {

      setErro('A sacola deve conter itens de um único restaurante.');

      return;

    }



    const payload = {

      restaurante_id: Number(restaurantes[0]),

      itens: items.map((i) => ({ produto_id: Number(i.produto.id), quantidade: Number(i.quantidade) })),

      endereco_entrega: enderecoFinal,

      endereco_coords: {

        lat: enderecoInfo?.lat ?? null,

        lng: enderecoInfo?.lng ?? null,

      },

      endereco_detalhes: enderecoInfo || null,

      observacao: observacao || '',

      tipo_entrega: entregaTipo,

      taxa_entrega: taxaEntrega,

      pagamento_contexto: pagamentoTab,

      pagamento_metodo: metodoPagamento,

    };



    setLoading(true);

    setLoadingMsg('Processando pedido...');



    try {

      // 1. Salvar endereço se solicitado

      if (salvarComoPrincipal && usuario?.id) {

        try {

          const uResp = await usuarioService.atualizarEndereco(usuario.id, {

            endereco_principal: enderecoFinal,

            endereco_json: enderecoInfo || { formatted_address: enderecoFinal, details: {} },

            latitude: enderecoInfo?.lat ?? null,

            longitude: enderecoInfo?.lng ?? null,

          });

          atualizarUsuario(uResp.usuario);

        } catch {

          // salvar endereço não é crítico

        }

      }



      // 2. Criar pedido no backend

      const resp = await pedidoService.criar(payload);

      const pedidoCriado = resp?.pedido;

      console.log('[FinalizarPedido] resp=', resp, 'pedidoCriado=', pedidoCriado, 'metodoPagamento=', metodoPagamento);

      if (!pedidoCriado?.id) {

        throw new Error(resp?.erro || 'Pedido não foi criado. Tente novamente.');

      }

      // 3. Fluxo por método de pagamento

      if ((metodoPagamento === 'cartao_app' || metodoPagamento === 'pix') && pedidoCriado?.id) {

        // Cartão ou PIX via Mercado Pago: criar preference e redirecionar para checkout

        const labelMetodo = metodoPagamento === 'pix' ? 'PIX' : 'Mercado Pago';

        setLoadingMsg(`Redirecionando para pagamento via ${labelMetodo}...`);

        try {

          const pref = await pagamentoService.criarPreferencia(pedidoCriado.id);

          const url = process.env.NODE_ENV === 'production'

            ? pref.init_point

            : (pref.sandbox_init_point || pref.init_point);



          if (url) {

            clearCart();

            // Abrir checkout MP em nova aba
            mpTabRef.current = window.open(url, '_blank', 'noopener');
            setAguardandoPagamento({ pedidoId: pedidoCriado.id, url });
            setLoading(false);

            // Polling a cada 3s:
            // 1) Tenta confirmar sandbox (chama o backend que marca como aprovado)
            // 2) Se já aprovado (ou agora aprovado), redireciona
            // 3) Se a aba do MP foi fechada pelo usuário, também confirma
            const pidPoll = pedidoCriado.id;
            pollingRef.current = setInterval(async () => {
              try {
                // Tenta confirmar — se já aprovado o backend ignora, se pendente confirma
                await pagamentoService.confirmarSandbox(pidPoll);
                // Chegou aqui = confirmado com sucesso
                clearInterval(pollingRef.current);
                if (mpTabRef.current && !mpTabRef.current.closed) mpTabRef.current.close();
                navigate(`/acompanhar-pedido/${pidPoll}`, { replace: true });
              } catch (err) {
                // 403/400 = pedido de outro usuário ou já entregue — parar
                const status = err?.response?.status;
                if (status === 403 || status === 404) clearInterval(pollingRef.current);
                // outros erros: continua tentando
              }
            }, 3000);

            return;

          } else {

            throw new Error('URL de pagamento não recebida do Mercado Pago.');

          }

        } catch (mpErr) {

          // Pedido foi criado mas MP falhou — informa o usuário

          setErro(

            `Pedido #${pedidoCriado.id} criado, mas houve erro ao iniciar o pagamento: ` +

            (mpErr.response?.data?.erro || mpErr.message || 'Tente novamente em Meus Pedidos.')

          );

          setLoading(false);

          return;

        }

      }



      // Dinheiro / maquininha: direto para meus-pedidos

      clearCart();

      navigate('/meus-pedidos');

    } catch (err) {

      setErro(err.response?.data?.erro || 'Não foi possível concluir seu pedido. Tente novamente.');

    } finally {

      setLoading(false);

      setLoadingMsg('Processando pedido...');

    }

  }



  if (items.length === 0 && !aguardandoPagamento) return null;

  // ── Tela de aguardando pagamento na nova aba ──────────────────────────────
  if (aguardandoPagamento) {
    const { pedidoId, url } = aguardandoPagamento;

    async function jaPagei() {
      try {
        await pagamentoService.confirmarSandbox(pedidoId);
        clearInterval(pollingRef.current);
        if (mpTabRef.current && !mpTabRef.current.closed) mpTabRef.current.close();
        navigate(`/acompanhar-pedido/${pedidoId}`, { replace: true });
      } catch (e) {
        alert(e.response?.data?.erro || 'Erro ao confirmar pagamento. Tente novamente.');
      }
    }

    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 460, width: '100%', textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💳</div>
          <h2 style={{ marginBottom: 10 }}>Finalize o pagamento</h2>
          <p style={{ color: '#6b7280', lineHeight: 1.8, marginBottom: 20 }}>
            A aba do Mercado Pago foi aberta.<br />
            Após pagar, clique em <strong>"Já paguei"</strong> abaixo.
          </p>

          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 12, padding: '12px 18px', marginBottom: 24, fontSize: 13, color: '#854d0e' }}>
            ⚠️ <strong>Sandbox:</strong> use a conta teste do Mercado Pago. Após aprovação, clique em "Já paguei".
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Botão principal: já paguei */}
            <button
              style={{ padding: '16px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 800, fontSize: 16 }}
              onClick={jaPagei}
            >
              ✅ Já paguei — acompanhar pedido
            </button>

            {/* Reabrir aba */}
            <button
              style={{ padding: '13px', background: 'linear-gradient(135deg,#ea1d2c,#c41a26)', color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
              onClick={() => {
                if (mpTabRef.current && !mpTabRef.current.closed) {
                  mpTabRef.current.focus();
                } else {
                  mpTabRef.current = window.open(url, '_blank', 'noopener');
                }
              }}
            >
              🔗 Abrir Mercado Pago novamente
            </button>

            <button
              style={{ padding: '12px', background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 14, cursor: 'pointer', fontWeight: 600, color: '#6b7280', fontSize: 14 }}
              onClick={() => { clearInterval(pollingRef.current); navigate('/meus-pedidos'); }}
            >
              Ver meus pedidos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="checkout-page">

      <h1 className="checkout-title">Finalize seu pedido</h1>



      <div className="checkout-grid">

        <section className="checkout-left card">

          <div className="checkout-section">

            <div className="checkout-section-head">

              <h3>Entrega</h3>

              <button className="text-link" onClick={() => setAbrirEndereco(true)}>Trocar</button>

            </div>

            <p className="checkout-address">📍 {endereco || 'Endereço não informado'}</p>



            <div className="delivery-options">

              <button className={`delivery-option ${entregaTipo === 'padrao' ? 'active' : ''}`} onClick={() => setEntregaTipo('padrao')}>

                <span className="label">Padrão</span>

                <span className="time">Hoje, 16-31 min</span>

                <strong>R$ {TAXAS.padrao.toFixed(2)}</strong>

              </button>

              <button className={`delivery-option ${entregaTipo === 'rapida' ? 'active' : ''}`} onClick={() => setEntregaTipo('rapida')}>

                <span className="label">Rápido</span>

                <span className="time">Hoje, 10-25 min</span>

                <strong>R$ {TAXAS.rapido?.toFixed(2) ?? TAXAS.rapida?.toFixed(2)}</strong>

              </button>

            </div>

          </div>



          <div className="checkout-section">

            <div className="payment-tabs">

              <button className={pagamentoTab === 'site' ? 'active' : ''} onClick={() => setPagamentoTab('site')}>Pague pelo site</button>

              <button className={pagamentoTab === 'entrega' ? 'active' : ''} onClick={() => setPagamentoTab('entrega')}>Pague na entrega</button>

            </div>



            <div className="payment-methods">

              {pagamentoTab === 'site' ? (

                <>

                  <button className={`pay-item ${metodoPagamento === 'pix' ? 'selected' : ''}`} onClick={() => setMetodoPagamento('pix')}>

                    <strong>Pague com Pix</strong>

                    <span>Use o QR Code ou copie e cole o código</span>

                  </button>

                  <button className={`pay-item ${metodoPagamento === 'cartao_app' ? 'selected' : ''}`} onClick={() => setMetodoPagamento('cartao_app')}>

                    <strong>Cartão no app</strong>

                    <span>Pague com cartão via Mercado Pago</span>

                  </button>

                </>

              ) : (

                <>

                  <button className={`pay-item ${metodoPagamento === 'dinheiro' ? 'selected' : ''}`} onClick={() => setMetodoPagamento('dinheiro')}>

                    <strong>Dinheiro</strong>

                    <span>Pague ao entregador no recebimento</span>

                  </button>

                  <button className={`pay-item ${metodoPagamento === 'maquininha' ? 'selected' : ''}`} onClick={() => setMetodoPagamento('maquininha')}>

                    <strong>Cartão na entrega</strong>

                    <span>Crédito ou débito na maquininha</span>

                  </button>

                </>

              )}

            </div>

          </div>



          <div className="checkout-section">

            <label>Cupom</label>

            <div className="input-box">

              <input value={cupom} onChange={(e) => setCupom(e.target.value)} placeholder="Código de cupom" />

            </div>



            <label style={{ marginTop: 10 }}>CPF/CNPJ na nota</label>

            <div className="input-box">

              <input value={cpfNota} onChange={(e) => setCpfNota(e.target.value)} placeholder="Digite o CPF/CNPJ" />

            </div>



            <label style={{ marginTop: 10 }}>Observação para o pedido</label>

            <div className="input-box">

              <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: sem cebola" rows={3} />

            </div>



            <label className="save-address-row">

              <input type="checkbox" checked={salvarComoPrincipal} onChange={(e) => setSalvarComoPrincipal(e.target.checked)} />

              Salvar como endereço principal

            </label>

          </div>



          {erro && <div className="alert alert-erro">{erro}</div>}



          <button className="btn btn-primary checkout-confirm" onClick={confirmarPedido} disabled={loading}>

            {loading

              ? loadingMsg

              : metodoPagamento === 'cartao_app'

              ? 'Pagar com cartão →'

              : 'Fazer pedido'}

          </button>

        </section>



        <aside className="checkout-right card">

          <div className="order-head">

            <small>Seu pedido em</small>

            <div className="order-head-line">

              <strong>{restauranteNome}</strong>

              <button className="text-link" onClick={() => navigate(`/restaurante/${restauranteId}`)}>Ver Cardápio</button>

            </div>

          </div>



          <div className="order-items">

            {items.map((item) => (

              <div className="order-item" key={item.produto.id}>

                <div>

                  <strong>{item.quantidade}x {item.produto.nome}</strong>

                  {item.produto.descricao && <p>{item.produto.descricao}</p>}

                </div>

                <strong>R$ {(Number(item.produto.preco || 0) * Number(item.quantidade || 0)).toFixed(2)}</strong>

              </div>

            ))}

          </div>



          <div className="order-totals">

            <div><span>Subtotal</span><strong>R$ {total.toFixed(2)}</strong></div>

            <div><span>Taxa de entrega ({entregaTipo === 'padrao' ? 'Padrão' : 'Rápida'})</span><strong>R$ {taxaEntrega.toFixed(2)}</strong></div>

            <div className="total"><span>Total</span><strong>R$ {totalGeral.toFixed(2)}</strong></div>

          </div>

        </aside>

      </div>



      <AddressModal

        isOpen={abrirEndereco}

        title="Selecionar endereço de entrega"

        confirmLabel="Usar este endereço"

        initialValue={enderecoInfo}

        required

        onClose={() => setAbrirEndereco(false)}

        onSave={(address) => {

          setEnderecoInfo(address);

          setEndereco(address?.endereco_principal || address?.formatted_address || '');

          setAbrirEndereco(false);

        }}

      />

    </div>

  );

}





