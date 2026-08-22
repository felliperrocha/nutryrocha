import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  Search, 
  ChevronRight, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Scale, 
  Percent, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  X,
  Filter,
  Plus,
  Trash2,
  CheckCircle,
  CircleDot
} from 'lucide-react';
import Layout from '../components/Layout';
import { sql } from '../lib/db';

export default function Consultas({ user }) {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('todas'); // 'todas' | 'futuras' | 'semana' | 'mes' | 'passadas'

  // Estados para modal de agendamento/registro rápido
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formConsulta, setFormConsulta] = useState({
    paciente_id: '',
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  // Estado para exclusão de consulta
  const [deletingConsultaId, setDeletingConsultaId] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const fetchConsultasData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obter nutricionista ID
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

      // 2. Buscar pacientes da nutricionista para seleção no modal
      const pacList = await sql`
        SELECT id, nome, email, whatsapp 
        FROM pacientes 
        WHERE nutricionista_id = ${nutId}
           OR nutricionista_id IN (SELECT id FROM nutricionistas WHERE email = ${user?.email})
        ORDER BY nome ASC
      `;
      setPacientes(pacList || []);

      // 3. Buscar todas as consultas com informações do paciente
      const consultasList = await sql`
        SELECT 
          c.id,
          c.paciente_id,
          c.data_consulta,
          c.peso,
          c.cintura,
          c.quadril,
          c.percentual_gordura,
          c.observacoes,
          c.proximo_retorno,
          c.created_at,
          p.nome AS paciente_nome,
          p.email AS paciente_email,
          p.whatsapp AS paciente_whatsapp
        FROM consultas c
        JOIN pacientes p ON c.paciente_id = p.id
        WHERE p.nutricionista_id = ${nutId}
           OR p.nutricionista_id IN (SELECT id FROM nutricionistas WHERE email = ${user?.email})
        ORDER BY c.data_consulta DESC, c.created_at DESC
      `;

      setConsultas(consultasList || []);
    } catch (err) {
      console.error('Erro ao buscar consultas:', err);
      setError('Não foi possível carregar a lista de consultas. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConsultasData();
  }, [fetchConsultasData]);

  // Formatação de datas
  const formatDate = (val) => {
    if (!val) return 'Não informado';
    try {
      if (val instanceof Date) return val.toLocaleDateString('pt-BR');
      const str = String(val);
      const parts = str.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(val).toLocaleDateString('pt-BR');
    } catch {
      return String(val);
    }
  };

  // Comparação de datas para filtros
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredConsultas = consultas.filter((c) => {
    // Filtro de texto (nome do paciente, observações, whatsapp ou email)
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchNome = c.paciente_nome?.toLowerCase().includes(term);
      const matchEmail = c.paciente_email?.toLowerCase().includes(term);
      const matchZap = c.paciente_whatsapp?.toLowerCase().includes(term);
      const matchObs = c.observacoes?.toLowerCase().includes(term);
      if (!matchNome && !matchEmail && !matchZap && !matchObs) {
        return false;
      }
    }

    const dataC = c.data_consulta ? String(c.data_consulta).split('T')[0] : '';
    const proximoR = c.proximo_retorno ? String(c.proximo_retorno).split('T')[0] : '';

    if (filterPeriodo === 'futuras') {
      // Consultas futuras ou retornos futuros
      return dataC >= todayStr || (proximoR && proximoR >= todayStr);
    }

    if (filterPeriodo === 'semana') {
      const today = new Date();
      const firstDayOfWeek = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
      firstDayOfWeek.setDate(diff);
      firstDayOfWeek.setHours(0, 0, 0, 0);

      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
      lastDayOfWeek.setHours(23, 59, 59, 999);

      const dataConsultaObj = new Date(dataC + 'T00:00:00');
      return dataConsultaObj >= firstDayOfWeek && dataConsultaObj <= lastDayOfWeek;
    }

    if (filterPeriodo === 'mes') {
      const today = new Date();
      const curMonth = today.getMonth();
      const curYear = today.getFullYear();
      if (!dataC) return false;
      const parts = dataC.split('-');
      return parseInt(parts[0], 10) === curYear && parseInt(parts[1], 10) === curMonth + 1;
    }

    if (filterPeriodo === 'passadas') {
      return dataC < todayStr;
    }

    return true;
  });

  // Salvar nova consulta
  const handleSaveConsulta = async (e) => {
    e.preventDefault();
    if (!formConsulta.paciente_id) {
      setModalError('Selecione um paciente para a consulta.');
      return;
    }
    if (!formConsulta.data_consulta) {
      setModalError('A data da consulta é obrigatória.');
      return;
    }

    setSavingConsulta(true);
    setModalError(null);

    try {
      await sql`
        INSERT INTO consultas (
          paciente_id,
          data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          proximo_retorno
        ) VALUES (
          ${formConsulta.paciente_id},
          ${formConsulta.data_consulta},
          ${formConsulta.peso ? parseFloat(formConsulta.peso) : null},
          ${formConsulta.cintura ? parseFloat(formConsulta.cintura) : null},
          ${formConsulta.quadril ? parseFloat(formConsulta.quadril) : null},
          ${formConsulta.percentual_gordura ? parseFloat(formConsulta.percentual_gordura) : null},
          ${formConsulta.observacoes || null},
          ${formConsulta.proximo_retorno || null}
        )
      `;

      setIsModalOpen(false);
      setFormConsulta({
        paciente_id: '',
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      });
      showSuccessFeedback('Consulta registrada com sucesso!');
      fetchConsultasData();
    } catch (err) {
      console.error('Erro ao registrar consulta:', err);
      setModalError('Erro ao salvar os dados da consulta. Tente novamente.');
    } finally {
      setSavingConsulta(false);
    }
  };

  // Excluir Consulta
  const handleDeleteConsulta = async (consultaId, pacienteNome) => {
    if (!window.confirm(`Tem certeza que deseja excluir a consulta de ${pacienteNome}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setDeletingConsultaId(consultaId);
      await sql`
        DELETE FROM consultas WHERE id = ${consultaId}
      `;
      showSuccessFeedback(`Consulta de ${pacienteNome} excluída com sucesso.`);
      setConsultas(prev => prev.filter(c => c.id !== consultaId));
    } catch (err) {
      console.error('Erro ao excluir consulta:', err);
      setError('Não foi possível excluir a consulta. Tente novamente.');
    } finally {
      setDeletingConsultaId(null);
    }
  };

  // Marcar Consulta / Retorno como Concluída (ou registrar realização)
  const handleMarcarConcluida = async (consulta) => {
    const isFutura = consulta.data_consulta && String(consulta.data_consulta).split('T')[0] > todayStr;
    const msg = isFutura
      ? `Deseja marcar esta consulta de ${consulta.paciente_nome} como realizada hoje (${new Date().toLocaleDateString('pt-BR')})?`
      : `Deseja atualizar a data de realização para hoje?`;

    if (!window.confirm(msg)) {
      return;
    }

    try {
      const hoje = new Date().toISOString().split('T')[0];
      await sql`
        UPDATE consultas 
        SET data_consulta = ${hoje}
        WHERE id = ${consulta.id}
      `;
      showSuccessFeedback(`Consulta de ${consulta.paciente_nome} marcada como concluída hoje!`);
      fetchConsultasData();
    } catch (err) {
      console.error('Erro ao marcar consulta como concluída:', err);
      setError('Não foi possível atualizar o status da consulta.');
    }
  };

  const showSuccessFeedback = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 4000);
  };

  // Estatísticas rápidas de consultas
  const statsConsultas = {
    total: consultas.length,
    esteMes: consultas.filter(c => {
      const dataC = c.data_consulta ? String(c.data_consulta).split('T')[0] : '';
      if (!dataC) return false;
      const today = new Date();
      const parts = dataC.split('-');
      return parseInt(parts[0], 10) === today.getFullYear() && parseInt(parts[1], 10) === today.getMonth() + 1;
    }).length,
    comRetorno: consultas.filter(c => c.proximo_retorno && String(c.proximo_retorno).split('T')[0] >= todayStr).length
  };

  return (
    <Layout user={user}>
      <div className="dashboard-content notranslate" translate="no">
        {/* Topbar com Título e Botão de Ação */}
        <div className="dashboard-topbar">
          <div>
            <span className="current-date-badge">Agenda Clínica</span>
            <h1 className="dashboard-greeting">Consultas</h1>
            <p className="dashboard-subtext">
              Consulte, acompanhe, marque como concluída ou gerencie os retornos de seus pacientes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn-refresh" 
              onClick={fetchConsultasData}
              disabled={loading}
              title="Atualizar lista"
            >
              <RefreshCw size={16} className={loading ? "spin-icon" : ""} />
              <span>Atualizar</span>
            </button>

            <button 
              type="button"
              className="btn-novo-paciente"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} />
              <span>Nova Consulta</span>
            </button>
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="dashboard-alert-success">
            <CheckCircle2 size={20} />
            <span style={{ flex: 1 }}>{actionSuccessMsg}</span>
          </div>
        )}

        {error && (
          <div className="dashboard-alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={20} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={fetchConsultasData} className="btn-retry">Tentar novamente</button>
          </div>
        )}

        {/* Cards de Métricas Interativas (clique para filtrar dinamicamente) */}
        <div className="dashboard-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div 
            className={`stat-card stat-card-interactive ${filterPeriodo === 'todas' ? 'active-filter-card' : ''}`} 
            style={{ padding: '1.25rem', cursor: 'pointer' }}
            onClick={() => setFilterPeriodo('todas')}
            title="Clique para ver todas as consultas"
          >
            <div className="stat-card-header">
              <span className="stat-title">Total de Consultas</span>
              <div className="stat-icon-wrapper cyan" style={{ width: '38px', height: '38px' }}>
                <CalendarDays size={20} />
              </div>
            </div>
            <div className="stat-number-wrapper" style={{ marginTop: '0.75rem' }}>
              <span className="stat-number" style={{ fontSize: '2rem' }}>{statsConsultas.total}</span>
              <span className="stat-label">registros totais</span>
            </div>
            <div className="card-filter-hint">
              <span>{filterPeriodo === 'todas' ? '● Filtro ativo' : 'Clique para filtrar'}</span>
            </div>
          </div>

          <div 
            className={`stat-card stat-card-interactive ${filterPeriodo === 'mes' ? 'active-filter-card' : ''}`} 
            style={{ padding: '1.25rem', cursor: 'pointer' }}
            onClick={() => setFilterPeriodo('mes')}
            title="Clique para filtrar apenas consultas deste mês"
          >
            <div className="stat-card-header">
              <span className="stat-title">Consultas este Mês</span>
              <div className="stat-icon-wrapper teal" style={{ width: '38px', height: '38px' }}>
                <Calendar size={20} />
              </div>
            </div>
            <div className="stat-number-wrapper" style={{ marginTop: '0.75rem' }}>
              <span className="stat-number" style={{ fontSize: '2rem' }}>{statsConsultas.esteMes}</span>
              <span className="stat-label">no mês corrente</span>
            </div>
            <div className="card-filter-hint">
              <span>{filterPeriodo === 'mes' ? '● Filtro ativo' : 'Clique para filtrar'}</span>
            </div>
          </div>

          <div 
            className={`stat-card stat-card-interactive ${filterPeriodo === 'futuras' ? 'active-filter-card' : ''}`} 
            style={{ padding: '1.25rem', cursor: 'pointer' }}
            onClick={() => setFilterPeriodo('futuras')}
            title="Clique para filtrar apenas retornos e agendamentos futuros"
          >
            <div className="stat-card-header">
              <span className="stat-title">Próximos Retornos</span>
              <div className="stat-icon-wrapper amber" style={{ width: '38px', height: '38px' }}>
                <Clock size={20} />
              </div>
            </div>
            <div className="stat-number-wrapper" style={{ marginTop: '0.75rem' }}>
              <span className="stat-number" style={{ fontSize: '2rem' }}>{statsConsultas.comRetorno}</span>
              <span className="stat-label">retornos agendados</span>
            </div>
            <div className="card-filter-hint">
              <span>{filterPeriodo === 'futuras' ? '● Filtro ativo' : 'Clique para filtrar'}</span>
            </div>
          </div>
        </div>

        {/* Card Principal com Barra de Filtros e Busca */}
        <div className="stat-card">
          <div className="search-filter-bar">
            {/* Campo de Busca */}
            <div className="search-input-wrapper">
              <div className="search-icon-badge">
                <Search size={19} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar por paciente, observações ou contato..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                id="search-consultas-input"
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

            {/* Filtros de Período em Chips / Botões */}
            <div className="consultas-period-filters">
              {[
                { id: 'todas', label: 'Todas' },
                { id: 'futuras', label: 'Futuras / Retornos' },
                { id: 'semana', label: 'Esta Semana' },
                { id: 'mes', label: 'Este Mês' },
                { id: 'passadas', label: 'Histórico' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`period-filter-btn ${filterPeriodo === filter.id ? 'active' : ''}`}
                  onClick={() => setFilterPeriodo(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {!loading && (
              <div className="results-count-badge">
                <span>Total:</span>
                <strong>{filteredConsultas.length}</strong>
                <span>consulta{filteredConsultas.length === 1 ? '' : 's'}</span>
              </div>
            )}
          </div>

          {/* Listagem de Consultas */}
          <div style={{ marginTop: '1.5rem' }}>
            {loading ? (
              <div className="skeleton-list">
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
                <div className="skeleton skeleton-row"></div>
              </div>
            ) : consultas.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state-icon">
                  <CalendarDays size={42} color="#00b4d8" />
                </div>
                <h4 className="empty-state-title">Nenhuma consulta registrada ainda</h4>
                <p className="empty-state-subtitle">
                  Cadastre ou registre a primeira consulta de um de seus pacientes para começar a gerenciar sua agenda.
                </p>
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ marginTop: '1.25rem', padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Registrar Nova Consulta
                </button>
              </div>
            ) : filteredConsultas.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state-icon">
                  <Search size={36} color="#94a3b8" />
                </div>
                <h4 className="empty-state-title">Nenhuma consulta encontrada</h4>
                <p className="empty-state-subtitle">
                  Não encontramos consultas com os filtros e busca selecionados.
                </p>
              </div>
            ) : (
              <div className="consultas-agenda-list">
                {filteredConsultas.map((c) => {
                  const dataConsultaIso = c.data_consulta ? String(c.data_consulta).split('T')[0] : '';
                  const isFutura = dataConsultaIso > todayStr;
                  const isHoje = dataConsultaIso === todayStr;
                  const isConcluida = dataConsultaIso <= todayStr;

                  return (
                    <div 
                      key={c.id} 
                      className={`consulta-agenda-card ${isHoje ? 'hoje-card' : ''}`}
                    >
                      {/* Coluna da Data */}
                      <div 
                        className="consulta-agenda-date-box"
                        onClick={() => navigate(`/pacientes/${c.paciente_id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="agenda-day-badge">
                          <Calendar size={14} color="#00b4d8" />
                          <span>{formatDate(c.data_consulta)}</span>
                        </div>
                        {isHoje && <span className="hoje-pill">Hoje</span>}
                        {isFutura && <span className="futura-pill">Agendada</span>}
                        {isConcluida && !isHoje && <span className="concluida-pill">Concluída</span>}
                      </div>

                      {/* Informações do Paciente */}
                      <div 
                        className="consulta-agenda-info"
                        onClick={() => navigate(`/pacientes/${c.paciente_id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="consulta-agenda-header-row">
                          <span className="consulta-patient-name">{c.paciente_nome}</span>
                          {c.proximo_retorno && (
                            <span className="retorno-badge-alt">
                              <Clock size={12} />
                              <span>Próximo Retorno: <strong>{formatDate(c.proximo_retorno)}</strong></span>
                            </span>
                          )}
                        </div>

                        {/* Métricas Clínicas da Consulta */}
                        <div className="consulta-metrics-row">
                          {c.peso !== null && c.peso !== undefined && (
                            <span className="consulta-metric-pill">
                              <Scale size={13} color="#0077b6" />
                              <span>Peso: <strong>{c.peso} kg</strong></span>
                            </span>
                          )}
                          {c.percentual_gordura !== null && c.percentual_gordura !== undefined && (
                            <span className="consulta-metric-pill">
                              <Percent size={13} color="#028090" />
                              <span>Gordura: <strong>{c.percentual_gordura}%</strong></span>
                            </span>
                          )}
                          {c.cintura !== null && c.cintura !== undefined && (
                            <span className="consulta-metric-pill">
                              <Activity size={13} color="#f59e0b" />
                              <span>Cintura: <strong>{c.cintura} cm</strong></span>
                            </span>
                          )}
                          {c.quadril !== null && c.quadril !== undefined && (
                            <span className="consulta-metric-pill">
                              <Activity size={13} color="#8b5cf6" />
                              <span>Quadril: <strong>{c.quadril} cm</strong></span>
                            </span>
                          )}
                        </div>

                        {/* Observações / Anotações */}
                        {c.observacoes && (
                          <p className="consulta-agenda-obs">
                            "{c.observacoes}"
                          </p>
                        )}
                      </div>

                      {/* Ações da Consulta: Concluir, Excluir, Prontuário */}
                      <div className="consulta-agenda-actions-group">
                        {isFutura && (
                          <button
                            type="button"
                            className="btn-action-concluir"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarcarConcluida(c);
                            }}
                            title="Marcar como realizada hoje"
                          >
                            <CheckCircle size={15} />
                            <span>Concluir</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConsulta(c.id, c.paciente_nome);
                          }}
                          disabled={deletingConsultaId === c.id}
                          title="Excluir esta consulta"
                        >
                          <Trash2 size={15} />
                        </button>

                        <button
                          type="button"
                          className="consulta-agenda-action"
                          onClick={() => navigate(`/pacientes/${c.paciente_id}`)}
                          title="Abrir prontuário completo"
                        >
                          <span>Prontuário</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE NOVA CONSULTA / AGENDAMENTO */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content notranslate" translate="no" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nova Consulta</h3>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveConsulta}>
              <div className="modal-body">
                {modalError && (
                  <div className="dashboard-alert-error" style={{ marginBottom: '1.25rem' }}>
                    <AlertCircle size={18} />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Seleção do Paciente */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="modal_paciente_id">
                    Paciente <span className="required-star">*</span>
                  </label>
                  <select
                    id="modal_paciente_id"
                    className="form-select"
                    value={formConsulta.paciente_id}
                    onChange={(e) => setFormConsulta({ ...formConsulta, paciente_id: e.target.value })}
                    required
                  >
                    <option value="">Selecione o paciente...</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} {p.whatsapp ? `(${p.whatsapp})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal_data_consulta">
                      Data da Consulta <span className="required-star">*</span>
                    </label>
                    <input 
                      type="date" 
                      id="modal_data_consulta"
                      className="form-input"
                      value={formConsulta.data_consulta}
                      onChange={(e) => setFormConsulta({ ...formConsulta, data_consulta: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="modal_proximo_retorno">Próximo Retorno</label>
                    <input 
                      type="date" 
                      id="modal_proximo_retorno"
                      className="form-input"
                      value={formConsulta.proximo_retorno}
                      onChange={(e) => setFormConsulta({ ...formConsulta, proximo_retorno: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="modal_consulta_peso">Peso Atual (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      id="modal_consulta_peso"
                      className="form-input"
                      placeholder="Ex: 68.5"
                      value={formConsulta.peso}
                      onChange={(e) => setFormConsulta({ ...formConsulta, peso: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="modal_consulta_gordura">% de Gordura</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      id="modal_consulta_gordura"
                      className="form-input"
                      placeholder="Ex: 21.4"
                      value={formConsulta.percentual_gordura}
                      onChange={(e) => setFormConsulta({ ...formConsulta, percentual_gordura: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="modal_consulta_cintura">Cintura (cm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      id="modal_consulta_cintura"
                      className="form-input"
                      placeholder="Ex: 78"
                      value={formConsulta.cintura}
                      onChange={(e) => setFormConsulta({ ...formConsulta, cintura: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="modal_consulta_quadril">Quadril (cm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      id="modal_consulta_quadril"
                      className="form-input"
                      placeholder="Ex: 98"
                      value={formConsulta.quadril}
                      onChange={(e) => setFormConsulta({ ...formConsulta, quadril: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label" htmlFor="modal_consulta_observacoes">Observações da Consulta</label>
                  <textarea 
                    id="modal_consulta_observacoes"
                    className="form-textarea"
                    rows={3}
                    placeholder="Adesão ao plano alimentar, mudanças corporais, sintomas ou orientações..."
                    value={formConsulta.observacoes}
                    onChange={(e) => setFormConsulta({ ...formConsulta, observacoes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-modal-cancel" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-modal-save"
                  disabled={savingConsulta}
                >
                  {savingConsulta ? 'Salvando...' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
