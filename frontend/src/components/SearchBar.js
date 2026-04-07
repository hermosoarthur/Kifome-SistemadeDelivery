import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

export default function SearchBar({ placeholder = 'Busque por item ou loja' }) {
  const navigate = useNavigate();

  return (
    <div className="ifood-search-chip">
      <span className="search-icon"></span>
      <input className="ifood-search-input" placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/buscar?q=${encodeURIComponent(e.target.value)}`); }} />
    </div>
  );
}
