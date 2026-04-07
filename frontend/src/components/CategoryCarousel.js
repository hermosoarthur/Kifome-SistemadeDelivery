import React from 'react';

export default function CategoryCarousel({ categories = [], activeId = '', onSelect }) {
  return (
    <div className="cats-scroll">
      {categories.map(c => (
        <button key={c.id} className={`cat-btn ${activeId === c.id ? 'ativo' : ''}`} onClick={() => onSelect?.(c.id)}>
          <span>{c.e}</span><span>{c.l}</span>
        </button>
      ))}
    </div>
  );
}
