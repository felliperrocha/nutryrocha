import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  ChevronRight, 
  Calendar, 
  Target, 
  Phone, 
  Mail,
  AlertCircle
} from 'lucide-react';
import Layout from '../components/Layout';
import { sql } from '../lib/db';

export default function Pacientes({ user }) {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPacientes() {
      try {
        setLoading(true);
        setError(null);

        let nutId = user?.id;
        if (!nutId && user?.email) {
          const res = await sql`SELECT id FROM nutricionistas WHERE email = ${user.email} LIMIT 1`;
          if (res.length > 0) nutId = res[0].id;
        }

        if (nutId) {
          const list = await sql`
            SELECT 
              p.id,
              p.nome,
              p.email,
              p.whatsapp,
              p.objetivos,
              p.objetivo_texto,
              p.created_at,
              MAX(c.data_consulta) AS ultima_consulta
            FROM pacientes p
            LEFT JOIN consultas c ON c.paciente_id = p.id
            WHERE p.nutricionista_id = ${nutId}
            GROUP BY p.id, p.nome, p.email, p.whatsapp, p.objetivos, p.objetivo_texto, p.created_at
            ORDER BY p.nome ASC
          `;
          setPacientes(list || []);
        }
      } catch (err) {
        console.error('Erro ao buscar pacientes:', err);
        setError('Erro ao carregar lista de pacientes.');
      } finally {
        setLoading(false);
      }
    }

    fetchPacientes();
  }, [user]);

  const filteredPacientes = pacientes.filter(p => 
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Nenhuma consulta';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getObjetivosDisplay = (paciente) => {
    if (paciente.objetivos && Array.isArray(paciente.objetivos) && paciente.objetivos.length > 0) {
      return paciente.objetivos.slice(0, 2).join(', ') + (paciente.objetivos.length > 2 ? ` (+${paciente.objetivos.length - 2})` : '');
    }
    if (paciente.objetivo_texto) {
      return paciente.objetivo_texto;
    }
    return 'Não informado';
  };

  return (
    <Layout user={user}>
      <div className="dashboard-content">
        {/* Topbar com Título e Botão Novo Paciente */}
        <div className="dashboard-topbar">
          <div>
            <span className="current-date-badge">Gestão de Pacientes</span>
            <h1 className="dashboard-greeting">Pacientes</h1>
            <p className="dashboard-subtext">
              Consulte e gerencie os prontuários de seus pacientes cadastrados.
            </p>
          </div>

          <button 
            type="button"
            className="btn-novo-paciente"
            onClick={() => navigate('/pacientes/novo')}
          >
            <UserPlus size={18} />
            <span>Novo Paciente</span>
          </button>
        </div>

        {error && (
          <div className="dashboard-alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="stat-card">
          {/* Barra de busca */}
          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <Search size={18} color="#64748b" />
              <input 
                type="text" 
                placeholder="Buscar paciente por nome..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {!loading && (
              <div className="results-count-badge">
                {filteredPacientes.length} paciente{filteredPacientes.length === 1 ? '' : 's'}
              </div>
            )}
          </div>

          {/* Listagem de Pacientes */}
          <div style={{ marginTop: '1.5rem' }}>
            {loading ? (
              <div className="skeleton-list">
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
              </div>
            ) : pacientes.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state-icon">
                  <Users size={42} color="#00b4d8" />
                </div>
                <h4 className="empty-state-title">Nenhum paciente cadastrado ainda</h4>
                <p className="empty-state-subtitle">
                  Comece cadastrando seu primeiro paciente para registrar consultas e montar planos alimentares.
                </p>
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ marginTop: '1.25rem', padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
                  onClick={() => navigate('/pacientes/novo')}
                >
                  <UserPlus size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Cadastrar Primeiro Paciente
                </button>
              </div>
            ) : filteredPacientes.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state-icon">
                  <Search size={36} color="#94a3b8" />
                </div>
                <h4 className="empty-state-title">Nenhum paciente encontrado</h4>
                <p className="empty-state-subtitle">
                  Não encontramos pacientes com o termo "{searchTerm}".
                </p>
              </div>
            ) : (
              <div className="patients-grid-list">
                {filteredPacientes.map((paciente) => (
                  <div 
                    key={paciente.id} 
                    className="patient-list-card"
                    onClick={() => navigate(`/pacientes/${paciente.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="patient-avatar-mini">
                      {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
                    </div>
                    
                    <div className="patient-info-column">
                      <div className="patient-name-row">
                        <span className="patient-name">{paciente.nome}</span>
                      </div>

                      <div className="patient-data-badges">
                        <span className="patient-badge-item">
                          <Target size={13} color="#0077b6" />
                          <span>Objetivo: <strong>{getObjetivosDisplay(paciente)}</strong></span>
                        </span>

                        <span className="patient-badge-item">
                          <Calendar size={13} color="#028090" />
                          <span>Última consulta: <strong>{formatDate(paciente.ultima_consulta)}</strong></span>
                        </span>
                      </div>
                    </div>

                    <div className="patient-action-btn">
                      <span>Prontuário</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
