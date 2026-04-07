import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = '@kifome:carrinho';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // items: [{ produto: {...}, quantidade, restaurante_id }]

  function normalizarItem(it) {
    const quantidade = Number(it?.quantidade || 0);
    const restauranteId = Number(it?.restaurante_id || it?.produto?.restaurante_id || 0);
    return {
      produto: it?.produto,
      quantidade: Number.isFinite(quantidade) ? quantidade : 0,
      restaurante_id: Number.isFinite(restauranteId) ? restauranteId : 0,
    };
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed.map(normalizarItem).filter((it) => it.produto?.id && it.quantidade > 0));
        } else {
          setItems([]);
        }
      }
    } catch (e) { setItems([]); }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) { /* ignore */ }
  }, [items]);

  function addItems(newItems) {
    // newItems: array of {produto, quantidade, restaurante_id}
    // if same produto exists, increment quantity
    setItems(prev => {
      const saneNewItems = (newItems || [])
        .map(normalizarItem)
        .filter((it) => it.produto?.id && it.quantidade > 0);

      const map = {};
      prev.forEach(it => { map[it.produto.id] = { ...it }; });
      saneNewItems.forEach(it => {
        const id = it.produto.id;
        if (map[id]) map[id].quantidade = (map[id].quantidade || 0) + (it.quantidade || 0);
        else map[id] = { produto: it.produto, quantidade: it.quantidade || 0, restaurante_id: it.restaurante_id };
      });
      return Object.values(map);
    });
  }

  function setItemQty(produtoId, quantidade) {
    const qtd = Number(quantidade || 0);
    setItems(prev => prev
      .map(it => it.produto.id === produtoId ? { ...it, quantidade: qtd } : it)
      .filter(it => it.quantidade > 0));
  }

  function removeItem(produtoId) {
    setItems(prev => prev.filter(it => it.produto.id !== produtoId));
  }

  function clearCart() { setItems([]); }

  const count = items.reduce((s, it) => s + (it.quantidade || 0), 0);
  const total = items.reduce((s, it) => s + ((it.produto?.preco || 0) * (it.quantidade || 0)), 0);

  return (
    <CartContext.Provider value={{ items, addItems, setItemQty, removeItem, clearCart, count, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export default CartContext;
