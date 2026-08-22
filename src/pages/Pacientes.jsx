import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  ChevronRight, 
  Calendar, 
  Target, 
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';
import Layout from '../components/Layout';
import { sql } from '../lib/db';

export default function Pacientes({ user }) {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPacientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obter nutricionista ID de forma resiliente
      let nutId = null;
      if (user?.email) {
        const nutRes = await sql`
          SELECT id FROM nutricionistas WHERE email = ${user.email} OR id = ${user.id} LIMIT 1
        `;
        if (nutRes && nutRes.length > 0) {
          nutId = nutRes[0].id;
        }
      }
      if (!nutId && user?.id) {
        nutId = user.id;
      }

      if (!nutId) {
        throw new Error('Sessão expirada ou nutricionista não identificada.');
      }

      // 2. Consulta ultra-otimizada sem GROUP BY em colunas de array
      const list = await sql`
        SELECT 
          p.id,
          p.nome,
          p.email,
          p.whatsapp,
          p.objetivos,
          p.objetivo_texto,
          p.created_at,
          (SELECT MAX(c.data_consulta) FROM consultas c WHERE c.paciente_id = p.id) AS ultima_consulta
        FROM pacientes p
        WHERE p.nutricionista_id = ${nutId}
           OR p.nutricionista_id IN (SELECT id FROM nutricionistas WHERE email = ${user?.email})
        ORDER BY p.nome ASC
      `;

      setPacientes(list || []);
    } catch (err) {
      console.error('Erro ao buscar lista de pacientes:', err);
      setError('Erro ao carregar a lista de pacientes. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const filteredPacientes = pacientes.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const nomeMatch = p.nome?.toLowerCase().includes(term);
    const emailMatch = p.email?.toLowerCase().includes(term);
    const zapMatch = p.whatsapp?.toLowerCase().includes(term);
    return nomeMatch || emailMatch || zapMatch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Nenhuma consulta';
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const parseArrayField = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      if (val.startsWith('{') && val.endsWith('}')) {
        return val.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
      }
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [val];
      }
    }
    return [];
  };

  const getObjetivosDisplay = (paciente) => {
    const list = parseArrayField(paciente.objetivos);
    if (list.length > 0) {
      return list.slice(0, 2).join(', ') + (list.length > 2 ? ` (+${list.length - 2})` : '');
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
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={fetchPacientes} className="btn-retry">Tentar novamente</button>
          </div>
        )}

        <div className="stat-card">
          {/* Barra de busca moderna e profissional */}
          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <div className="search-icon-badge">
                <Search size={19} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar paciente por nome, email ou whatsapp..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                id="search-pacientes-input"
              />
              {searchTerm && (
                <button 
                  type="button" 
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Limpar busca"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {!loading && (
              <div className="results-count-badge">
                <span>Total:</span>
                <strong>{filteredPacientes.length}</strong>
                <span>paciente{filteredPacientes.length === 1 ? '' : 's'}</span>
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
                  Comece cadastrando seu primeiro paciente para registrar consultas e acompanhar a evolução física.
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
