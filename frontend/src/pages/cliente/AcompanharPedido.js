// Arquivo: frontend/src/pages/cliente/AcompanharPedido.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pedidoService, pagamentoService } from '../../services';
import { useJsApiLoader, GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api';
import './AcompanharPedido.css';

const GMAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
const GMAPS_LIBRARIES = ['places'];
function lerp(a, b, t) { return a + (b - a) * t; }

// Gera ícone SVG com emoji para usar no Google Maps (evita bug de label)
function emojiIcon(emoji, size = 36) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <text y="${size * 0.82}" font-size="${size * 0.85}" text-anchor="middle" x="${size / 2}">${emoji}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: size, height: size },
    anchor: { x: size / 2, y: size / 2 },
  };
}
const ICON_REST  = emojiIcon('🍽️', 40);
const ICON_DEST  = emojiIcon('📍', 40);
const ICON_MOTO  = emojiIcon('🛵', 44);

function MapaEntrega({ pedido, statusAtivo }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GMAPS_KEY,
    libraries: GMAPS_LIBRARIES,
    language: 'pt-BR',
    region: 'BR',
  });
  const restLat = Number(pedido?.restaurante?.latitude ?? 0);
  const restLng = Number(pedido?.restaurante?.longitude ?? 0);
  const destLat = Number(pedido?.endereco_latitude ?? 0);
  const destLng = Number(pedido?.endereco_longitude ?? 0);
  const temCoords = restLat !== 0 && destLat !== 0;
  const [motoboyPos, setMotoboyPos] = useState({ lat: restLat, lng: restLng });
  const animRef = useRef(null);
  const progRef = useRef(0);
  const emMovimento = ['saiu_para_entrega','entregue_aguardando_confirmacao_cliente'].includes(statusAtivo);

  useEffect(() => {
    clearInterval(animRef.current);
    if (!temCoords) return;
    if (statusAtivo === 'entregue_aguardando_confirmacao_cliente') {
      setMotoboyPos({ lat: destLat, lng: destLng });
      return;
    }
    if (statusAtivo === 'saiu_para_entrega') {
      progRef.current = 0;
      animRef.current = setInterval(() => {
        progRef.current = Math.min(1, progRef.current + 250 / 35000);
        const t = progRef.current;
        const ts = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
        setMotoboyPos({ lat: lerp(restLat, destLat, ts), lng: lerp(restLng, destLng, ts) });
        if (progRef.current >= 1) clearInterval(animRef.current);
      }, 250);
    } else {
      setMotoboyPos({ lat: restLat, lng: restLng });
    }
    return () => clearInterval(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusAtivo, restLat, restLng, destLat, destLng]);

  if (!isLoaded || !temCoords) {
    return (
      <div style={{height:200,background:'#f3f4f6',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',fontSize:13}}>
        {!isLoaded ? 'Carregando mapa...' : 'Endereco sem coordenadas'}
      </div>
    );
  }
  const centro = { lat: lerp(restLat, destLat, 0.5), lng: lerp(restLng, destLng, 0.5) };
  const rota = [{ lat: restLat, lng: restLng }, { lat: destLat, lng: destLng }];
  return (
    <div style={{borderRadius:14,overflow:'hidden',border:'1.5px solid #e5e7eb'}}>
      <GoogleMap mapContainerStyle={{width:'100%',height:260}} center={centro} zoom={13} options={{streetViewControl:false,mapTypeControl:false}}>
        <PolylineF path={rota} options={{strokeColor:'#F2631F',strokeWeight:4,strokeOpacity:0.75}} />
        <MarkerF position={{lat:restLat,lng:restLng}} icon={ICON_REST} title={pedido?.restaurante?.nome_fantasia||'Restaurante'} />
        <MarkerF position={{lat:destLat,lng:destLng}} icon={ICON_DEST} title={pedido?.endereco_entrega||'Destino'} />
        {emMovimento && <MarkerF position={motoboyPos} icon={ICON_MOTO} title="Entregador" />}
      </GoogleMap>
      {emMovimento && (
        <div style={{padding:'10px 14px',background:'linear-gradient(90deg,#fff7ed,#ffedd5)',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:20}}></span>
          <div>
            <p style={{margin:0,fontWeight:700,fontSize:13,color:'#c2410c'}}>
              {statusAtivo==='entregue_aguardando_confirmacao_cliente' ? 'Entregador chegou!' : 'Entregador a caminho...'}
            </p>
            <p style={{margin:0,fontSize:11,color:'#9a3412'}}>Acompanhe em tempo real</p>
          </div>
        </div>
      )}
    </div>
  );
}

const STEPS = [
  {key:'aguardando',icon:'',label:'Pedido recebido',desc:'O restaurante recebeu seu pedido.'},
  {key:'confirmado',icon:'',label:'Pedido confirmado',desc:'O restaurante confirmou e está separando.'},
  {key:'preparando',icon:'',label:'Preparando',desc:'Seu pedido está sendo preparado.'},
  {key:'saiu_para_entrega',icon:'',label:'Saiu para entrega',desc:'O entregador está a caminho.'},
  {key:'entregue_aguardando_confirmacao_cliente',icon:'',label:'Entregue  confirme!',desc:'Confirme que você recebeu o pedido.'},
  {key:'entregue',icon:'',label:'Concluído',desc:'Obrigado por usar o Kifome!'},
];
const STEP_KEYS = STEPS.map(s => s.key);
const STATUS_SIMULAVEIS = ['aguardando','confirmado','preparando','saiu_para_entrega','entregue_aguardando_confirmacao_cliente'];
const ETA = {aguardando:'30-45',confirmado:'25-40',preparando:'15-30',saiu_para_entrega:'5-15'};
const PAGAMENTO_LABEL = {pix:'PIX',cartao_app:'Cartao no app',dinheiro:'Dinheiro',maquininha:'Cartao na entrega'};

function StarRating({value,onChange,disabled}) {
  const [hover,setHover] = useState(0);
  return (
    <div className="acomp-stars">
      {[1,2,3,4,5].map(s => (
        <button key={s} className={`acomp-star ${s<=(hover||value)?'ativa':''}`}
          onClick={()=>!disabled&&onChange(s)} onMouseEnter={()=>!disabled&&setHover(s)}
          onMouseLeave={()=>!disabled&&setHover(0)} disabled={disabled}>
          
        </button>
      ))}
    </div>
  );
}

export default function AcompanharPedido() {
  const {pid} = useParams();
  const navigate = useNavigate();
  const [pedido,setPedido] = useState(null);
  const [carregando,setCarregando] = useState(true);
  const [erro,setErro] = useState('');
  const [codigoEntrega,setCodigoEntrega] = useState(null);
  const [simContagem,setSimContagem] = useState(null);
  const [simMsg,setSimMsg] = useState('');
  const [avancandoManual,setAvancandoManual] = useState(false);
  const [confirmandoPag,setConfirmandoPag] = useState(false);
  const [avaliacaoAberta,setAvaliacaoAberta] = useState(false);
  const [nota,setNota] = useState(0);
  const [comentario,setComentario] = useState('');
  const [enviandoAv,setEnviandoAv] = useState(false);
  const [avaliacaoMsg,setAvaliacaoMsg] = useState('');
  const [ultimaAt,setUltimaAt] = useState(null);
  const pedidoRef  = useRef(null);
  const simAtivo   = useRef(false);
  const emChamada  = useRef(false); // mutex: evita chamadas concorrentes
  const timerRef   = useRef(null);
  const statusPrev = useRef(null);
  const pidRef     = useRef(pid);
  pidRef.current   = pid;

  const carregarPedido = useCallback(async (silencioso=false) => {
    if (!silencioso) setCarregando(true);
    try {
      const data = await pedidoService.meus();
      const p = (data.pedidos||[]).find(x=>String(x.id)===String(pidRef.current));
      if (!p) { setErro('Pedido nao encontrado.'); return null; }
      if (statusPrev.current && statusPrev.current!==p.status && navigator.vibrate) navigator.vibrate([100,50,100]);
      statusPrev.current = p.status;
      pedidoRef.current = p;
      setPedido(p);
      setUltimaAt(new Date());
      return p;
    } catch {
      if (!silencioso) setErro('Nao foi possivel carregar o pedido.');
      return null;
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarPedido(false); }, [carregarPedido]);

  useEffect(() => {
    if (pedido && !['entregue','cancelado'].includes(pedido.status)) {
      timerRef.current = setInterval(() => carregarPedido(true), 10000);
    }
    return () => clearInterval(timerRef.current);
  }, [pedido?.status, carregarPedido]);

  // Avança um passo — usa sempre refs para nunca ter closure stale
  const executarPasso = useCallback(async () => {
    if (emChamada.current) return false; // já tem uma chamada em andamento
    emChamada.current = true;
    const p = pedidoRef.current;
    if (!p) { emChamada.current = false; return false; }
    console.log('[sim] executarPasso — status atual:', p.status);
    try {
      if (p.status === 'entregue_aguardando_confirmacao_cliente') {
        setSimMsg('Confirmando recebimento e enviando NF por e-mail...');
        console.log('[sim] chamando confirmarRecebimento para pedido', pidRef.current);
        await pedidoService.confirmarRecebimento(pidRef.current);
        await carregarPedido(true);
        setSimMsg('');
        emChamada.current = false;
        return 'entregue';
      } else {
        console.log('[sim] chamando simularPasso para pedido', pidRef.current);
        const resp = await pedidoService.simularPasso(pidRef.current);
        console.log('[sim] simularPasso resposta:', resp);
        if (resp.codigo_entrega) setCodigoEntrega(resp.codigo_entrega);
        await carregarPedido(true);
        setSimMsg('');
        emChamada.current = false;
        return resp.novo_status;
      }
    } catch (err) {
      const msg = err?.response?.data?.erro || err?.message || 'Erro desconhecido';
      console.error('[sim] ERRO:', msg, err);
      setSimMsg('⚠️ ' + msg);
      await carregarPedido(true);
      emChamada.current = false;
      return false;
    }
  }, [carregarPedido]);

  // Loop de simulação automática
  useEffect(() => {
    simAtivo.current = true;
    emChamada.current = false;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    async function loop() {
      // Aguarda o pedido carregar
      let w = 0;
      while (simAtivo.current && !pedidoRef.current && w < 60) { await sleep(500); w++; }
      while (simAtivo.current) {
        const p = pedidoRef.current;
        if (!p) { await sleep(1000); continue; }
        if (p.pagamento_status !== 'aprovado') {
          setSimContagem(null);
          setSimMsg('Aguardando confirmacao de pagamento...');
          await sleep(3000);
          continue;
        }
        if (!STATUS_SIMULAVEIS.includes(p.status)) {
          setSimContagem(null);
          setSimMsg('');
          console.log('[sim] status fora da sequencia, loop encerrado:', p.status);
          break;
        }
        setSimMsg('');
        // Contagem regressiva
        for (let s = 5; s >= 1; s--) {
          if (!simAtivo.current) return;
          setSimContagem(s);
          await sleep(1000);
          // Re-checa o status no meio da contagem (atualização pode ter chegado)
          const atualizado = pedidoRef.current;
          if (atualizado && !STATUS_SIMULAVEIS.includes(atualizado.status)) {
            setSimContagem(null); setSimMsg(''); return;
          }
        }
        if (!simAtivo.current) return;
        setSimContagem(null);
        const ok = await executarPasso();
        if (!ok) {
          console.warn('[sim] passo falhou, aguardando 5s antes de tentar novamente');
          await sleep(5000);
        }
      }
    }
    loop();
    return () => { simAtivo.current = false; setSimContagem(null); setSimMsg(''); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  useEffect(() => {
    if (pedido?.status === 'saiu_para_entrega' && !codigoEntrega) {
      pedidoService.codigoEntrega(pedido.id).then(d => setCodigoEntrega(d.codigo)).catch(()=>{});
    }
  }, [pedido?.status, pedido?.id, codigoEntrega]);

  async function avancarManual() {
    if (avancandoManual || emChamada.current) return;
    setAvancandoManual(true);
    await executarPasso();
    setAvancandoManual(false);
  }

  async function confirmarPagamentoSandbox() {
    setConfirmandoPag(true);
    try {
      await pagamentoService.confirmarSandbox(pedido.id);
      await carregarPedido(true);
    } catch(err) {
      alert(err.response?.data?.erro||'Erro ao confirmar pagamento.');
    } finally { setConfirmandoPag(false); }
  }

  async function enviarAvaliacao() {
    if (nota<1) { setAvaliacaoMsg('Selecione uma nota de 1 a 5 estrelas.'); return; }
    setEnviandoAv(true); setAvaliacaoMsg('');
    try {
      await pedidoService.avaliar(pedido.id, nota, comentario);
      await carregarPedido(true);
      setAvaliacaoAberta(false);
    } catch(err) {
      setAvaliacaoMsg(err.response?.data?.erro||'Erro ao enviar avaliacao.');
    } finally { setEnviandoAv(false); }
  }

  if (carregando) return (
    <div className="acomp-page" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:300}}>
      <div style={{textAlign:'center'}}><div className="acomp-spinner"/><p style={{marginTop:16,color:'#6b7280',fontSize:14}}>Carregando...</p></div>
    </div>
  );

  if (erro) return (
    <div className="acomp-page" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:300}}>
      <div style={{textAlign:'center'}}>
        <span style={{fontSize:48}}></span>
        <p style={{marginTop:12,color:'#6b7280'}}>{erro}</p>
        <button className="btn btn-primary" style={{marginTop:16}} onClick={()=>navigate('/meus-pedidos')}>Ver meus pedidos</button>
      </div>
    </div>
  );

  if (!pedido) return null;

  const isCancelado=pedido.status==='cancelado';
  const isConcluido=pedido.status==='entregue';
  const emAndamento=!isCancelado&&!isConcluido;
  const currentStepIdx=STEP_KEYS.indexOf(pedido.status);
  const eta=ETA[pedido.status];
  const subtotal=(pedido.itens||[]).reduce((a,it)=>a+it.preco_unitario*it.quantidade,0);
  const pagAprovado=pedido.pagamento_status==='aprovado';
  const podeSim=pagAprovado&&!isCancelado&&!isConcluido&&STATUS_SIMULAVEIS.includes(pedido.status);

  return (
    <div className="acomp-page">
      <div className="acomp-hero">
        <button className="acomp-hero-back" onClick={()=>navigate('/meus-pedidos')}> Meus pedidos</button>
        <div className="acomp-status-blob">{isCancelado?'':isConcluido?'':STEPS[currentStepIdx]?.icon||''}</div>
        <div className="acomp-pedido-label">Pedido #{pedido.id}</div>
        <div className="acomp-restaurante">{pedido.restaurante?.nome_fantasia||'Restaurante'}</div>
        <div className="acomp-subtitle">
          {isCancelado?'Este pedido foi cancelado.':isConcluido?'Pedido concluido com sucesso!':'Acompanhe em tempo real'}
        </div>
      </div>

      <div className="acomp-body">

        {pedido.pagamento_status==='pendente'&&!['dinheiro','maquininha'].includes(pedido.pagamento_metodo)&&!isCancelado&&(
          <div className="acomp-card" style={{border:'2px solid #fde047',background:'#fefce8'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <span style={{fontSize:28}}></span>
              <div style={{flex:1}}>
                <p style={{fontWeight:700,marginBottom:4,color:'#854d0e'}}>Pagamento pendente</p>
                <p style={{fontSize:13,color:'#92400e',marginBottom:14}}>Confirme o pagamento para liberar a simulacao.</p>
                <button style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontWeight:700,fontSize:15}}
                  onClick={confirmarPagamentoSandbox} disabled={confirmandoPag}>
                  {confirmandoPag?'Confirmando...':' Confirmar pagamento recebido'}
                </button>
              </div>
            </div>
          </div>
        )}

        {podeSim&&(
          <div className="acomp-card" style={{border:'2px dashed #a855f7',background:'#faf5ff'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <span style={{fontSize:28}}></span>
              <div style={{flex:1}}>
                <p style={{fontWeight:700,marginBottom:6,color:'#7c3aed'}}>Simulacao automatica (demo)</p>
                {simContagem!==null&&(
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                    <div style={{flex:1,height:8,background:'#e9d5ff',borderRadius:99,overflow:'hidden'}}>
                      <div style={{height:'100%',background:'linear-gradient(90deg,#a855f7,#7c3aed)',borderRadius:99,width:`${((5-simContagem)/5)*100}%`,transition:'width 1s linear'}} />
                    </div>
                    <span style={{fontSize:13,color:'#7c3aed',fontWeight:700,minWidth:24}}>{simContagem}s</span>
                  </div>
                )}
                {simMsg&&<p style={{fontSize:12,color:'#7c3aed',marginBottom:8,padding:'6px 10px',background:'#ede9fe',borderRadius:8}}>{simMsg}</p>}
                <p style={{fontSize:12,color:'#9ca3af',marginBottom:10}}>
                  Status: <b style={{color:'#6d28d9'}}>{pedido.status}</b>
                  {pedido.status==='entregue_aguardando_confirmacao_cliente'?'  confirmar + enviar NF por email':'  avanca em 5s'}
                </p>
                <button onClick={avancarManual} disabled={avancandoManual || emChamada.current}
                  style={{width:'100%',padding:'12px',background:(avancandoManual||emChamada.current)?'#e9d5ff':'linear-gradient(135deg,#a855f7,#7c3aed)',color:'#fff',border:'none',borderRadius:10,cursor:(avancandoManual||emChamada.current)?'not-allowed':'pointer',fontWeight:700,fontSize:13}}>
                  {avancandoManual?'Avancando...'
                    :pedido.status==='entregue_aguardando_confirmacao_cliente'
                    ?'📬 Confirmar recebimento (envia NF por e-mail)'
                    :'⏩ Avancar agora (manual)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {['confirmado','preparando','saiu_para_entrega','entregue_aguardando_confirmacao_cliente'].includes(pedido.status)&&(
          <div className="acomp-card">
            <p style={{fontWeight:700,marginBottom:10}}> Rota de entrega</p>
            <MapaEntrega pedido={pedido} statusAtivo={pedido.status} />
          </div>
        )}

        {['saiu_para_entrega','entregue_aguardando_confirmacao_cliente'].includes(pedido.status)&&codigoEntrega&&(
          <div className="acomp-card" style={{border:'2px solid #3b82f6',background:'#eff6ff'}}>
            <div style={{textAlign:'center'}}>
              <p style={{fontWeight:700,fontSize:15,color:'#1d4ed8',marginBottom:8}}> Codigo de confirmacao</p>
              <p style={{fontSize:13,color:'#3730a3',marginBottom:16}}>Mostre este codigo ao entregador:</p>
              <div style={{fontSize:42,fontWeight:900,letterSpacing:12,color:'#1d4ed8',background:'#dbeafe',borderRadius:14,padding:'16px 24px',fontFamily:'monospace',marginBottom:10}}>
                {codigoEntrega}
              </div>
              <p style={{fontSize:11,color:'#6b7280'}}>Expira em 2 horas apos geracao</p>
            </div>
          </div>
        )}

        {emAndamento&&eta&&(
          <div className="acomp-card">
            <div className="acomp-eta">
              <div className="acomp-eta-icon"></div>
              <div>
                <div className="acomp-eta-label">Tempo estimado</div>
                <div className="acomp-eta-val">{eta} min</div>
                <div className="acomp-eta-sub">Pode variar conforme o movimento</div>
              </div>
            </div>
            <div className="acomp-polling">
              <div className="acomp-polling-dot"/>
              Atualizando automaticamente
              {ultimaAt&&`  ${ultimaAt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}`}
            </div>
          </div>
        )}

        {pedido.entregador_id&&!['aguardando','confirmado','preparando'].includes(pedido.status)&&(
          <div className="acomp-card">
            <div className="acomp-section-title">Entregador</div>
            <div className="acomp-entregador">
              <div className="acomp-entregador-avatar"></div>
              <div><div className="acomp-entregador-nome">Entregador Kifome</div><div className="acomp-entregador-info">A caminho do seu endereco</div></div>
            </div>
          </div>
        )}

        {isConcluido&&(
          <div className="acomp-card">
            <div className="acomp-concluded">
              <span className="acomp-concluded-emoji"></span>
              <h3>Pedido entregue!</h3>
              <p>Obrigado por pedir no Kifome!<br/> A nota fiscal foi enviada para o seu e-mail.</p>
            </div>
            {!pedido.avaliacao_nota?(
              <div style={{marginTop:20}}>
                {!avaliacaoAberta?(
                  <button className="btn-confirmar-grande" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}} onClick={()=>setAvaliacaoAberta(true)}>
                     Avaliar pedido
                  </button>
                ):(
                  <div>
                    <p style={{textAlign:'center',fontWeight:700,fontSize:16,marginBottom:4}}>Como foi seu pedido?</p>
                    <StarRating value={nota} onChange={setNota} disabled={enviandoAv}/>
                    <textarea style={{width:'100%',padding:'10px 14px',borderRadius:12,border:'1px solid #e5e7eb',fontSize:14,resize:'vertical',minHeight:80,marginTop:10,boxSizing:'border-box'}}
                      placeholder="Comentario (opcional)" value={comentario} onChange={e=>setComentario(e.target.value)} maxLength={500} disabled={enviandoAv}/>
                    {avaliacaoMsg&&<p style={{color:'#ef4444',fontSize:13,marginTop:8}}>{avaliacaoMsg}</p>}
                    <div style={{display:'flex',gap:10,marginTop:14}}>
                      <button className="btn-confirmar-grande" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}} onClick={enviarAvaliacao} disabled={enviandoAv||nota===0}>
                        {enviandoAv?'Enviando...':'Enviar avaliacao'}
                      </button>
                      <button style={{flex:'0 0 auto',padding:'14px 18px',background:'none',border:'1px solid #e5e7eb',borderRadius:14,cursor:'pointer',fontWeight:600,color:'#374151'}} onClick={()=>setAvaliacaoAberta(false)} disabled={enviandoAv}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            ):(
              <div style={{textAlign:'center',marginTop:16,padding:'14px',background:'#fef3c7',borderRadius:14}}>
                <p style={{fontWeight:700,marginBottom:6}}>Sua avaliacao</p>
                <div className="acomp-stars" style={{pointerEvents:'none'}}>
                  {[1,2,3,4,5].map(s=><span key={s} className={`acomp-star ${s<=pedido.avaliacao_nota?'ativa':''}`} style={{cursor:'default'}}></span>)}
                </div>
                {pedido.avaliacao_comentario&&<p style={{fontSize:13,color:'#6b7280',marginTop:6}}>"{pedido.avaliacao_comentario}"</p>}
              </div>
            )}
          </div>
        )}

        {isCancelado&&(
          <div className="acomp-card" style={{textAlign:'center',border:'1.5px solid #fee2e2'}}>
            <span style={{fontSize:52,display:'block',marginBottom:12}}></span>
            <h3 style={{color:'#ef4444',marginBottom:8}}>Pedido cancelado</h3>
            <p style={{color:'#6b7280',fontSize:14,marginBottom:20}}>Que tal fazer um novo pedido?</p>
            <button className="btn-confirmar-grande" onClick={()=>navigate('/')}>Explorar restaurantes</button>
          </div>
        )}

        {!isCancelado&&(
          <div className="acomp-card">
            <div className="acomp-section-title">Andamento do pedido</div>
            <div className="acomp-steps">
              {STEPS.map((step,idx)=>{
                const isDone=currentStepIdx>idx;
                const isActive=currentStepIdx===idx;
                const cls=isDone?'done':isActive?'active':'pending';
                return (
                  <div key={step.key} className={`acomp-step ${cls}`}>
                    <div className="acomp-step-dot">{isDone?'':isActive?'':step.icon}</div>
                    <div className="acomp-step-info">
                      <div className="acomp-step-label">{step.label}</div>
                      {(isActive||isDone)&&<div className="acomp-step-desc">{step.desc}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="acomp-card">
          <div className="acomp-section-title">Itens do pedido</div>
          {(pedido.itens||[]).map(it=>(
            <div key={it.id} className="acomp-item-row">
              <div>
                <div className="acomp-item-nome">{it.produto?.nome||`Produto ${it.produto_id}`}</div>
                <div className="acomp-item-qtd">{it.quantidade}x  R$ {Number(it.preco_unitario).toFixed(2)} cada</div>
              </div>
              <div className="acomp-item-preco">R$ {(Number(it.preco_unitario)*it.quantidade).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="acomp-card">
          <div className="acomp-section-title">Resumo</div>
          <div className="acomp-total-row"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
          <div className="acomp-total-row"><span>Taxa de entrega ({pedido.tipo_entrega==='rapida'?'Rapida':'Padrao'})</span><span>R$ {Number(pedido.taxa_entrega||0).toFixed(2)}</span></div>
          <div className="acomp-total-row final"><span>Total</span><span>R$ {Number(pedido.total).toFixed(2)}</span></div>
          <div style={{marginTop:14,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span style={{fontSize:13,color:'#6b7280'}}>Pagamento:</span>
            <span className={`acomp-pag-chip ${pedido.pagamento_status||'pendente'}`}>
              {pedido.pagamento_metodo==='pix'?'':pedido.pagamento_metodo==='cartao_app'?'':''}
              {' '}{PAGAMENTO_LABEL[pedido.pagamento_metodo]||pedido.pagamento_metodo}
              {pedido.pagamento_status&&pedido.pagamento_status!=='pendente'?`  ${pedido.pagamento_status}`:''}
            </span>
          </div>
        </div>

        <div className="acomp-card">
          <div className="acomp-section-title">Endereco de entrega</div>
          <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            <span style={{fontSize:22,marginTop:2}}></span>
            <div>
              <div style={{fontWeight:600,fontSize:14}}>{pedido.endereco_entrega}</div>
              {pedido.observacao&&<div style={{fontSize:12,color:'#6b7280',marginTop:4}}>Obs: {pedido.observacao}</div>}
            </div>
          </div>
        </div>

        <button style={{width:'100%',padding:'14px',background:'none',border:'1.5px solid #e5e7eb',borderRadius:14,cursor:'pointer',fontWeight:600,color:'#6b7280',fontSize:14}} onClick={()=>navigate('/meus-pedidos')}>
           Voltar para Meus Pedidos
        </button>
      </div>
    </div>
  );
}
