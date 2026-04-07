import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { pedidoService, restauranteService, usuarioService } from '../../services';
import AddressModal from '../../components/address/AddressModal';
import './FinalizarPedido.css';

const TAXAS = {
  padrao: 4.99,
  rapido: 7.99,
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
  const [abrirEndereco, setAbrirEndereco] = useState(false);

  const restauranteId = items[0]?.restaurante_id;
  const taxaEntrega = items.length > 0 ? TAXAS[entregaTipo] : 0;
  const totalGeral = useMemo(() => total + taxaEntrega, [total, taxaEntrega]);

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
      observacao: observacao || `Pagamento: ${pagamentoTab === 'site' ? 'online' : 'na entrega'} / ${metodoPagamento}`,
    };

    setLoading(true);
    try {
      if (salvarComoPrincipal && usuario?.id) {
        const uResp = await usuarioService.atualizarEndereco(usuario.id, {
          endereco_principal: enderecoFinal,
          endereco_json: enderecoInfo || { formatted_address: enderecoFinal, details: {} },
          latitude: enderecoInfo?.lat ?? null,
          longitude: enderecoInfo?.lng ?? null,
        });
        atualizarUsuario(uResp.usuario);
      }

      await pedidoService.criar(payload);
      clearCart();
      navigate('/meus-pedidos');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Não foi possível concluir seu pedido.');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) return null;

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
              <button className={`delivery-option ${entregaTipo === 'rapido' ? 'active' : ''}`} onClick={() => setEntregaTipo('rapido')}>
                <span className="label">Rápido</span>
                <span className="time">Hoje, 10-25 min</span>
                <strong>R$ {TAXAS.rapido.toFixed(2)}</strong>
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
                  <button className={`pay-item ${metodoPagamento === 'cartao' ? 'selected' : ''}`} onClick={() => setMetodoPagamento('cartao')}>
                    <strong>Cartão no app</strong>
                    <span>Adicione um cartão para pagar com mais agilidade</span>
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
            {loading ? 'Fazendo pedido...' : 'Fazer pedido'}
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
            <div><span>Taxa de entrega</span><strong>R$ {taxaEntrega.toFixed(2)}</strong></div>
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
