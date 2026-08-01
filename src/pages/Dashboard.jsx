import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth';

export default function Dashboard({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authClient.signOut();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="auth-logo" style={{ marginBottom: 0 }}>Nutry+</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
            Olá, {user?.name || 'Nutricionista'}
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Sair
          </button>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginBottom: '1rem' }}>Seu Dashboard</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Bem-vindo ao sistema de gestão Nutry+. Em breve, você poderá gerenciar seus pacientes, consultas e planos alimentares aqui.
        </p>
      </div>
    </div>
  );
}
