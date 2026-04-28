// Arquivo: frontend/src/services/index.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@kifome:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('@kifome:token');
      localStorage.removeItem('@kifome:usuario');
      if (!window.location.pathname.includes('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authService = {
  // Magic Link (Passwordless)
  requestMagicLink: (email) => api.post('/api/auth/request_magic_link', { email }).then(r => r.data),
  verifyMagicLink: () => api.post('/api/auth/verify_magic_link', {}).then(r => r.data),
  
  // Email OTP
  requestOtpEmail: (email) => api.post('/api/auth/request_otp_email', { email }).then(r => r.data),
  verifyOtpEmail: (email, codigo, extras = {}) => api.post('/api/auth/verify_otp_email', { email, codigo, ...extras }).then(r => r.data),
  syncSupabaseUser: (payload) => api.post('/api/auth/sync_supabase_user', payload).then(r => r.data),
  
  // SMS OTP
  requestOtpSms: (telefone) => api.post('/api/auth/request_otp_sms', { telefone }).then(r => r.data),
  verifyOtpSms: (telefone, codigo, extras = {}) => api.post('/api/auth/verify_otp_sms', { telefone, codigo, ...extras }).then(r => r.data),
  
  // Social Login
  loginGoogle: (accessToken, idToken, user = null) => api.post('/api/auth/login_google', { access_token: accessToken, id_token: idToken, user }).then(r => r.data),
  loginFacebook: (accessToken, user = null) => api.post('/api/auth/login_facebook', { access_token: accessToken, user }).then(r => r.data),
  
  // Current user
  me: () => api.get('/api/auth/me').then(r => r.data),
};

// Restaurantes
export const restauranteService = {
  listar: (p) => api.get('/api/restaurantes', { params: p }).then(r => r.data),
  obter: (id) => api.get(`/api/restaurantes/${id}`).then(r => r.data),
  meus: () => api.get('/api/restaurantes/meus').then(r => r.data),
  criar: (d) => api.post('/api/restaurantes', d).then(r => r.data),
  atualizar: (id, d) => api.put(`/api/restaurantes/${id}`, d).then(r => r.data),
  deletar: (id) => api.delete(`/api/restaurantes/${id}`).then(r => r.data),
};

// Produtos
export const produtoService = {
  listar: (rid, params) => api.get(`/api/restaurantes/${rid}/produtos`, { params }).then(r => r.data),
  criar: (rid, d) => api.post(`/api/restaurantes/${rid}/produtos`, d).then(r => r.data),
  atualizar: (rid, pid, d) => api.put(`/api/restaurantes/${rid}/produtos/${pid}`, d).then(r => r.data),
  deletar: (rid, pid) => api.delete(`/api/restaurantes/${rid}/produtos/${pid}`).then(r => r.data),
};

// Pedidos
export const pedidoService = {
  criar: (d) => api.post('/api/pedidos', d).then(r => r.data),
  meus: () => api.get('/api/pedidos/meus').then(r => r.data),
  doRestaurante: (rid, params) => api.get(`/api/pedidos/restaurante/${rid}`, { params }).then(r => r.data),
  atualizarStatus: (pid, status) => api.put(`/api/pedidos/${pid}/status`, { status }).then(r => r.data),
  avaliar: (pid, nota, comentario) => api.post(`/api/pedidos/${pid}/avaliar`, { nota, comentario }).then(r => r.data),
  disponiveis: () => api.get('/api/pedidos/disponiveis').then(r => r.data),
  minhasEntregas: () => api.get('/api/pedidos/entregas').then(r => r.data),
  validarEntrega: (pid, codigo) => api.post(`/api/pedidos/${pid}/validar-entrega`, { codigo }).then(r => r.data),
  confirmarRecebimento: (pid) => api.post(`/api/pedidos/${pid}/confirmar-recebimento`).then(r => r.data),
  simularPasso: (pid) => api.post(`/api/pedidos/${pid}/simular-passo`).then(r => r.data),
  codigoEntrega: (pid) => api.get(`/api/pedidos/${pid}/codigo-entrega`).then(r => r.data),
};

// Notificações
export const notificacaoService = {
  minhas: (params) => api.get('/api/notificacoes/minhas', { params }).then(r => r.data),
  marcarLida: (nid) => api.put(`/api/notificacoes/${nid}/lida`).then(r => r.data),
  marcarTodasLidas: () => api.put('/api/notificacoes/marcar-todas-lidas').then(r => r.data),
};

// Pagamento Mercado Pago
export const pagamentoService = {
  criarPreferencia: (pedido_id) => api.post('/api/pagamentos/mp/preferencia', { pedido_id }).then(r => r.data),
  statusPedido: (pid) => api.get(`/api/pagamentos/mp/pedido/${pid}/status`).then(r => r.data),
  confirmarSandbox: (pid) => api.post(`/api/pagamentos/mp/sandbox/${pid}/confirmar`).then(r => r.data),
};

// Entregador
export const entregadorService = {
  criar: (d) => api.post('/api/entregadores', d).then(r => r.data),
  meuPerfil: () => api.get('/api/entregadores/meu-perfil').then(r => r.data),
  atualizar: (id, d) => api.put(`/api/entregadores/${id}`, d).then(r => r.data),
};

// Usuario
export const usuarioService = {
  atualizar: (id, d) => api.put(`/api/usuarios/${id}`, d).then(r => r.data),
  atualizarEndereco: (id, d) => api.put(`/api/usuarios/${id}/endereco`, d).then(r => r.data),
  obter: (id) => api.get(`/api/usuarios/${id}`).then(r => r.data),
  listar: () => api.get('/api/usuarios').then(r => r.data),
  deletar: (id) => api.delete(`/api/usuarios/${id}`).then(r => r.data),
};

// #
