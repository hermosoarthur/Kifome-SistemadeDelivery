import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, MarkerF, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import './AddressPicker.css';

const LIBRARIES = ['places'];
const MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
const DEFAULT_CENTER = { lat: -23.55052, lng: -46.633308 };
const AUTOCOMPLETE_OPTIONS = {
  fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
  componentRestrictions: { country: 'br' },
};

function coerceNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeAddress(value = {}) {
  const details = value?.details || {};
  return {
    formatted_address: value?.formatted_address || '',
    place_id: value?.place_id || '',
    lat: coerceNumber(value?.lat),
    lng: coerceNumber(value?.lng),
    details: {
      logradouro: details.logradouro || '',
      numero: details.numero || '',
      bairro: details.bairro || '',
      cidade: details.cidade || '',
      uf: details.uf || '',
      cep: details.cep || '',
      complemento: details.complemento || '',
      referencia: details.referencia || '',
    },
  };
}

function parseAddressComponents(place) {
  const components = place?.address_components || [];
  const byType = (type) => components.find((c) => c.types.includes(type));

  return {
    logradouro: byType('route')?.long_name || '',
    numero: byType('street_number')?.long_name || '',
    bairro: byType('sublocality_level_1')?.long_name || byType('sublocality')?.long_name || byType('neighborhood')?.long_name || '',
    cidade: byType('administrative_area_level_2')?.long_name || byType('locality')?.long_name || '',
    uf: byType('administrative_area_level_1')?.short_name || '',
    cep: byType('postal_code')?.long_name || '',
  };
}

function composeMainAddress(address) {
  if (address.formatted_address) return address.formatted_address;
  const { logradouro, numero, bairro, cidade, uf } = address.details;
  return [
    [logradouro, numero].filter(Boolean).join(', '),
    bairro,
    [cidade, uf].filter(Boolean).join(' - '),
  ].filter(Boolean).join(', ');
}

function composeGeocodeQuery(details = {}) {
  return [
    [details.logradouro, details.numero].filter(Boolean).join(', '),
    details.bairro,
    [details.cidade, details.uf].filter(Boolean).join(' - '),
    details.cep,
    'Brasil',
  ].filter(Boolean).join(', ');
}

function parseNominatimAddressDetails(result = {}) {
  const adr = result?.address || {};
  return {
    logradouro: adr.road || adr.pedestrian || adr.residential || '',
    numero: adr.house_number || '',
    bairro: adr.suburb || adr.neighbourhood || adr.quarter || '',
    cidade: adr.city || adr.town || adr.village || adr.municipality || '',
    uf: (adr.state_code || adr.state || '').slice(0, 2).toUpperCase(),
    cep: adr.postcode || '',
  };
}

export default function AddressPicker({ value, onChange }) {
  const [address, setAddress] = useState(normalizeAddress(value));
  const [autocomplete, setAutocomplete] = useState(null);
  const [mapsAuthError, setMapsAuthError] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchError, setSearchError] = useState('');
  const [locating, setLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');
  const [geoError, setGeoError] = useState('');
  const [cepStatus, setCepStatus] = useState('');
  const [cepError, setCepError] = useState('');
  const lastCepLookupRef = useRef('');
  const addressSnapshotRef = useRef(address);
  const mapRef = useRef(null);

  function panMap(lat, lng, zoom = 16) {
    if (!mapRef.current || typeof lat !== 'number' || typeof lng !== 'number') return;
    mapRef.current.panTo({ lat, lng });
    if (typeof zoom === 'number') mapRef.current.setZoom(zoom);
  }

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: MAPS_KEY || 'missing-key',
    libraries: LIBRARIES,
    language: 'pt-BR',
    region: 'BR',
  });

  const hasMaps = useMemo(() => Boolean(MAPS_KEY && isLoaded && !loadError && !mapsAuthError), [isLoaded, loadError, mapsAuthError]);
  const currentOrigin = useMemo(() => {
    if (typeof window === 'undefined') return 'http://localhost:3001';
    return window.location.origin;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      setMapsAuthError('Falha de autenticação da chave do Google Maps (gm_authFailure).');
      if (typeof previous === 'function') previous();
    };

    return () => {
      if (window.gm_authFailure === previous) return;
      window.gm_authFailure = previous;
    };
  }, []);

  const mapsWarning = useMemo(() => {
    if (!MAPS_KEY) {
      return {
        title: 'Google Maps não configurado neste ambiente.',
        details: [
          'Defina REACT_APP_GOOGLE_MAPS_API_KEY no frontend/.env e reinicie o npm start.',
          `Adicione este origin nas restrições da chave: ${currentOrigin}/*`,
        ],
      };
    }

    if (mapsAuthError) {
      return {
        title: 'Google Maps rejeitou a chave de API neste domínio.',
        details: [
          'Ative o Billing no projeto Google Cloud e confirme que a chave é do mesmo projeto.',
          'Habilite as APIs: Maps JavaScript API, Places API e Geocoding API.',
          `Em HTTP referrers da chave, adicione: ${currentOrigin}/*`,
          `Erro: ${mapsAuthError}`,
        ],
      };
    }

    if (loadError) {
      const raw = String(loadError?.message || 'Falha ao carregar Google Maps API.');
      let hint = 'Verifique se Billing e as APIs Maps JavaScript, Places e Geocoding estão ativas.';
      if (/referer|referrer|notallowed/i.test(raw)) {
        hint = `A chave bloqueou o domínio atual. Adicione ${currentOrigin}/* em HTTP referrers.`;
      } else if (/billing/i.test(raw)) {
        hint = 'Billing não habilitado no Google Cloud para este projeto.';
      } else if (/api.?key|invalidkey|denied|auth/i.test(raw)) {
        hint = 'Chave inválida, removida ou sem permissão para as APIs necessárias.';
      }

      return {
        title: 'Google Maps não carregou corretamente.',
        details: [hint, `Erro: ${raw}`],
      };
    }

    return null;
  }, [loadError, currentOrigin, mapsAuthError]);

  useEffect(() => {
    addressSnapshotRef.current = address;
  }, [address]);

  useEffect(() => {
    const incoming = normalizeAddress(value);
    const incomingSerialized = JSON.stringify(incoming);
    const currentSerialized = JSON.stringify(addressSnapshotRef.current);
    if (incomingSerialized !== currentSerialized) {
      setAddress(incoming);
    }
  }, [value]);

  useEffect(() => {
    onChange?.({ ...address, endereco_principal: composeMainAddress(address) });
  }, [address, onChange]);

  useEffect(() => {
    if (typeof address.lat !== 'number' || typeof address.lng !== 'number') return;
    panMap(address.lat, address.lng);
  }, [address.lat, address.lng]);

  async function geocodeAddress(query, onSuccess) {
    if (!query) return false;

    if (window.google?.maps?.Geocoder) {
      const googleResult = await new Promise((resolve) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: query }, (results, status) => {
          if (status !== 'OK' || !results?.length) {
            resolve(null);
            return;
          }
          const first = results[0];
          const lat = first.geometry?.location?.lat?.();
          const lng = first.geometry?.location?.lng?.();
          if (typeof lat !== 'number' || typeof lng !== 'number') {
            resolve(null);
            return;
          }

          resolve({
            lat,
            lng,
            formatted_address: first.formatted_address,
            place_id: first.place_id,
            raw: first,
          });
        });
      });

      if (googleResult) {
        setAddress((prev) => normalizeAddress({
          ...prev,
          lat: googleResult.lat,
          lng: googleResult.lng,
          formatted_address: googleResult.formatted_address || prev.formatted_address,
          place_id: googleResult.place_id || prev.place_id,
        }));
        panMap(googleResult.lat, googleResult.lng);
        onSuccess?.(googleResult.raw);
        return true;
      }
    }

    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=br&q=${encodeURIComponent(query)}`;
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
        },
      });
      const results = await response.json();
      const first = Array.isArray(results) ? results[0] : null;
      const lat = coerceNumber(first?.lat);
      const lng = coerceNumber(first?.lon);
      if (typeof lat !== 'number' || typeof lng !== 'number') return false;
      const parsed = parseNominatimAddressDetails(first);

      setAddress((prev) => normalizeAddress({
        ...prev,
        lat,
        lng,
        formatted_address: first?.display_name || prev.formatted_address,
        place_id: first?.place_id ? String(first.place_id) : prev.place_id,
        details: {
          ...prev.details,
          ...parsed,
          cep: prev.details.cep || parsed.cep,
        },
      }));
      panMap(lat, lng);
      return true;
    } catch {
      return false;
    }
  }

  async function reverseGeocodeCoordinates(lat, lng) {
    if (window.google?.maps?.Geocoder) {
      const fromGoogle = await new Promise((resolve) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status !== 'OK' || !results?.length) {
            resolve(null);
            return;
          }
          const place = results[0];
          resolve({
            formatted_address: place.formatted_address || '',
            place_id: place.place_id || '',
            details: parseAddressComponents(place),
          });
        });
      });
      if (fromGoogle) return fromGoogle;
    }

    try {
      const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=18&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}`;
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!data) return null;
      return {
        formatted_address: data.display_name || '',
        place_id: data.place_id ? String(data.place_id) : '',
        details: parseNominatimAddressDetails(data),
      };
    } catch {
      return null;
    }
  }

  function getCurrentPositionWithOptions(options) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  async function getCurrentPositionWithRetry() {
    try {
      return await getCurrentPositionWithOptions({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } catch (error) {
      if (error?.code !== 3) throw error;
      return await getCurrentPositionWithOptions({ enableHighAccuracy: false, timeout: 14000, maximumAge: 60000 });
    }
  }

  async function handleSearchAddress(rawQuery) {
    const query = rawQuery?.trim();
    if (!query) return;
    setSearchError('');
    setSearchStatus('Buscando endereço...');

    const success = await geocodeAddress(query);
    if (success) {
      setSearchStatus('Endereço localizado. Ajuste o pin se necessário.');
      return;
    }

    setSearchStatus('');
    setSearchError('Não foi possível localizar este endereço. Tente com número, bairro e cidade.');
  }

  async function handlePlaceChanged() {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (!place) {
      await handleSearchAddress(address.formatted_address);
      return;
    }
    const parsed = parseAddressComponents(place);
    const lat = place?.geometry?.location?.lat?.();
    const lng = place?.geometry?.location?.lng?.();
    const hasPlaceData = Boolean(place?.place_id || place?.formatted_address || (typeof lat === 'number' && typeof lng === 'number'));

    if (!hasPlaceData) {
      await handleSearchAddress(address.formatted_address);
      return;
    }

    const next = normalizeAddress({
      ...address,
      formatted_address: place?.formatted_address || composeMainAddress({ ...address, details: parsed }),
      place_id: place?.place_id || '',
      lat: typeof lat === 'number' ? lat : address.lat,
      lng: typeof lng === 'number' ? lng : address.lng,
      details: {
        ...address.details,
        ...parsed,
      },
    });

    setAddress(next);
    if (mapRef.current && typeof lat === 'number' && typeof lng === 'number') {
      panMap(lat, lng);
      return;
    }

    const fallbackQuery = place?.formatted_address || composeMainAddress(next);
    await handleSearchAddress(fallbackQuery);
  }

  function updateManualField(field, fieldValue) {
    setAddress((prev) => normalizeAddress({
      ...prev,
      details: {
        ...prev.details,
        [field]: fieldValue,
      },
    }));
  }

  function normalizeCep(value = '') {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  async function lookupCep(rawCep) {
    const cepDigits = rawCep.replace(/\D/g, '');
    if (cepDigits.length !== 8) return;
    if (lastCepLookupRef.current === cepDigits) return;

    setCepError('');
    setCepStatus('Buscando endereço pelo CEP...');
    lastCepLookupRef.current = cepDigits;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepStatus('');
        setCepError('CEP não encontrado. Continue preenchendo manualmente.');
        return;
      }

      const updatedDetails = {
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
        cep: normalizeCep(cepDigits),
      };

      setAddress((prev) => normalizeAddress({
        ...prev,
        details: {
          ...prev.details,
          ...updatedDetails,
        },
      }));

      const cepOnlyQuery = `${cepDigits}, Brasil`;
      const foundByCep = await geocodeAddress(cepOnlyQuery);
      if (!foundByCep) {
        const query = composeGeocodeQuery({
          ...addressSnapshotRef.current.details,
          ...updatedDetails,
        });
        await geocodeAddress(query);
      }

      setCepStatus('Endereço preenchido pelo CEP. Confira número e complemento.');
      setCepError('');
    } catch {
      setCepStatus('');
      setCepError('Não foi possível consultar o CEP agora.');
    }
  }

  async function updateFromCoordinates(lat, lng, fallback = '') {
    setAddress((prev) => normalizeAddress({
      ...prev,
      lat,
      lng,
      formatted_address: fallback || prev.formatted_address,
    }));

    const parsed = await reverseGeocodeCoordinates(lat, lng);
    if (!parsed) return;
    setAddress((prev) => normalizeAddress({
      ...prev,
      formatted_address: parsed.formatted_address || prev.formatted_address,
      place_id: parsed.place_id || prev.place_id,
      lat,
      lng,
      details: {
        ...prev.details,
        ...(parsed.details || {}),
      },
    }));
  }

  async function useCurrentLocation() {
    if (locating) return;
    setLocating(true);
    setGeoError('');
    setGeoStatus('Buscando sua localização atual...');

    if (typeof window !== 'undefined' && !window.isSecureContext && !/localhost|127\.0\.0\.1/.test(window.location.hostname)) {
      setGeoStatus('');
      setGeoError('A localização atual exige HTTPS nesse domínio.');
      return;
    }

    if (!navigator.geolocation) {
      setGeoStatus('');
      setGeoError('Seu navegador não suporta geolocalização.');
      setLocating(false);
      return;
    }

    try {
      const pos = await getCurrentPositionWithRetry();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      await updateFromCoordinates(lat, lng, 'Localização atual');
      panMap(lat, lng);
      setGeoStatus('Localização capturada com sucesso.');
      setGeoError('');
    } catch (error) {
      setGeoStatus('');
      if (error?.code === 1) {
        setGeoError('Permissão de localização negada no navegador.');
      } else if (error?.code === 2) {
        setGeoError('Não foi possível determinar sua localização.');
      } else if (error?.code === 3) {
        setGeoError('Tempo esgotado para obter localização atual.');
      } else {
        setGeoError('Falha ao usar localização atual.');
      }
    } finally {
      setLocating(false);
    }
  }

  const mapCenter = useMemo(() => {
    if (typeof address.lat === 'number' && typeof address.lng === 'number') {
      return { lat: address.lat, lng: address.lng };
    }
    return DEFAULT_CENTER;
  }, [address.lat, address.lng]);

  return (
    <div className="address-picker">
      {hasMaps ? (
        <>
          <label className="address-label">Buscar endereço</label>
          <div className="address-search-row">
            <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceChanged} options={AUTOCOMPLETE_OPTIONS}>
              <input
                className="address-input"
                placeholder="Rua, número, bairro"
                value={address.formatted_address}
                onChange={(e) => {
                  setSearchError('');
                  setAddress((prev) => ({ ...prev, formatted_address: e.target.value }));
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  handleSearchAddress(e.currentTarget.value);
                }}
              />
            </Autocomplete>
            <button
              type="button"
              className="btn btn-secondary address-search-btn"
              onClick={() => handleSearchAddress(address.formatted_address)}
            >
              Buscar
            </button>
          </div>

          {searchStatus && <p className="address-status-info">{searchStatus}</p>}
          {searchError && <p className="address-status-error">{searchError}</p>}

          <div className="address-map-wrap">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '260px', borderRadius: 14 }}
              center={mapCenter}
              zoom={15}
              onLoad={(map) => {
                mapRef.current = map;
                if (typeof mapCenter.lat === 'number' && typeof mapCenter.lng === 'number') {
                  panMap(mapCenter.lat, mapCenter.lng, 15);
                }
              }}
              onClick={(e) => {
                const lat = e.latLng?.lat?.();
                const lng = e.latLng?.lng?.();
                if (typeof lat === 'number' && typeof lng === 'number') {
                  updateFromCoordinates(lat, lng);
                }
              }}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
            >
              <MarkerF
                position={mapCenter}
                draggable
                onDragEnd={(e) => {
                  const lat = e.latLng?.lat?.();
                  const lng = e.latLng?.lng?.();
                  if (typeof lat === 'number' && typeof lng === 'number') {
                    updateFromCoordinates(lat, lng);
                  }
                }}
              />
            </GoogleMap>
          </div>

          <button type="button" className="btn btn-secondary" onClick={useCurrentLocation} disabled={locating}>
            {locating ? 'Obtendo localização...' : 'Usar minha localização'}
          </button>

          {geoStatus && <p className="address-status-info">{geoStatus}</p>}
          {geoError && <p className="address-status-error">{geoError}</p>}
        </>
      ) : (
        <div className="address-warning">
          <strong>{mapsWarning?.title || 'Google Maps não configurado.'}</strong>
          <ul className="address-warning-list">
            {(mapsWarning?.details || ['Você ainda pode preencher o endereço manualmente.']).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="address-manual-grid">
        <div className="form-group">
          <label>Logradouro</label>
          <div className="input-box">
            <input value={address.details.logradouro} onChange={(e) => updateManualField('logradouro', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Número</label>
          <div className="input-box">
            <input value={address.details.numero} onChange={(e) => updateManualField('numero', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Bairro</label>
          <div className="input-box">
            <input value={address.details.bairro} onChange={(e) => updateManualField('bairro', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Cidade</label>
          <div className="input-box">
            <input value={address.details.cidade} onChange={(e) => updateManualField('cidade', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>UF</label>
          <div className="input-box">
            <input value={address.details.uf} onChange={(e) => updateManualField('uf', e.target.value.toUpperCase())} maxLength={2} />
          </div>
        </div>
        <div className="form-group">
          <label>CEP</label>
          <div className="input-box">
            <input
              value={address.details.cep}
              onChange={(e) => {
                const masked = normalizeCep(e.target.value);
                updateManualField('cep', masked);
                const digits = masked.replace(/\D/g, '');
                if (digits.length === 8) lookupCep(masked);
              }}
              onBlur={(e) => lookupCep(e.target.value)}
              placeholder="00000-000"
            />
          </div>
        </div>
      </div>

      {cepStatus && <p className="address-status-info">{cepStatus}</p>}
      {cepError && <p className="address-status-error">{cepError}</p>}

      <div className="form-group">
        <label>Complemento</label>
        <div className="input-box">
          <input value={address.details.complemento} onChange={(e) => updateManualField('complemento', e.target.value)} placeholder="Apto, bloco, casa..." />
        </div>
      </div>

      <div className="form-group">
        <label>Referência</label>
        <div className="input-box">
          <input value={address.details.referencia} onChange={(e) => updateManualField('referencia', e.target.value)} placeholder="Perto de..." />
        </div>
      </div>

      <p className="address-preview">
        <strong>Entrega em:</strong> {composeMainAddress(address) || 'Informe os dados do endereço'}
      </p>
    </div>
  );
}
