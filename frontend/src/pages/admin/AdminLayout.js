import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './Admin.css';

const NAV_ITEMS = [
  { to: '/admin/dashboard',    icon: '📊', label: 'Dashboard' },
  { to: '/admin/pedidos',      icon: '🛍️',  label: 'Pedidos' },
  { to: '/admin/restaurantes', icon: '🍽️',  label: 'Restaurantes' },
  { to: '/admin/usuarios',     icon: '👥',  label: 'Usuarios' },
  { to: '/admin/relatorios',   icon: '📈',  label: 'Relatorios' },
];

export default function AdminLayout({ children }) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span>🍔</span>
          <div>
            <strong>Kifome</strong>
            <small>Admin</small>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                'admin-nav-item' + (isActive ? ' active' : '')
              }
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="admin-logout-btn" onClick={handleLogout}>
          <span>🚪</span> Sair
        </button>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
