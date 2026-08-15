import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Activity, 
  AlertCircle, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Edit3, 
  CheckCircle2, 
  X, 
  Save,
  LineChart,
  Scale,
  Percent,
  Clock,
  Sparkles,
  HeartPulse,
  Utensils,
  Droplets,
  Moon,
  Sun,
  Dumbbell,
  FileText,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import Layout from '../components/Layout';
import { sql } from '../lib/db';

export default function PacientePerfil({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMetric, setViewMetric] = useState('peso'); // 'peso' | 'gordura'
  const [activeInfoTab, setActiveInfoTab] = useState('clinico'); // 'clinico' | 'habitos' | 'consultas'

  // Estado do Modal de Nova Consulta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formConsulta, setFormConsulta] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  // Função auxiliar para normalizar arrays do Postgres
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

  const fetchPacienteDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const pacienteRes = await sql`
        SELECT * FROM pacientes WHERE id = ${id} LIMIT 1
      `;

      if (!pacienteRes || pacienteRes.length === 0) {
        setError('Paciente não encontrado.');
        return;
      }

      setPaciente(pacienteRes[0]);

      const consultasRes = await sql`
        SELECT * FROM consultas WHERE paciente_id = ${id} ORDER BY data_consulta ASC
      `;
      setConsultas(consultasRes || []);
    } catch (err) {
      console.error('Erro ao buscar detalhes do paciente:', err);
      setError('Erro ao carregar os dados do paciente.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPacienteDetails();
    }
  }, [id, fetchPacienteDetails]);

  // Formatação de data em português
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Não informado';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Cálculo de idade
  const idade = useMemo(() => {
    if (!paciente?.data_nascimento) return null;
    const birth = new Date(paciente.data_nascimento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [paciente]);

  // Dados do paciente tratados
  const objetivosList = useMemo(() => parseArrayField(paciente?.objetivos), [paciente]);
  const patologiasList = useMemo(() => parseArrayField(paciente?.patologias), [paciente]);
  const restricoesList = useMemo(() => parseArrayField(paciente?.restricoes_alimentares), [paciente]);
  const alergiasList = useMemo(() => parseArrayField(paciente?.alergias), [paciente]);

  // Dados cronológicos para o gráfico de evolução
  const timelineData = useMemo(() => {
    if (!paciente) return [];
    const points = [];

    // Ponto 0: Peso inicial no cadastro
    if (paciente.peso_inicial) {
      points.push({
        data: paciente.created_at ? paciente.created_at.split('T')[0] : 'Início',
        label: 'Início',
        peso: parseFloat(paciente.peso_inicial),
        gordura: null,
        cintura: null,
        quadril: null,
        tipo: 'inicial'
      });
    }

    // Pontos das consultas
    consultas.forEach((c, index) => {
      points.push({
        id: c.id,
        data: c.data_consulta ? c.data_consulta.split('T')[0] : '',
        label: `Consulta ${index + 1}`,
        peso: c.peso ? parseFloat(c.peso) : null,
        gordura: c.percentual_gordura ? parseFloat(c.percentual_gordura) : null,
        cintura: c.cintura ? parseFloat(c.cintura) : null,
        quadril: c.quadril ? parseFloat(c.quadril) : null,
        observacoes: c.observacoes,
        tipo: 'consulta'
      });
    });

    return points;
  }, [paciente, consultas]);

  // Cálculos de Evolução e Variação
  const statsEvolucao = useMemo(() => {
    if (!paciente) return null;

    const pesoInicial = paciente.peso_inicial ? parseFloat(paciente.peso_inicial) : null;
    
    // Obter último peso registrado
    const ultimasComPeso = consultas.filter(c => c.peso !== null && c.peso !== undefined);
    const pesoAtual = ultimasComPeso.length > 0 
      ? parseFloat(ultimasComPeso[ultimasComPeso.length - 1].peso) 
      : pesoInicial;

    // Variação de peso
    let diferencaPeso = null;
    let percentualPeso = null;
    if (pesoInicial && pesoAtual) {
      diferencaPeso = (pesoAtual - pesoInicial).toFixed(1);
      percentualPeso = (((pesoAtual - pesoInicial) / pesoInicial) * 100).toFixed(1);
    }

    // IMC Inicial
    const alturaMetros = paciente.altura ? (paciente.altura > 3 ? paciente.altura / 100 : paciente.altura) : null;
    let imcInicial = null;
    if (pesoInicial && alturaMetros && alturaMetros > 0) {
      imcInicial = (pesoInicial / (alturaMetros * alturaMetros)).toFixed(1);
    }

    // IMC Atual
    let imcAtual = null;
    let imcClassificacao = null;
    let imcCor = '';
    if (pesoAtual && alturaMetros && alturaMetros > 0) {
      const imc = pesoAtual / (alturaMetros * alturaMetros);
      imcAtual = imc.toFixed(1);
      if (imc < 18.5) { imcClassificacao = 'Abaixo do peso'; imcCor = 'imc-amber'; }
      else if (imc < 25) { imcClassificacao = 'Peso normal'; imcCor = 'imc-green'; }
      else if (imc < 30) { imcClassificacao = 'Sobrepeso'; imcCor = 'imc-amber'; }
      else if (imc < 35) { imcClassificacao = 'Obesidade Grau I'; imcCor = 'imc-orange'; }
      else { imcClassificacao = 'Obesidade Grau II/III'; imcCor = 'imc-red'; }
    }

    return {
      pesoInicial,
      pesoAtual,
      diferencaPeso: diferencaPeso ? parseFloat(diferencaPeso) : null,
      percentualPeso,
      imcInicial,
      imcAtual,
      imcClassificacao,
      imcCor,
      totalConsultas: consultas.length
    };
  }, [paciente, consultas]);

  // Salvar Nova Consulta
  const handleSaveConsulta = async (e) => {
    e.preventDefault();
    setModalError(null);
    setSavingConsulta(true);

    try {
      const pesoNum = formConsulta.peso ? parseFloat(formConsulta.peso) : null;
      const cinturaNum = formConsulta.cintura ? parseFloat(formConsulta.cintura) : null;
      const quadrilNum = formConsulta.quadril ? parseFloat(formConsulta.quadril) : null;
      const gorduraNum = formConsulta.percentual_gordura ? parseFloat(formConsulta.percentual_gordura) : null;

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
          ${id},
          ${formConsulta.data_consulta},
          ${pesoNum},
          ${cinturaNum},
          ${quadrilNum},
          ${gorduraNum},
          ${formConsulta.observacoes.trim() || null},
          ${formConsulta.proximo_retorno || null}
        )
      `;

      setIsModalOpen(false);
      setFormConsulta({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      });
      await fetchPacienteDetails();
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
      setModalError('Não foi possível salvar a consulta. Verifique os campos e tente novamente.');
    } finally {
      setSavingConsulta(false);
    }
  };

  // Renderizador do Gráfico SVG de Evolução
  const renderChart = () => {
    const validPoints = timelineData.filter(p => viewMetric === 'peso' ? p.peso !== null : p.gordura !== null);

    if (validPoints.length < 2) {
      return (
        <div className="chart-empty-state">
          <LineChart size={36} color="#94a3b8" />
          <p className="chart-empty-title">Dados insuficientes para gerar o gráfico</p>
          <p className="chart-empty-subtitle">
            Registre ao menos 2 avaliações com peso para visualizar a curva de evolução gráfica deste paciente.
          </p>
        </div>
      );
    }

    const values = validPoints.map(p => viewMetric === 'peso' ? p.peso : p.gordura);
    const minVal = Math.min(...values) - 1.5;
    const maxVal = Math.max(...values) + 1.5;
    const range = maxVal - minVal || 1;

    const width = 640;
    const height = 240;
    const paddingX = 45;
    const paddingY = 30;

    const getX = (index) => paddingX + (index / (validPoints.length - 1)) * (width - paddingX * 2);
    const getY = (val) => height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);

    const coordinates = validPoints.map((p, i) => ({
      x: getX(i),
      y: getY(viewMetric === 'peso' ? p.peso : p.gordura),
      point: p,
      val: viewMetric === 'peso' ? p.peso : p.gordura
    }));

    const pathD = coordinates.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');

    const areaD = `${pathD} L ${coordinates[coordinates.length - 1].x} ${height - paddingY} L ${coordinates[0].x} ${height - paddingY} Z`;

    return (
      <div className="evolution-chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="evolution-svg">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00b4d8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00b4d8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas horizontais de grade */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = paddingY + pct * (height - paddingY * 2);
            const valLabel = (maxVal - pct * range).toFixed(1);
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={paddingX - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Área preenchida */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Linha de evolução */}
          <path d={pathD} fill="none" stroke="#00b4d8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Pontos de dados */}
          {coordinates.map((c, i) => (
            <g key={i} className="chart-dot-group">
              <circle cx={c.x} cy={c.y} r="5.5" fill="#ffffff" stroke="#0077b6" strokeWidth="3" />
              <circle cx={c.x} cy={c.y} r="8.5" fill="#00b4d8" opacity="0.2" className="pulse-dot" />
              <text x={c.x} y={c.y - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
                {c.val} {viewMetric === 'peso' ? 'kg' : '%'}
              </text>
              <text x={c.x} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748b">
                {formatDate(c.point.data)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <Layout user={user}>
      <div className="dashboard-content">
        {/* Barra superior de ações */}
        <div className="profile-top-actions">
          <button 
            type="button"
            onClick={() => navigate('/pacientes')} 
            className="btn-back"
          >
            <ArrowLeft size={18} />
            <span>Voltar para Pacientes</span>
          </button>

          {paciente && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn-edit-patient"
                onClick={() => navigate(`/pacientes/${id}/editar`)}
              >
                <Edit3 size={16} />
                <span>Editar Paciente</span>
              </button>

              <button 
                type="button"
                className="btn-nova-consulta"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={16} />
                <span>Registrar Consulta</span>
              </button>
            </div>
          )}
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
            <div style={{ flex: 1 }}>{error}</div>
            <button onClick={fetchPacienteDetails} className="btn-retry">Tentar novamente</button>
          </div>
        ) : paciente ? (
          <div className="profile-container">
            {/* Header Principal do Paciente */}
            <div className="profile-header-card">
              <div className="profile-avatar-large">
                {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="profile-header-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <h1 className="profile-name">{paciente.nome}</h1>
                  {idade !== null && (
                    <span className="calculated-pill" style={{ fontSize: '0.85rem' }}>
                      {idade} anos
                    </span>
                  )}
                </div>

                <div className="profile-meta-tags">
                  {paciente.email ? (
                    <span className="profile-tag">
                      <Mail size={14} /> {paciente.email}
                    </span>
                  ) : (
                    <span className="profile-tag" style={{ opacity: 0.7 }}>
                      <Mail size={14} /> Sem email cadastrado
                    </span>
                  )}
                  {paciente.whatsapp ? (
                    <span className="profile-tag">
                      <Phone size={14} /> {paciente.whatsapp}
                    </span>
                  ) : (
                    <span className="profile-tag" style={{ opacity: 0.7 }}>
                      <Phone size={14} /> Sem telefone cadastrado
                    </span>
                  )}
                  {paciente.sexo && (
                    <span className="profile-tag">
                      <User size={14} /> {paciente.sexo}
                    </span>
                  )}
                  {paciente.created_at && (
                    <span className="profile-tag">
                      <Clock size={14} /> Cadastrado em {formatDate(paciente.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* PAINEL DE EVOLUÇÃO VISUAL */}
            <div className="stat-card evolution-panel-card">
              <div className="evolution-header-row">
                <div className="stat-header-group">
                  <div className="stat-icon-wrapper cyan">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="stat-title" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
                      Evolução do Paciente
                    </h3>
                    <p className="stat-description">
                      Acompanhamento de peso, índice de massa corporal e histórico das avaliações
                    </p>
                  </div>
                </div>

                <div className="metric-toggle-group">
                  <button 
                    type="button"
                    className={`metric-toggle-btn ${viewMetric === 'peso' ? 'active' : ''}`}
                    onClick={() => setViewMetric('peso')}
                  >
                    <Scale size={15} />
                    <span>Peso (kg)</span>
                  </button>
                  <button 
                    type="button"
                    className={`metric-toggle-btn ${viewMetric === 'gordura' ? 'active' : ''}`}
                    onClick={() => setViewMetric('gordura')}
                  >
                    <Percent size={15} />
                    <span>% Gordura</span>
                  </button>
                </div>
              </div>

              {/* Métricas Resumidas em Cards */}
              <div className="evolution-metrics-grid">
                <div className="metric-mini-card">
                  <span className="mini-card-label">Peso Inicial</span>
                  <span className="mini-card-val">
                    {statsEvolucao?.pesoInicial ? `${statsEvolucao.pesoInicial} kg` : 'Não registrado'}
                  </span>
                </div>

                <div className="metric-mini-card">
                  <span className="mini-card-label">Peso Atual</span>
                  <span className="mini-card-val highlight-cyan">
                    {statsEvolucao?.pesoAtual ? `${statsEvolucao.pesoAtual} kg` : 'Não registrado'}
                  </span>
                </div>

                <div className="metric-mini-card">
                  <span className="mini-card-label">Variação Total</span>
                  <div className="mini-card-diff-wrapper">
                    {statsEvolucao?.diferencaPeso !== null ? (
                      <span className={`mini-card-diff ${statsEvolucao.diferencaPeso < 0 ? 'diff-negative' : statsEvolucao.diferencaPeso > 0 ? 'diff-positive' : 'diff-neutral'}`}>
                        {statsEvolucao.diferencaPeso < 0 ? (
                          <TrendingDown size={16} />
                        ) : statsEvolucao.diferencaPeso > 0 ? (
                          <TrendingUp size={16} />
                        ) : (
                          <Minus size={16} />
                        )}
                        <span>{statsEvolucao.diferencaPeso > 0 ? `+${statsEvolucao.diferencaPeso}` : statsEvolucao.diferencaPeso} kg ({statsEvolucao.percentualPeso}%)</span>
                      </span>
                    ) : (
                      <span className="diff-neutral">Sem variação</span>
                    )}
                  </div>
                </div>

                <div className="metric-mini-card">
                  <span className="mini-card-label">IMC Atual</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <span className="mini-card-val">{statsEvolucao?.imcAtual || '--'}</span>
                    {statsEvolucao?.imcClassificacao && (
                      <span className={`imc-badge ${statsEvolucao.imcCor}`} style={{ fontSize: '0.7rem' }}>
                        {statsEvolucao.imcClassificacao}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Renderização do Gráfico SVG */}
              {renderChart()}
            </div>

            {/* SEÇÕES DE DETALHAMENTO DO PRONTUÁRIO */}
            <div className="patient-form-card">
              <div className="form-tabs-header">
                <button
                  type="button"
                  className={`form-tab-btn ${activeInfoTab === 'clinico' ? 'active' : ''}`}
                  onClick={() => setActiveInfoTab('clinico')}
                >
                  <Activity size={18} />
                  <span>Dados Clínicos & Antropometria</span>
                </button>

                <button
                  type="button"
                  className={`form-tab-btn ${activeInfoTab === 'habitos' ? 'active' : ''}`}
                  onClick={() => setActiveInfoTab('habitos')}
                >
                  <HeartPulse size={18} />
                  <span>Hábitos & Rotina</span>
                </button>

                <button
                  type="button"
                  className={`form-tab-btn ${activeInfoTab === 'consultas' ? 'active' : ''}`}
                  onClick={() => setActiveInfoTab('consultas')}
                >
                  <Calendar size={18} />
                  <span>Histórico de Consultas ({consultas.length})</span>
                </button>
              </div>

              <div className="patient-form-body">
                {/* ABA 1: DADOS CLÍNICOS */}
                {activeInfoTab === 'clinico' && (
                  <div className="profile-grid">
                    <div className="stat-card" style={{ boxShadow: 'none' }}>
                      <h4 className="section-title">
                        <Scale size={18} color="#00b4d8" /> Antropometria & Metas
                      </h4>
                      <div className="info-list">
                        <div className="info-row">
                          <span className="info-key">Peso Inicial:</span>
                          <span className="info-val">{paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não informado'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-key">Altura:</span>
                          <span className="info-val">{paciente.altura ? (paciente.altura < 3 ? `${paciente.altura} m` : `${(paciente.altura/100).toFixed(2)} m`) : 'Não informada'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-key">IMC Inicial:</span>
                          <span className="info-val">{statsEvolucao?.imcInicial || 'Não calculado'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-key">Nível de Atividade:</span>
                          <span className="info-val">{paciente.nivel_atividade || 'Não informado'}</span>
                        </div>
                        <div className="info-row" style={{ flexDirection: 'column', gap: '0.4rem' }}>
                          <span className="info-key">Objetivos:</span>
                          <div className="chips-container" style={{ marginTop: '0.2rem' }}>
                            {objetivosList.length > 0 ? (
                              objetivosList.map((obj, i) => (
                                <span key={i} className="chip-btn selected" style={{ cursor: 'default' }}>
                                  {obj}
                                </span>
                              ))
                            ) : paciente.objetivo_texto ? (
                              <span className="info-val">{paciente.objetivo_texto}</span>
                            ) : (
                              <span className="info-val" style={{ opacity: 0.7 }}>Não informado</span>
                            )}
                          </div>
                          {paciente.objetivo_texto && objetivosList.length > 0 && (
                            <p className="consulta-obs" style={{ marginTop: '0.2rem' }}>{paciente.objetivo_texto}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="stat-card" style={{ boxShadow: 'none' }}>
                      <h4 className="section-title">
                        <AlertTriangle size={18} color="#0077b6" /> Condições Clínicas & Alergias
                      </h4>
                      <div className="info-list">
                        <div className="info-row" style={{ flexDirection: 'column', gap: '0.3rem' }}>
                          <span className="info-key">Patologias / Condições de Saúde:</span>
                          <div className="chips-container">
                            {patologiasList.length > 0 ? (
                              patologiasList.map((p, i) => (
                                <span key={i} className={`chip-btn ${p === 'Nenhum' ? 'none-chip selected' : 'selected'}`} style={{ cursor: 'default' }}>
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="info-val" style={{ opacity: 0.7 }}>Nenhuma registrada</span>
                            )}
                          </div>
                        </div>

                        <div className="info-row" style={{ flexDirection: 'column', gap: '0.3rem' }}>
                          <span className="info-key">Restrições Alimentares:</span>
                          <div className="chips-container">
                            {restricoesList.length > 0 ? (
                              restricoesList.map((r, i) => (
                                <span key={i} className={`chip-btn ${r === 'Nenhum' ? 'none-chip selected' : 'selected'}`} style={{ cursor: 'default' }}>
                                  {r}
                                </span>
                              ))
                            ) : (
                              <span className="info-val" style={{ opacity: 0.7 }}>Nenhuma registrada</span>
                            )}
                          </div>
                        </div>

                        <div className="info-row" style={{ flexDirection: 'column', gap: '0.3rem' }}>
                          <span className="info-key">Alergias Alimentares:</span>
                          <div className="chips-container">
                            {alergiasList.length > 0 ? (
                              alergiasList.map((a, i) => (
                                <span key={i} className={`chip-btn ${a === 'Nenhum' ? 'none-chip selected' : 'selected'}`} style={{ cursor: 'default' }}>
                                  {a}
                                </span>
                              ))
                            ) : (
                              <span className="info-val" style={{ opacity: 0.7 }}>Nenhuma registrada</span>
                            )}
                          </div>
                        </div>

                        <div className="info-row">
                          <span className="info-key">Medicamentos em Uso:</span>
                          <span className="info-val">{paciente.medicamentos || 'Nenhum'}</span>
                        </div>

                        <div className="info-row">
                          <span className="info-key">Suplementos:</span>
                          <span className="info-val">{paciente.suplementos || 'Nenhum'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 2: HÁBITOS E ROTINA */}
                {activeInfoTab === 'habitos' && (
                  <div className="profile-grid">
                    <div className="stat-card" style={{ boxShadow: 'none' }}>
                      <h4 className="section-title">
                        <Utensils size={18} color="#00b4d8" /> Rotina Diária & Alimentação
                      </h4>
                      <div className="info-list">
                        <div className="info-row">
                          <span className="info-key">Refeições por dia:</span>
                          <span className="info-val">{paciente.refeicoes_por_dia ? `${paciente.refeicoes_por_dia} refeições` : 'Não informado'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-key">Consumo diário de água:</span>
                          <span className="info-val">{paciente.litros_agua ? `${paciente.litros_agua} litros` : 'Não informado'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-key">Horário que costuma acordar:</span>
                          <span className="info-val">{paciente.horario_acorda || 'Não informado'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-key">Horário que costuma dormir:</span>
                          <span className="info-val">{paciente.horario_dorme || 'Não informado'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="stat-card" style={{ boxShadow: 'none' }}>
                      <h4 className="section-title">
                        <Dumbbell size={18} color="#0077b6" /> Exercício Físico & Observações
                      </h4>
                      <div className="info-list">
                        <div className="info-row">
                          <span className="info-key">Pratica atividade física:</span>
                          <span className="info-val">{paciente.atividade_fisica ? 'Sim' : 'Não'}</span>
                        </div>
                        {paciente.atividade_fisica && (
                          <div className="info-row">
                            <span className="info-key">Descrição da Atividade:</span>
                            <span className="info-val">{paciente.atividade_fisica_descricao || 'Não especificada'}</span>
                          </div>
                        )}
                        <div className="info-row" style={{ flexDirection: 'column', gap: '0.4rem' }}>
                          <span className="info-key">Observações Gerais:</span>
                          <p className="consulta-obs">
                            {paciente.observacoes || 'Nenhuma observação adicional cadastrada.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 3: HISTÓRICO DE CONSULTAS */}
                {activeInfoTab === 'consultas' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h4 className="section-title" style={{ marginBottom: 0 }}>
                        <Calendar size={18} color="#0077b6" /> Consultas Registradas ({consultas.length})
                      </h4>
                      <button 
                        type="button" 
                        className="btn-nova-consulta"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => setIsModalOpen(true)}
                      >
                        <Plus size={15} />
                        <span>Nova Consulta</span>
                      </button>
                    </div>

                    {consultas.length === 0 ? (
                      <div className="empty-state-container" style={{ padding: '2.5rem 1rem' }}>
                        <Calendar size={36} color="#94a3b8" />
                        <h4 className="empty-state-title" style={{ fontSize: '1.05rem', marginTop: '0.5rem' }}>
                          Nenhuma consulta registrada ainda
                        </h4>
                        <p className="empty-state-subtitle" style={{ fontSize: '0.85rem' }}>
                          Clique no botão "Nova Consulta" acima para adicionar a primeira avaliação clínica.
                        </p>
                      </div>
                    ) : (
                      <div className="consultas-history-list">
                        {[...consultas].reverse().map(c => (
                          <div key={c.id} className="consulta-history-item">
                            <div className="consulta-date-col">
                              <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                                {formatDate(c.data_consulta)}
                              </strong>
                              {c.proximo_retorno && (
                                <span className="retorno-badge">
                                  Próximo Retorno: {formatDate(c.proximo_retorno)}
                                </span>
                              )}
                            </div>
                            <div className="consulta-data-col">
                              {c.peso && <span><strong>Peso:</strong> {c.peso} kg</span>}
                              {c.percentual_gordura && <span><strong>% Gordura:</strong> {c.percentual_gordura}%</span>}
                              {c.cintura && <span><strong>Cintura:</strong> {c.cintura} cm</span>}
                              {c.quadril && <span><strong>Quadril:</strong> {c.quadril} cm</span>}
                              {c.observacoes && <p className="consulta-obs">{c.observacoes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* MODAL DE REGISTRAR NOVA CONSULTA */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar size={22} color="#00b4d8" />
                  <h3 className="modal-title">Registrar Nova Consulta</h3>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div className="dashboard-alert-error" style={{ margin: '1rem 1.5rem 0 1.5rem' }}>
                  <AlertCircle size={18} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveConsulta} className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="data_consulta">
                      Data da consulta <span className="required-star">*</span>
                    </label>
                    <input 
                      type="date" 
                      id="data_consulta"
                      className="form-input" 
                      value={formConsulta.data_consulta}
                      onChange={(e) => setFormConsulta({ ...formConsulta, data_consulta: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="proximo_retorno">Próximo retorno</label>
                    <input 
                      type="date" 
                      id="proximo_retorno"
                      className="form-input" 
                      value={formConsulta.proximo_retorno}
                      onChange={(e) => setFormConsulta({ ...formConsulta, proximo_retorno: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="consulta_peso">Peso atual</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        step="0.1" 
                        id="consulta_peso"
                        className="form-input" 
                        placeholder="Ex: 68.5"
                        value={formConsulta.peso}
                        onChange={(e) => setFormConsulta({ ...formConsulta, peso: e.target.value })}
                      />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="consulta_gordura">% de Gordura</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        step="0.1" 
                        id="consulta_gordura"
                        className="form-input" 
                        placeholder="Ex: 21.4"
                        value={formConsulta.percentual_gordura}
                        onChange={(e) => setFormConsulta({ ...formConsulta, percentual_gordura: e.target.value })}
                      />
                      <span className="input-suffix">%</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="consulta_cintura">Circunferência da cintura</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        step="0.1" 
                        id="consulta_cintura"
                        className="form-input" 
                        placeholder="Ex: 78"
                        value={formConsulta.cintura}
                        onChange={(e) => setFormConsulta({ ...formConsulta, cintura: e.target.value })}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="consulta_quadril">Circunferência do quadril</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        step="0.1" 
                        id="consulta_quadril"
                        className="form-input" 
                        placeholder="Ex: 98"
                        value={formConsulta.quadril}
                        onChange={(e) => setFormConsulta({ ...formConsulta, quadril: e.target.value })}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-group span-2">
                    <label className="form-label" htmlFor="consulta_observacoes">Observações clínicas e evolução</label>
                    <textarea 
                      id="consulta_observacoes"
                      className="form-textarea" 
                      rows={3}
                      placeholder="Adesão ao plano alimentar, mudanças corporais, sintomas ou orientações adicionais..."
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
                    className="btn-modal-submit"
                    disabled={savingConsulta}
                  >
                    <Save size={16} />
                    <span>{savingConsulta ? 'Salvando...' : 'Salvar Consulta'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
