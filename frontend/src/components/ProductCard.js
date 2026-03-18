import React from 'react';
import './ProductCard.css';

export default function ProductCard({ produto, onAdd, showImage = true }) {
  if (!produto) return null;
  return (
    <div className="product-card">
      <div className="product-info">
        {showImage && (
          <div className="product-thumb">
            <img src={produto.imagem_url || 'https://via.placeholder.com/120x120?text=produto'} alt={produto.nome} loading="lazy" />
          </div>
        )}
        <div className="product-copy">
          <h4>{produto.nome}</h4>
          {produto.descricao && <p>{produto.descricao}</p>}
          <span className="product-price">R$ {Number(produto.preco || 0).toFixed(2)}</span>
        </div>
      </div>
      <button className="product-add" onClick={() => onAdd?.(produto)}>+</button>
    </div>
  );
}
