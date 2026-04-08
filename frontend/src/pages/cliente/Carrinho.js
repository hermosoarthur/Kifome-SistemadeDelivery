import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import AddressModal from '../../components/address/AddressModal';
import './Carrinho.css';

function CartItem({ item, onDec, onInc, onRemove }) {
  return (
    <div className="cart-item">
      <div className="cart-item-left">
        <img src={item.produto.imagem_url || 'https://via.placeholder.com/80'} alt={item.produto.nome} />
        <div>
          <strong>{item.produto.nome}</strong>
          <p>R$ {Number(item.produto.preco || 0).toFixed(2)}</p>
        </div>
      </div>
      <div className="cart-item-actions">
        <button className="qtd-btn" onClick={onDec}>−</button>
        <span className="qtd-value">{item.quantidade}</span>
        <button className="qtd-btn add" onClick={onInc}>+</button>
        <button className="remove-btn" onClick={onRemove}>Remover</button>
      </div>
    </div>
  );
}

export default function Carrinho() {
  const { items, setItemQty, removeItem, clearCart, count, total } = useCart();
  const { usuario } = useAuth();
  const [endereco, setEndereco] = useState('');
  const [enderecoInfo, setEnderecoInfo] = useState(null);
  const [abrirEndereco, setAbrirEndereco] = useState(false);
  const [salvarComoPrincipal, setSalvarComoPrincipal] = useState(true);
  const [obs, setObs] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const taxaEntrega = useMemo(() => items.length > 0 ? 6.90 : 0, [items.length]);
  const totalGeral = total + taxaEntrega;

  useEffect(() => {
    const inicial = usuario?.endereco_json || {
      formatted_address: usuario?.endereco_principal || '',
      lat: usuario?.latitude ?? null,
      lng: usuario?.longitude ?? null,
      details: usuario?.endereco_json?.details || {},
    };
    setEnderecoInfo(inicial);
    setEndereco(inicial?.endereco_principal || inicial?.formatted_address || usuario?.endereco_principal || '');
  }, [usuario]);

  async function irParaFinalizacao() {
    setErro('');
    const enderecoFinal = enderecoInfo?.endereco_principal || endereco.trim() || usuario?.endereco_principal || '';
    if (!enderecoFinal.trim()) { setErro('Informe o endereço de entrega'); return; }
    if (items.length === 0) { setErro('Carrinho vazio'); return; }

    const restaurantes = Array.from(new Set(items.map(i => i.restaurante_id)));
    if (restaurantes.length > 1) { setErro('Itens de restaurantes diferentes. Faça pedidos separados.'); return; }

    navigate('/finalizar-pedido', {
      state: {
        endereco: enderecoFinal,
        enderecoInfo,
        salvarComoPrincipal,
        observacao: obs,
      }
    });
  }

  function limparCarrinho() {
    if (items.length === 0) return;
    const confirmar = window.confirm('Deseja limpar todos os itens da sua sacola?');
    if (!confirmar) return;
    clearCart();
  }

  function removerComConfirmacao(item) {
    const confirmar = window.confirm(`Remover "${item?.produto?.nome || 'item'}" da sacola?`);
    if (!confirmar) return;
    removeItem(item.produto.id);
  }

  return (
    <div className="carrinho-page">
      <div className="cart-shell">
        <div className="cart-main">
          <div className="cart-head">
            <div>
              <h2>Meu Carrinho</h2>
              <span className="cart-sub">{count} ite{count !== 1 ? 'ns' : 'm'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="cart-total">R$ {totalGeral.toFixed(2)}</div>
              <button className="btn btn-secondary btn-sm" onClick={limparCarrinho} disabled={items.length === 0}>Limpar sacola</button>
            </div>
          </div>

          {erro && <div className="alert alert-erro" style={{ marginBottom: 12 }}>{erro}</div>}

          <div className="cart-list">
            {items.length === 0 ? (
              <div className="cart-empty">Seu carrinho está vazio.</div>
            ) : items.map(it => (
              <CartItem
                key={it.produto.id}
                item={it}
                onDec={() => setItemQty(it.produto.id, Math.max(0, (it.quantidade || 0) - 1))}
                onInc={() => setItemQty(it.produto.id, (it.quantidade || 0) + 1)}
                onRemove={() => removerComConfirmacao(it)}
              />
            ))}
          </div>
        </div>

        <div className="cart-aside">
          <div className="cart-summary">
            <h3>Resumo</h3>
            <div className="cart-row"><span>Subtotal</span><strong>R$ {total.toFixed(2)}</strong></div>
            <div className="cart-row"><span>Taxa de entrega</span><strong>{taxaEntrega > 0 ? `R$ ${taxaEntrega.toFixed(2)}` : 'Grátis'}</strong></div>
            <div className="cart-row total"><span>Total</span><strong>R$ {totalGeral.toFixed(2)}</strong></div>
            <button className="btn btn-primary full" onClick={irParaFinalizacao} disabled={items.length === 0}>
              Escolher forma de pagamento
            </button>
          </div>

          <div className="cart-form">
            <label>📍 Endereço de entrega *</label>
            <div className="input-box"><input type="text" placeholder="Rua, número, bairro" value={endereco} onChange={e => setEndereco(e.target.value)} /></div>
            <small style={{ display: 'block', marginTop: 6, color: 'var(--texto-sec)', fontSize: 12 }}>
              Entregaremos exatamente no endereço selecionado abaixo.
            </small>
            <button type="button" className="btn btn-secondary full" style={{ marginTop: 8 }} onClick={() => setAbrirEndereco(true)}>
              Escolher no mapa / ajustar pin
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13 }}>
              <input type="checkbox" checked={salvarComoPrincipal} onChange={(e) => setSalvarComoPrincipal(e.target.checked)} />
              Salvar como endereço principal da conta
            </label>
            <label style={{ marginTop: 8 }}>Observação</label>
            <div className="input-box"><textarea placeholder="Ex: sem cebola..." value={obs} onChange={e => setObs(e.target.value)} /></div>
            <button className="btn btn-secondary full" onClick={() => navigate(-1)} style={{ marginTop: 10 }}>Continuar comprando</button>
          </div>
        </div>
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
