import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import NovoPaciente from './pages/NovoPaciente';
import PacientePerfil from './pages/PacientePerfil';
import { authClient } from './lib/auth';

function App() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>Carregando...</div>;
  }

  const user = session?.user;

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" replace /> : <Signup />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/pacientes" 
          element={user ? <Pacientes user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/pacientes/novo" 
          element={user ? <NovoPaciente user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/pacientes/:id" 
          element={user ? <PacientePerfil user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
