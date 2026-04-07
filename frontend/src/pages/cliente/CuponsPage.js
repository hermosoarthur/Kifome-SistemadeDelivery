import React from 'react';

export default function CuponsPage() {
  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <h1>Meus Cupons</h1>
      <div className="cupom-card" style={{ border: '1px dashed #ccc', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
        <h3 style={{ color: '#00a082' }}>FRETEGRATIS</h3>
        <p>Válido para compras acima de R$ 50,00</p>
      </div>
    </div>
  );
}