import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authClient, getDb } from '../lib/auth';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name
      });

      if (signUpError) {
        setError(signUpError.message || 'Erro ao criar conta.');
      } else {
        const db = getDb();
        await db`INSERT INTO nutricionistas (id, nome, email) VALUES (${data.user.id}, ${name}, ${email})`;
        
        console.log("Nutricionista criado com sucesso no Neon Auth e Banco de Dados.");
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">Nutry+</div>
      <h2 className="auth-title">Crie sua conta</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Nome completo</label>
          <input 
            type="text" 
            id="name"
            className="form-input" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Seu Nome"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email"
            className="form-input" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="seu@email.com"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="password">Senha</label>
          <input 
            type="password" 
            id="password"
            className="form-input" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">Confirmar Senha</label>
          <input 
            type="password" 
            id="confirmPassword"
            className="form-input" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>
        
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
      
      <Link to="/login" className="auth-link">
        Já tem conta? Faça login
      </Link>
    </div>
  );
}
