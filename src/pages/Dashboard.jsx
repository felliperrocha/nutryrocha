import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  CalendarDays, 
  UserX, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import Layout from '../components/Layout';
import { sql } from '../lib/db';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: []
  });

  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      // 1. Obter nutricionista ID
      let nutId = user?.id;
      if (!nutId && user?.email) {
        const nutResult = await sql`
          SELECT id FROM nutricionistas WHERE email = ${user.email} LIMIT 1
        `;
        if (nutResult.length > 0) {
          nutId = nutResult[0].id;
        }
      }

      if (!nutId) {
        throw new Error('Não foi possível identificar a nutricionista logada.');
      }

      // 2. Card 1 - Total de pacientes cadastrados
      const totalPacientesRes = await sql`
        SELECT COUNT(*)::int AS total 
        FROM pacientes 
        WHERE nutricionista_id = ${nutId}
      `;
      const totalPacientes = totalPacientesRes[0]?.total || 0;

      // 3. Card 2 - Consultas da semana atual
      const consultasSemanaRes = await sql`
        SELECT COUNT(c.id)::int AS total
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.id
        WHERE p.nutricionista_id = ${nutId}
          AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
          AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + interval '6 days')::date
      `;
      const consultasSemana = consultasSemanaRes[0]?.total || 0;

      // 4. Card 3 - Pacientes cuja última consulta foi há mais de 30 dias e sem próximo retorno agendado
      const pacientesSemRetornoRes = await sql`
        WITH ultimas_consultas AS (
          SELECT 
            p.id,
            p.nome,
            p.email,
            p.whatsapp,
            MAX(c.data_consulta) AS ultima_consulta,
            MAX(c.proximo_retorno) AS ultimo_proximo_retorno
          FROM pacientes p
          JOIN consultas c ON c.paciente_id = p.id
          WHERE p.nutricionista_id = ${nutId}
          GROUP BY p.id, p.nome, p.email, p.whatsapp
        )
        SELECT 
          id,
          nome,
          email,
          whatsapp,
          ultima_consulta,
          ultimo_proximo_retorno,
          (CURRENT_DATE - ultima_consulta)::int AS dias_sem_consulta
        FROM ultimas_consultas
        WHERE ultima_consulta < (CURRENT_DATE - INTERVAL '30 days')
          AND (ultimo_proximo_retorno IS NULL OR ultimo_proximo_retorno < CURRENT_DATE)
        ORDER BY ultima_consulta ASC
      `;

      setStats({
        totalPacientes,
        consultasSemana,
        pacientesSemRetorno: pacientesSemRetornoRes || []
      });
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Não foi possível carregar os dados em tempo real. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Formatar data em português
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getGreetingDate = () => {
    const today = new Date();
    return today.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Layout user={user}>
      <div className="dashboard-content">
        {/* Header com boas-vindas */}
        <div className="dashboard-topbar">
          <div>
            <span className="current-date-badge">{getGreetingDate()}</span>
            <h1 className="dashboard-greeting">
              Olá, <span className="highlight-name">{user?.name || 'Nutricionista'}</span> 👋
            </h1>
            <p className="dashboard-subtext">
              Acompanhe o resumo dos seus atendimentos e pacientes em tempo real.
            </p>
          </div>

          <button 
            className="btn-refresh" 
            onClick={() => loadDashboardData(true)} 
            disabled={loading || refreshing}
            title="Atualizar dados"
          >
            <RefreshCw size={18} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>

        {error && (
          <div className="dashboard-alert-error">
            <AlertCircle size={20} />
            <div style={{ flex: 1 }}>{error}</div>
            <button onClick={() => loadDashboardData()} className="btn-retry">Tentar novamente</button>
          </div>
        )}

        {/* Grade de estatísticas */}
        <div className="dashboard-grid">
          {/* Card 1 — Total de pacientes ativos */}
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper cyan">
                <Users size={24} />
              </div>
              <span className="stat-pill">Ativos</span>
            </div>

            <div className="stat-card-body">
              <h3 className="stat-title">Total de pacientes</h3>
              {loading ? (
                <div className="skeleton skeleton-stat"></div>
              ) : (
                <div className="stat-number-wrapper">
                  <span className="stat-number">{stats.totalPacientes}</span>
                  <span className="stat-label">pacientes cadastrados</span>
                </div>
              )}
            </div>

            <div className="stat-card-footer">
              <span className="stat-footnote">
                <TrendingUp size={14} color="#00b4d8" /> Gerenciados por você
              </span>
            </div>
          </div>

          {/* Card 2 — Consultas da semana */}
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon-wrapper teal">
                <CalendarDays size={24} />
              </div>
              <span className="stat-pill">Esta semana</span>
            </div>

            <div className="stat-card-body">
              <h3 className="stat-title">Consultas da semana</h3>
              {loading ? (
                <div className="skeleton skeleton-stat"></div>
              ) : (
                <div className="stat-number-wrapper">
                  <span className="stat-number">{stats.consultasSemana}</span>
                  <span className="stat-label">agendamentos / realizados</span>
                </div>
              )}
            </div>

            <div className="stat-card-footer">
              <span className="stat-footnote">
                <Clock size={14} color="#0077b6" /> De segunda a domingo
              </span>
            </div>
          </div>

          {/* Card 3 — Pacientes sem retorno */}
          <div className="stat-card stat-card-wide">
            <div className="stat-card-header">
              <div className="stat-header-group">
                <div className="stat-icon-wrapper amber">
                  <UserX size={24} />
                </div>
                <div>
                  <h3 className="stat-title" style={{ fontSize: '1.15rem' }}>Pacientes sem retorno</h3>
                  <p className="stat-description">
                    Última consulta há mais de 30 dias sem novo retorno agendado
                  </p>
                </div>
              </div>
              {!loading && (
                <span className={`count-badge ${stats.pacientesSemRetorno.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                  {stats.pacientesSemRetorno.length} paciente{stats.pacientesSemRetorno.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            <div className="stat-card-body" style={{ marginTop: '1rem' }}>
              {loading ? (
                <div className="skeleton-list">
                  <div className="skeleton skeleton-row"></div>
                  <div className="skeleton skeleton-row"></div>
                  <div className="skeleton skeleton-row"></div>
                </div>
              ) : stats.pacientesSemRetorno.length === 0 ? (
                <div className="empty-state-container">
                  <div className="empty-state-icon">
                    <CheckCircle2 size={36} color="#10b981" />
                  </div>
                  <h4 className="empty-state-title">Nenhum paciente sem retorno no momento</h4>
                  <p className="empty-state-subtitle">
                    Todos os seus pacientes estão em dia ou possuem retornos agendados!
                  </p>
                </div>
              ) : (
                <div className="patients-no-return-list">
                  {stats.pacientesSemRetorno.map((paciente) => (
                    <div 
                      key={paciente.id} 
                      className="patient-return-item"
                      onClick={() => navigate(`/pacientes/${paciente.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="patient-avatar-mini">
                        {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
                      </div>
                      
                      <div className="patient-info-main">
                        <span className="patient-name">{paciente.nome}</span>
                        <div className="patient-meta">
                          <span>Última consulta: <strong>{formatDate(paciente.ultima_consulta)}</strong></span>
                          <span className="meta-bullet">•</span>
                          <span className="badge-days-ago">
                            há {paciente.dias_sem_consulta} dias
                          </span>
                        </div>
                      </div>

                      <div className="patient-action-btn">
                        <span>Ver perfil</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
