import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { pedidoService } from '../../services';
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
  const [endereco, setEndereco] = useState('');
  const [obs, setObs] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const taxaEntrega = useMemo(() => items.length > 0 ? 6.90 : 0, [items.length]);
  const totalGeral = total + taxaEntrega;

  async function fazerPedido() {
    setErro('');
    if (!endereco.trim()) { setErro('Informe o endereço de entrega'); return; }
    if (items.length === 0) { setErro('Carrinho vazio'); return; }
    // Verifica se todos os itens são do mesmo restaurante
    const restaurantes = Array.from(new Set(items.map(i => i.restaurante_id)));
    if (restaurantes.length > 1) { setErro('Itens de restaurantes diferentes. Faça pedidos separados.'); return; }

    const payload = {
      restaurante_id: restaurantes[0],
      itens: items.map(i => ({ produto_id: Number(i.produto.id), quantidade: Number(i.quantidade) })),
      endereco_entrega: endereco,
      observacao: obs,
    };

    setLoading(true);
    try {
      await pedidoService.criar(payload);
      clearCart();
      navigate('/meus-pedidos');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar pedido');
    } finally { setLoading(false); }
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
            <div className="cart-total">R$ {totalGeral.toFixed(2)}</div>
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
                onRemove={() => removeItem(it.produto.id)}
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
            <button className="btn btn-primary full" onClick={fazerPedido} disabled={loading || items.length === 0}>
              {loading ? 'Enviando...' : 'Continuar'}
            </button>
          </div>

          <div className="cart-form">
            <label>📍 Endereço de entrega *</label>
            <div className="input-box"><input type="text" placeholder="Rua, número, bairro" value={endereco} onChange={e => setEndereco(e.target.value)} /></div>
            <label style={{ marginTop: 8 }}>Observação</label>
            <div className="input-box"><textarea placeholder="Ex: sem cebola..." value={obs} onChange={e => setObs(e.target.value)} /></div>
            <button className="btn btn-secondary full" onClick={() => navigate(-1)} style={{ marginTop: 10 }}>Continuar comprando</button>
          </div>
        </div>
      </div>
    </div>
  );
}
