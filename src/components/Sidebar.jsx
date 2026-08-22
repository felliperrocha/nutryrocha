import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, HeartPulse, Moon, Sun } from 'lucide-react';
import { authClient } from '../lib/auth';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      navigate('/login');
    } catch (err) {
      console.error("Erro ao sair:", err);
      navigate('/login');
    }
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-left">
          <div className="sidebar-logo-icon">
            <HeartPulse size={24} color="#00b4d8" />
          </div>
          <span className="sidebar-brand-name">Nutry<span className="plus-sign">+</span></span>
        </div>

        <button 
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
          aria-label="Alternar tema"
        >
          {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#64748b" />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Menu Principal</div>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/pacientes" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Pacientes</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Nutricionista'}</span>
            <span className="user-email">{user?.email || 'Conectado'}</span>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          className="sidebar-logout-btn"
          title="Encerrar sessão"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
