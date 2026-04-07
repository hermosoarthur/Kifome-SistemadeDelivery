import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { usuarioService } from '../services';
import AddressModal from './address/AddressModal';
import ilustracaoKifome from '../assets/ilustracao-kifome.png';
import './Header.css';

const ADDRESS_BOOK_KEY = '@kifome:address-book';

function getAddressPreview(usuario = {}) {
  const fromMain = usuario?.endereco_principal?.trim();
  if (fromMain) return fromMain;
  const details = usuario?.endereco_json?.details || {};
  const fallback = [
    [details.logradouro, details.numero].filter(Boolean).join(', '),
    details.bairro,
  ].filter(Boolean).join(' • ');
  return fallback || 'Definir local de entrega';
}

function getAddressDistrict(usuario = {}) {
  const bairro = usuario?.endereco_json?.details?.bairro?.trim();
  if (bairro) return bairro;
  return 'Localização';
}

function toAddressEntry(raw = {}) {
  const details = raw?.details || raw?.endereco_json?.details || {};
  const title = raw?.endereco_principal || raw?.formatted_address || raw?.endereco_json?.formatted_address || '';
  const subtitle = [
    details.bairro,
    [details.cidade, details.uf].filter(Boolean).join(' - '),
  ].filter(Boolean).join(', ');

  if (!title.trim()) return null;
  return {
    id: (raw?.place_id || raw?.id || title).toString(),
    endereco_principal: title,
    formatted_address: raw?.formatted_address || raw?.endereco_json?.formatted_address || title,
    place_id: raw?.place_id || raw?.endereco_json?.place_id || '',
    lat: raw?.lat ?? raw?.latitude ?? raw?.endereco_json?.lat ?? null,
    lng: raw?.lng ?? raw?.longitude ?? raw?.endereco_json?.lng ?? null,
    details,
    subtitle,
  };
}

function loadAddressBook() {
  try {
    const raw = JSON.parse(localStorage.getItem(ADDRESS_BOOK_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.map(toAddressEntry).filter(Boolean);
  } catch {
    return [];
  }
}

function mergeAddressBook(list = [], incoming = null) {
  const normalizedIncoming = toAddressEntry(incoming);
  const all = normalizedIncoming ? [normalizedIncoming, ...list] : [...list];
  const byKey = new Map();
  all.forEach((item) => {
    const key = (item?.endereco_principal || '').trim().toLowerCase();
    if (!key || byKey.has(key)) return;
    byKey.set(key, item);
  });
  return Array.from(byKey.values()).slice(0, 6);
}

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { usuario, atualizarUsuario } = useAuth();
  const { count: cartCount, total: cartTotal } = useCart();
  const [abrirSeletorEndereco, setAbrirSeletorEndereco] = useState(false);
  const [abrirEnderecoMapa, setAbrirEnderecoMapa] = useState(false);
  const [buscaEndereco, setBuscaEndereco] = useState('');
  const [addressBook, setAddressBook] = useState(() => loadAddressBook());
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);
  const [localizandoAtual, setLocalizandoAtual] = useState(false);
  const [erroEndereco, setErroEndereco] = useState('');

  const enderecoInicial = useMemo(() => ({
    formatted_address: usuario?.endereco_json?.formatted_address || usuario?.endereco_principal || '',
    endereco_principal: usuario?.endereco_principal || '',
    lat: usuario?.latitude ?? usuario?.endereco_json?.lat ?? null,
    lng: usuario?.longitude ?? usuario?.endereco_json?.lng ?? null,
    details: usuario?.endereco_json?.details || {},
  }), [usuario]);

  const enderecoPreview = useMemo(() => getAddressPreview(usuario), [usuario]);
  const enderecoBairro = useMemo(() => getAddressDistrict(usuario), [usuario]);
  const temEnderecoPrincipal = Boolean(usuario?.endereco_principal || usuario?.endereco_json?.formatted_address);

  const enderecosFiltrados = useMemo(() => {
    const termo = buscaEndereco.trim().toLowerCase();
    if (!termo) return addressBook;
    return addressBook.filter((item) => {
      const texto = `${item.endereco_principal} ${item.subtitle}`.toLowerCase();
      return texto.includes(termo);
    });
  }, [addressBook, buscaEndereco]);

  useEffect(() => {
    const current = toAddressEntry({
      endereco_principal: usuario?.endereco_principal,
      endereco_json: usuario?.endereco_json,
      latitude: usuario?.latitude,
      longitude: usuario?.longitude,
    });
    const merged = mergeAddressBook(loadAddressBook(), current);
    setAddressBook(merged);
    localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(merged));
  }, [usuario?.endereco_principal, usuario?.endereco_json, usuario?.latitude, usuario?.longitude]);

  async function salvarEnderecoHeader(address) {
    if (!usuario?.id || salvandoEndereco) return;

    setErroEndereco('');
    setSalvandoEndereco(true);
    try {
      const enderecoPrincipal = address?.endereco_principal || address?.formatted_address || enderecoPreview;
      const payload = {
        endereco_principal: enderecoPrincipal,
        endereco_json: {
          ...address,
          endereco_principal: enderecoPrincipal,
        },
        latitude: address?.lat ?? null,
        longitude: address?.lng ?? null,
      };

      const resp = await usuarioService.atualizarEndereco(usuario.id, payload);
      atualizarUsuario(resp?.usuario || payload);
      const merged = mergeAddressBook(addressBook, payload.endereco_json);
      setAddressBook(merged);
      localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(merged));
      setAbrirSeletorEndereco(false);
      setAbrirEnderecoMapa(false);
      setBuscaEndereco('');
    } catch (err) {
      setErroEndereco(err?.response?.data?.erro || 'Não foi possível atualizar o endereço agora.');
    } finally {
      setSalvandoEndereco(false);
    }
  }

  function abrirSeletor() {
    setErroEndereco('');
    setBuscaEndereco('');
    setAbrirSeletorEndereco(true);
  }

  function getCurrentPosition(options) {
    return new Promise((resolve, reject) => {
      if (!navigator?.geolocation) {
        reject(new Error('Geolocalização não suportada'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  async function reverseGeocodeCurrent(lat, lng) {
    const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=18&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`;
    const resp = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    const data = await resp.json();
    const adr = data?.address || {};
    const details = {
      logradouro: adr.road || adr.pedestrian || adr.residential || '',
      numero: adr.house_number || '',
      bairro: adr.suburb || adr.neighbourhood || adr.quarter || '',
      cidade: adr.city || adr.town || adr.village || adr.municipality || '',
      uf: (adr.state_code || adr.state || '').slice(0, 2).toUpperCase(),
      cep: adr.postcode || '',
      complemento: '',
      referencia: '',
    };

    const enderecoPrincipal = data?.display_name
      || [
        [details.logradouro, details.numero].filter(Boolean).join(', '),
        details.bairro,
        [details.cidade, details.uf].filter(Boolean).join(' - '),
      ].filter(Boolean).join(', ');

    return {
      endereco_principal: enderecoPrincipal,
      formatted_address: enderecoPrincipal,
      lat,
      lng,
      place_id: data?.place_id ? String(data.place_id) : '',
      details,
    };
  }

  async function usarLocalizacaoAtual() {
    if (salvandoEndereco || localizandoAtual) return;
    setErroEndereco('');
    setLocalizandoAtual(true);

    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
      const lat = pos?.coords?.latitude;
      const lng = pos?.coords?.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new Error('Não foi possível obter coordenadas válidas.');
      }
      const enderecoAtual = await reverseGeocodeCurrent(lat, lng);
      await salvarEnderecoHeader(enderecoAtual);
    } catch (error) {
      if (error?.code === 1) {
        setErroEndereco('Permissão de localização negada no navegador.');
      } else if (error?.code === 2) {
        setErroEndereco('Não foi possível determinar sua localização atual.');
      } else if (error?.code === 3) {
        setErroEndereco('Tempo esgotado ao tentar obter sua localização.');
      } else {
        setErroEndereco('Falha ao usar localização atual. Tente novamente.');
      }
    } finally {
      setLocalizandoAtual(false);
    }
  }

  return (
    <>
      <div className="layout-topbar">
        <div className="layout-topbar-left">
          <button className="sidebar-toggle" onClick={onToggleSidebar} title="Menu">
            ☰
          </button>

          <div className="topbrand" onClick={() => navigate('/')} title="Kifome">Kifome</div>
          <nav className="top-links">
            <button className="top-link" onClick={() => navigate('/')}>Início</button>

            <button className="top-link" onClick={() => navigate('/restaurantes')}>Restaurantes</button>
            <button className="top-link" onClick={() => navigate('/mercados')}>Mercados</button>
            <button className="top-link" onClick={() => navigate('/bebidas')}>Bebidas</button>
            <button className="top-link" onClick={() => navigate('/farmacias')}>Farmácias</button>
            <button className="top-link" onClick={() => navigate('/pets')}>Pets</button>
            <button className="top-link" onClick={() => navigate('/shopping')}>Shopping</button>
          </nav>
        </div>

        <div className="layout-topbar-center">
          <div className="ifood-search-chip">
            <span className="search-icon"></span>
            <input
              className="ifood-search-input"
              placeholder="Busque por item ou loja"
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/buscar?q=${encodeURIComponent(e.target.value)}`); }}
            />
          </div>
        </div>

        <div className="layout-topbar-right">
          <button
            type="button"
            className={`top-location-chip ${temEnderecoPrincipal ? 'has-address' : ''}`}
            onClick={abrirSeletor}
            title="Alterar local de entrega"
          >
            <span className="top-location-icon">📍</span>
            <span className="top-location-copy">
              <small>{temEnderecoPrincipal ? 'Entregar em' : 'Informe seu endereço'}</small>
              <strong>{enderecoPreview}</strong>
            </span>
            {temEnderecoPrincipal && <span className="top-location-badge">⚡ {enderecoBairro}</span>}
            <span className="top-location-arrow">▾</span>
          </button>
          <button className="icon-btn" onClick={() => navigate('/perfil')}>👤</button>
          <button className="icon-btn" onClick={() => navigate('/carrinho')}>
            🛒 {cartCount > 0 ? `${cartCount} • R$ ${cartTotal.toFixed(2)}` : <span className="cart-small">R$ 0,00</span>}
          </button>
        </div>
      </div>

      {erroEndereco && <div className="topbar-inline-error">{erroEndereco}</div>}

      {abrirSeletorEndereco && (
        <div className="address-selector-backdrop" role="dialog" aria-modal="true">
          <div className="address-selector-card">
            <div className="address-selector-hero">
              <img src={ilustracaoKifome} alt="Entregador em rota" />
            </div>
            <div className="address-selector-head">
              <h3>Onde você quer receber seu pedido?</h3>
              <button
                type="button"
                className="address-selector-close"
                onClick={() => setAbrirSeletorEndereco(false)}
                aria-label="Fechar seleção"
              >
                ✕
              </button>
            </div>

            <div className="address-selector-search">
              <div className="address-selector-search-input-wrap">
                <span>🔎</span>
                <input
                  value={buscaEndereco}
                  onChange={(e) => setBuscaEndereco(e.target.value)}
                  placeholder="Buscar endereço e número"
                />
              </div>
            </div>

            <button
              type="button"
              className="address-selector-add-link"
              disabled={localizandoAtual || salvandoEndereco}
              onClick={() => {
                setAbrirSeletorEndereco(false);
                setAbrirEnderecoMapa(true);
              }}
            >
              + Adicionar novo endereço
            </button>

            <button
              type="button"
              className="address-selector-current-link"
              disabled={localizandoAtual || salvandoEndereco}
              onClick={usarLocalizacaoAtual}
            >
              <span className={`address-selector-current-icon ${localizandoAtual ? 'is-loading' : ''}`} aria-hidden="true">
                {localizandoAtual ? '◌' : '📍'}
              </span>
              {localizandoAtual ? 'Obtendo localização atual...' : 'Usar localização atual'}
            </button>

            <div className="address-selector-list">
              {enderecosFiltrados.length === 0 && (
                <div className="address-selector-empty">Nenhum endereço encontrado. Tente buscar ou adicione um novo.</div>
              )}

              {enderecosFiltrados.map((item) => {
                const ativo = item.endereco_principal === enderecoPreview;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`address-selector-item ${ativo ? 'active' : ''}`}
                    onClick={() => salvarEnderecoHeader(item)}
                    disabled={salvandoEndereco}
                  >
                    <span className="address-selector-item-icon">🕘</span>
                    <span className="address-selector-item-copy">
                      <strong>{item.endereco_principal}</strong>
                      <small>{item.subtitle || 'Endereço salvo'}</small>
                    </span>
                    <span className="address-selector-item-dot">⋮</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AddressModal
        isOpen={abrirEnderecoMapa}
        title="Atualizar endereço principal"
        subtitle="Escolha no mapa ou preencha manualmente para definir o local de entrega."
        confirmLabel={salvandoEndereco ? 'Salvando...' : 'Salvar endereço'}
        initialValue={enderecoInicial}
        required
        onClose={() => !salvandoEndereco && setAbrirEnderecoMapa(false)}
        onSave={salvarEnderecoHeader}
      />
    </>
  );
}