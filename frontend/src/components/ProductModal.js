import React, { useState } from 'react';
import './ProductModal.css';

export default function ProductModal({ produto, restauranteId, onClose, onAdd }) {
  const [qtd, setQtd] = useState(1);
  if (!produto) return null;

  return (
    <div className="pm-bg" onClick={onClose}>
      <div className="pm-card" onClick={e => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose}>✕</button>
        <img className="pm-img" src={produto.imagem_url || 'https://via.placeholder.com/640x320?text=produto'} alt={produto.nome} />
        <div className="pm-body">
          <h2>{produto.nome}</h2>
          {produto.descricao && <p>{produto.descricao}</p>}
          <div className="pm-price">R$ {Number(produto.preco || 0).toFixed(2)}</div>
          <div className="pm-qty">
            <button onClick={() => setQtd(Math.max(1, qtd - 1))}>−</button>
            <span>{qtd}</span>
            <button onClick={() => setQtd(qtd + 1)}>+</button>
          </div>
          <button className="btn btn-primary full" onClick={() => {
            const added = onAdd?.(produto, qtd, restauranteId);
            if (added !== false) onClose?.();
          }}>
            Adicionar • R$ {(Number(produto.preco || 0) * qtd).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
