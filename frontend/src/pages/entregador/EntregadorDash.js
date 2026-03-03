import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { entregadorService, pedidoService } from '../../services';

export default function EntregadorDash() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [dp, de] = await Promise.allSettled([entregadorService.meuPerfil(), pedidoService.minhasEntregas()]);
        if (dp.status === 'fulfilled') setPerfil(dp.value.entregador);
        if (de.status === 'fulfilled') setEntregas(de.value.entregas || []);
      } catch {} finally { setLoading(false); }
    }
    carregar();
  }, []);

  const stats = {
    total: entregas.length,
    emAndamento: entregas.filter(e => e.status === 'saiu_entrega').length,
    concluidas: entregas.filter(e => e.status === 'entregue').length,
  };

  const VE = { moto: '🏍️', bicicleta: '🚲', carro: '🚗', a_pe: '🚶' };

  if (loading) return <div className="page" style={{ textAlign: 'center', padding: 64 }}>Carregando...</div>;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard do Entregador</h1>

      {!perfil ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: 56 }}>🛵</span>
          <h3 style={{ margin: '16px 0 8px' }}>Configure seu perfil de entregador</h3>
          <p style={{ color: 'var(--texto-sec)', marginBottom: 20 }}>Informe seu veículo para começar a receber entregas</p>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '13px 28px' }} onClick={() => navigate('/perfil')}>Configurar perfil</button>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 18, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>{VE[perfil.veiculo] || '🛵'}</span>
              <div>
                <strong style={{ color: 'var(--sucesso)' }}>Perfil ativo</strong>
                <p style={{ fontSize: 13, color: 'var(--texto-sec)', marginTop: 2 }}>{perfil.veiculo.replace('_', ' ')}{perfil.placa ? ` • ${perfil.placa}` : ''}</p>
              </div>
            </div>
            <span className={`badge ${perfil.ativo ? 'badge-verde' : 'badge-vermelho'}`} style={{ fontSize: 13 }}>
              {perfil.ativo ? '🟢 Disponível' : '🔴 Indisponível'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { l: 'Total de entregas', v: stats.total, i: '📦', c: '#6C63FF' },
              { l: 'Em andamento', v: stats.emAndamento, i: '🛵', c: '#F97316' },
              { l: 'Concluídas', v: stats.concluidas, i: '✅', c: '#10B981' },
            ].map(s => (
              <div key={s.l} className="card" style={{ padding: 18, textAlign: 'center' }}>
                <span style={{ fontSize: 26, display: 'block', marginBottom: 6 }}>{s.i}</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: s.c, display: 'block' }}>{s.v}</span>
                <span style={{ fontSize: 12, color: 'var(--texto-sec)' }}>{s.l}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <button className="card btn" style={{ padding: 20, flexDirection: 'column', gap: 8, border: 'none', cursor: 'pointer', background: '#FFF4F0' }} onClick={() => navigate('/disponivel')}>
              <span style={{ fontSize: 32 }}>🔔</span>
              <strong style={{ color: 'var(--primaria)' }}>Ver pedidos disponíveis</strong>
              <span style={{ fontSize: 13, color: 'var(--texto-sec)' }}>Aceite novas entregas</span>
            </button>
            <button className="card btn" style={{ padding: 20, flexDirection: 'column', gap: 8, border: 'none', cursor: 'pointer', background: '#F0FDF4' }} onClick={() => navigate('/minhas-entregas')}>
              <span style={{ fontSize: 32 }}>🛵</span>
              <strong style={{ color: 'var(--sucesso)' }}>Minhas entregas</strong>
              <span style={{ fontSize: 13, color: 'var(--texto-sec)' }}>Histórico e em andamento</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
