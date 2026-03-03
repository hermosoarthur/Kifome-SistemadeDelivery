import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Shared
import { Login, Registro } from './pages/shared/Auth';
import './pages/shared/Auth.css';
import Perfil from './pages/shared/Perfil';
import './pages/shared/Perfil.css';

// Cliente
import ClienteHome from './pages/cliente/ClienteHome';
import './pages/cliente/ClienteHome.css';
import MeusPedidos from './pages/cliente/MeusPedidos';

// Restaurante
import RestauranteDash from './pages/restaurante/RestauranteDash';
import './pages/restaurante/RestauranteDash.css';
import MeuRestaurante from './pages/restaurante/MeuRestaurante';
import Produtos from './pages/restaurante/Produtos';
import PedidosRestaurante from './pages/restaurante/PedidosRestaurante';

// Entregador
import EntregadorDash from './pages/entregador/EntregadorDash';
import { PedidosDisponiveis, MinhasEntregas } from './pages/entregador/Entregas';

import './styles/global.css';
import './components/Layout.css';

function Carregando() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, background: '#F8F9FA' }}>
      <span style={{ fontSize: 56 }}>🍔</span>
      <span style={{ fontSize: 20, fontWeight: 800, color: '#FF6B35' }}>Kifome</span>
    </div>
  );
}

function Protegida({ children }) {
  const { autenticado, carregando } = useAuth();
  if (carregando) return <Carregando />;
  return autenticado ? children : <Navigate to="/login" replace />;
}

function SoPublica({ children }) {
  const { autenticado, carregando } = useAuth();
  if (carregando) return null;
  return !autenticado ? children : <Navigate to="/" replace />;
}

// Renderiza o dashboard correto conforme tipo de usuario
function HomeRouter() {
  const { usuario } = useAuth();
  if (usuario?.tipo === 'restaurante') return <RestauranteDash />;
  if (usuario?.tipo === 'entregador') return <EntregadorDash />;
  return <ClienteHome />;
}

function AppRoutes() {
  const { usuario } = useAuth();
  const tipo = usuario?.tipo;

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<SoPublica><Login /></SoPublica>} />
      <Route path="/registro" element={<SoPublica><Registro /></SoPublica>} />

      {/* Autenticadas — home dinâmica */}
      <Route path="/" element={<Protegida><Layout><HomeRouter /></Layout></Protegida>} />

      {/* Compartilhadas */}
      <Route path="/perfil" element={<Protegida><Layout><Perfil /></Layout></Protegida>} />

      {/* ── CLIENTE ── */}
      {tipo === 'cliente' && <>
        <Route path="/meus-pedidos" element={<Protegida><Layout><MeusPedidos /></Layout></Protegida>} />
      </>}

      {/* ── RESTAURANTE ── */}
      {tipo === 'restaurante' && <>
        <Route path="/meu-restaurante" element={<Protegida><Layout><MeuRestaurante /></Layout></Protegida>} />
        <Route path="/produtos" element={<Protegida><Layout><Produtos /></Layout></Protegida>} />
        <Route path="/pedidos" element={<Protegida><Layout><PedidosRestaurante /></Layout></Protegida>} />
      </>}

      {/* ── ENTREGADOR ── */}
      {tipo === 'entregador' && <>
        <Route path="/disponivel" element={<Protegida><Layout><PedidosDisponiveis /></Layout></Protegida>} />
        <Route path="/minhas-entregas" element={<Protegida><Layout><MinhasEntregas /></Layout></Protegida>} />
      </>}

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutesWrapper />
      </AuthProvider>
    </BrowserRouter>
  );
}

// Wrapper para ter acesso ao useAuth dentro do BrowserRouter
function AppRoutesWrapper() {
  return <AppRoutes />;
}
