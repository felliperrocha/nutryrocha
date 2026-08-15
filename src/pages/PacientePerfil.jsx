import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Calendar, Activity, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import { sql } from '../lib/db';

export default function PacientePerfil({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPacienteDetails() {
      try {
        setLoading(true);
        setError(null);

        const pacienteRes = await sql`
          SELECT * FROM pacientes WHERE id = ${id} LIMIT 1
        `;

        if (pacienteRes.length === 0) {
          setError('Paciente não encontrado.');
          return;
        }

        setPaciente(pacienteRes[0]);

        const consultasRes = await sql`
          SELECT * FROM consultas WHERE paciente_id = ${id} ORDER BY data_consulta DESC
        `;
        setConsultas(consultasRes || []);
      } catch (err) {
        console.error('Erro ao buscar detalhes do paciente:', err);
        setError('Erro ao carregar os dados do paciente.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPacienteDetails();
    }
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não informado';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <Layout user={user}>
      <div className="dashboard-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            onClick={() => navigate(-1)} 
            className="btn-back"
          >
            <ArrowLeft size={18} />
            <span>Voltar</span>
          </button>
        </div>

        {loading ? (
          <div className="stat-card">
            <div className="skeleton-list">
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
            </div>
          </div>
        ) : error ? (
          <div className="dashboard-alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : paciente ? (
          <div className="profile-container">
            {/* Header do Paciente */}
            <div className="profile-header-card">
              <div className="profile-avatar-large">
                {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="profile-header-details">
                <h1 className="profile-name">{paciente.nome}</h1>
                <div className="profile-meta-tags">
                  {paciente.email && (
                    <span className="profile-tag">
                      <Mail size={14} /> {paciente.email}
                    </span>
                  )}
                  {paciente.whatsapp && (
                    <span className="profile-tag">
                      <Phone size={14} /> {paciente.whatsapp}
                    </span>
                  )}
                  {paciente.sexo && (
                    <span className="profile-tag">
                      <User size={14} /> {paciente.sexo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Informações Clínicas / Dados Básicos */}
            <div className="profile-grid">
              <div className="stat-card">
                <h3 className="stat-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} color="#00b4d8" /> Dados Físicos & Objetivos
                </h3>
                <div className="info-list">
                  <div className="info-row">
                    <span className="info-key">Peso Inicial:</span>
                    <span className="info-val">{paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não registrado'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Altura:</span>
                    <span className="info-val">{paciente.altura ? `${paciente.altura} m` : 'Não registrada'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Nível de Atividade:</span>
                    <span className="info-val">{paciente.nivel_atividade || 'Não informado'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-key">Objetivo:</span>
                    <span className="info-val">{paciente.objetivo_texto || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h3 className="stat-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color="#0077b6" /> Histórico de Consultas ({consultas.length})
                </h3>
                {consultas.length === 0 ? (
                  <div className="empty-state-container" style={{ padding: '1.5rem' }}>
                    <Calendar size={28} color="#adb5bd" />
                    <p className="empty-state-subtitle" style={{ marginTop: '0.5rem' }}>
                      Nenhuma consulta registrada para este paciente ainda.
                    </p>
                  </div>
                ) : (
                  <div className="consultas-history-list">
                    {consultas.map(c => (
                      <div key={c.id} className="consulta-history-item">
                        <div className="consulta-date-col">
                          <strong>{formatDate(c.data_consulta)}</strong>
                          {c.proximo_retorno && (
                            <span className="retorno-badge">
                              Retorno: {formatDate(c.proximo_retorno)}
                            </span>
                          )}
                        </div>
                        <div className="consulta-data-col">
                          {c.peso && <span>Peso: {c.peso}kg</span>}
                          {c.percentual_gordura && <span>% Gordura: {c.percentual_gordura}%</span>}
                          {c.observacoes && <p className="consulta-obs">{c.observacoes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
