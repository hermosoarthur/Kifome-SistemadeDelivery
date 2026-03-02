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
  login: (email, senha) => api.post('/api/auth/login', { email, senha }).then(r => r.data),
  registro: (d) => api.post('/api/usuarios/registro', d).then(r => r.data),
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
  listar: (rid) => api.get(`/api/restaurantes/${rid}/produtos`).then(r => r.data),
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
  disponiveis: () => api.get('/api/pedidos/disponiveis').then(r => r.data),
  minhasEntregas: () => api.get('/api/pedidos/entregas').then(r => r.data),
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
  obter: (id) => api.get(`/api/usuarios/${id}`).then(r => r.data),
  listar: () => api.get('/api/usuarios').then(r => r.data),
  deletar: (id) => api.delete(`/api/usuarios/${id}`).then(r => r.data),
};
