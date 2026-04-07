import React, { useEffect, useState } from 'react';
import AddressPicker from './AddressPicker';
import './AddressPicker.css';

function hasMinimalAddress(address = {}) {
  const details = address?.details || {};
  if (address?.formatted_address?.trim()) return true;
  return Boolean(details.logradouro && (details.numero || details.bairro));
}

export default function AddressModal({
  isOpen,
  title = 'Escolher endereço',
  subtitle = 'Use o mapa ou preencha manualmente para confirmar o local de entrega.',
  confirmLabel = 'Salvar endereço',
  initialValue,
  required = false,
  onClose,
  onSave,
}) {
  const [draft, setDraft] = useState(initialValue || {});
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(initialValue || {});
      setErro('');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  function handleSave() {
    if (required && !hasMinimalAddress(draft)) {
      setErro('Informe um endereço válido para continuar.');
      return;
    }
    setErro('');
    onSave?.(draft);
  }

  return (
    <div className="address-modal-backdrop" role="dialog" aria-modal="true">
      <div className="address-modal-card">
        <div className="address-modal-header">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="address-close" onClick={onClose} aria-label="Fechar seleção de endereço">
            ✕
          </button>
        </div>

        {erro && <div className="alert alert-erro" style={{ marginBottom: 10 }}>{erro}</div>}

        {required && <div className="address-required-badge">Endereço obrigatório para continuar</div>}

        <div className="address-modal-content">
          <AddressPicker value={draft} onChange={setDraft} />
        </div>

        <div className="address-modal-actions">
          {!required && <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>}
          <button type="button" className="btn btn-primary" onClick={handleSave}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
