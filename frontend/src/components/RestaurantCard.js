import React from 'react';

const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format',
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&auto=format',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format',
];

export default function RestaurantCard({ restaurante, index = 0, onSelect }) {
  const img = restaurante.imagem_url || FALLBACK_IMGS[index % FALLBACK_IMGS.length];
  const nota = (3.8 + ((index * 0.2) % 1.1)).toFixed(1);
  const tempo = 25 + ((index * 8) % 35);

  return (
    <div className="r-card" onClick={() => onSelect?.(restaurante)}>
      <div className="r-img">
        <img src={img} alt={restaurante.nome_fantasia} loading="lazy" />
        <div className="r-top-badges">
          {restaurante.categoria && <span className="r-tag">{restaurante.categoria}</span>}
          <span className="r-rating-chip">⭐ {nota}</span>
        </div>
      </div>
      <div className="r-body">
        <h3>{restaurante.nome_fantasia}</h3>
        <p>{restaurante.endereco}</p>
        <div className="r-meta">
          <span>🕐 {tempo} min</span>
          <span className="dot">•</span>
          <span style={{ color: 'var(--sucesso)' }}>🚚 Entrega</span>
          <span className="dot">•</span>
          <span>Pedido online</span>
        </div>
        <div className="r-footer">
          <span className="r-price-note">Toque para abrir o cardápio</span>
          <button className="r-pedir-btn">Ver cardápio</button>
        </div>
      </div>
    </div>
  );
}
