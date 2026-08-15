import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, 
  Activity, 
  HeartPulse, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Plus, 
  X, 
  AlertCircle, 
  Clock, 
  Save,
  CheckCircle2
} from 'lucide-react';
import Layout from '../components/Layout';
import { sql } from '../lib/db';

export default function NovoPaciente({ user, isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pessoal');
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Aba 1 - Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2 - Clínico
  const [pesoInicial, setPesoInicial] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivos, setObjetivos] = useState([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [patologias, setPatologias] = useState([]);
  const [customPatologia, setCustomPatologia] = useState('');
  const [restricoes, setRestricoes] = useState([]);
  const [customRestricao, setCustomRestricao] = useState('');
  const [alergias, setAlergias] = useState([]);
  const [customAlergia, setCustomAlergia] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba 3 - Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState(false);
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Carregar dados para edição
  useEffect(() => {
    async function carregarDadosEdicao() {
      if (!isEdit || !id) return;
      try {
        setInitialLoading(true);
        setError(null);
        const res = await sql`SELECT * FROM pacientes WHERE id = ${id} LIMIT 1`;
        if (res.length === 0) {
          setError('Paciente não encontrado para edição.');
          return;
        }
        const p = res[0];
        const toISODate = (val) => {
          if (!val) return '';
          if (val instanceof Date) return val.toISOString().split('T')[0];
          return String(val).split('T')[0];
        };
        const parseArray = (val) => {
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

        setNome(p.nome || '');
        setDataNascimento(toISODate(p.data_nascimento));
        setSexo(p.sexo || '');
        setWhatsapp(p.whatsapp || '');
        setEmail(p.email || '');
        setPesoInicial(p.peso_inicial ? String(p.peso_inicial) : '');
        setAltura(p.altura ? (p.altura < 3 ? String(Math.round(p.altura * 100)) : String(p.altura)) : '');
        setObjetivos(parseArray(p.objetivos));
        setObjetivoTexto(p.objetivo_texto || '');
        setNivelAtividade(p.nivel_atividade || '');
        setPatologias(parseArray(p.patologias));
        setRestricoes(parseArray(p.restricoes_alimentares));
        setAlergias(parseArray(p.alergias));
        setMedicamentos(p.medicamentos || '');
        setSuplementos(p.suplementos || '');
        setRefeicoesPorDia(p.refeicoes_por_dia ? String(p.refeicoes_por_dia) : '');
        setHorarioAcorda(p.horario_acorda || '');
        setHorarioDorme(p.horario_dorme || '');
        setLitrosAgua(p.litros_agua ? String(p.litros_agua) : '');
        setPraticaAtividade(Boolean(p.atividade_fisica));
        setAtividadeDescricao(p.atividade_fisica_descricao || '');
        setObservacoes(p.observacoes || '');
      } catch (err) {
        console.error('Erro ao carregar paciente para edição:', err);
        setError('Não foi possível carregar os dados do paciente.');
      } finally {
        setInitialLoading(false);
      }
    }
    carregarDadosEdicao();
  }, [isEdit, id]);

  // Cálculo da idade
  const idade = useMemo(() => {
    if (!dataNascimento) return null;
    const birth = new Date(dataNascimento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dataNascimento]);

  // Máscara de Telefone / WhatsApp
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Conversão de formato de hora
  const formatTime = (value) => {
    if (!value) return '';
    const clean = value.replace(/\D/g, '');
    if (!clean) return value;
    
    if (clean.length === 1 || clean.length === 2) {
      const h = parseInt(clean, 10);
      if (h >= 0 && h <= 23) {
        return `${String(h).padStart(2, '0')}:00`;
      }
    } else if (clean.length === 3) {
      const h = parseInt(clean.slice(0, 1), 10);
      const m = parseInt(clean.slice(1, 3), 10);
      if (h <= 23 && m <= 59) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    } else if (clean.length >= 4) {
      const h = parseInt(clean.slice(0, 2), 10);
      const m = parseInt(clean.slice(2, 4), 10);
      if (h <= 23 && m <= 59) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    return value;
  };

  // Cálculo automático do IMC
  const imcInfo = useMemo(() => {
    const pesoNum = parseFloat(pesoInicial);
    const alturaNum = parseFloat(altura);

    if (!pesoNum || !alturaNum || pesoNum <= 0 || alturaNum <= 0) {
      return null;
    }

    const alturaMetros = alturaNum > 3 ? alturaNum / 100 : alturaNum;
    if (alturaMetros <= 0) return null;

    const imc = pesoNum / (alturaMetros * alturaMetros);
    const imcFormatted = imc.toFixed(1);

    let classificacao = '';
    let corBadge = '';

    if (imc < 18.5) {
      classificacao = 'Abaixo do peso';
      corBadge = 'imc-amber';
    } else if (imc < 25) {
      classificacao = 'Peso normal';
      corBadge = 'imc-green';
    } else if (imc < 30) {
      classificacao = 'Sobrepeso';
      corBadge = 'imc-amber';
    } else if (imc < 35) {
      classificacao = 'Obesidade Grau I';
      corBadge = 'imc-orange';
    } else if (imc < 40) {
      classificacao = 'Obesidade Grau II';
      corBadge = 'imc-red';
    } else {
      classificacao = 'Obesidade Grau III';
      corBadge = 'imc-red';
    }

    return {
      valor: imcFormatted,
      classificacao,
      corBadge
    };
  }, [pesoInicial, altura]);

  const toggleChip = (list, setList, item) => {
    if (item === 'Nenhum') {
      if (list.includes('Nenhum')) {
        setList([]);
      } else {
        setList(['Nenhum']);
      }
      return;
    }

    let newList = list.filter(i => i !== 'Nenhum');
    if (newList.includes(item)) {
      newList = newList.filter(i => i !== item);
    } else {
      newList.push(item);
    }
    setList(newList);
  };

  const addCustomChip = (list, setList, customVal, setCustomVal) => {
    const trimmed = customVal.trim();
    if (!trimmed) return;
    let newList = list.filter(i => i !== 'Nenhum');
    if (!newList.includes(trimmed)) {
      setList([...newList, trimmed]);
    }
    setCustomVal('');
  };

  // Submissão do Formulário (Criação ou Edição)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('Por favor, informe o nome completo do paciente.');
      setActiveTab('pessoal');
      return;
    }

    setSaving(true);

    try {
      let nutId = user?.id;
      if (!nutId && user?.email) {
        const nutRes = await sql`SELECT id FROM nutricionistas WHERE email = ${user.email} LIMIT 1`;
        if (nutRes.length > 0) nutId = nutRes[0].id;
      }

      if (!nutId) {
        throw new Error('Sessão expirada ou nutricionista não identificada.');
      }

      const pesoVal = pesoInicial ? parseFloat(pesoInicial) : null;
      let alturaVal = altura ? parseFloat(altura) : null;
      if (alturaVal && alturaVal > 3) {
        alturaVal = parseFloat((alturaVal / 100).toFixed(2));
      }
      const litrosVal = litrosAgua ? parseFloat(litrosAgua) : null;
      const refeicoesVal = refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null;

      if (isEdit && id) {
        // Atualizar dados existentes do paciente
        await sql`
          UPDATE pacientes SET
            nome = ${nome.trim()},
            data_nascimento = ${dataNascimento || null},
            sexo = ${sexo || null},
            whatsapp = ${whatsapp || telefone || null},
            email = ${email.trim() || null},
            peso_inicial = ${pesoVal},
            altura = ${alturaVal},
            objetivos = ${objetivos.length > 0 ? objetivos : null},
            objetivo_texto = ${objetivoTexto.trim() || null},
            nivel_atividade = ${nivelAtividade || null},
            patologias = ${patologias.length > 0 ? patologias : null},
            restricoes_alimentares = ${restricoes.length > 0 ? restricoes : null},
            alergias = ${alergias.length > 0 ? alergias : null},
            medicamentos = ${medicamentos.trim() || null},
            suplementos = ${suplementos.trim() || null},
            refeicoes_por_dia = ${refeicoesVal},
            horario_acorda = ${horarioAcorda.trim() || null},
            horario_dorme = ${horarioDorme.trim() || null},
            litros_agua = ${litrosVal},
            atividade_fisica = ${praticaAtividade},
            atividade_fisica_descricao = ${praticaAtividade ? atividadeDescricao.trim() : null},
            observacoes = ${observacoes.trim() || null}
          WHERE id = ${id} AND nutricionista_id = ${nutId}
        `;

        setSuccessMessage('Dados do paciente atualizados com sucesso!');
        setTimeout(() => {
          navigate(`/pacientes/${id}`);
        }, 800);
      } else {
        // Criar novo paciente
        const inserted = await sql`
          INSERT INTO pacientes (
            nutricionista_id,
            nome,
            data_nascimento,
            sexo,
            whatsapp,
            email,
            peso_inicial,
            altura,
            objetivos,
            objetivo_texto,
            nivel_atividade,
            patologias,
            restricoes_alimentares,
            alergias,
            medicamentos,
            suplementos,
            refeicoes_por_dia,
            horario_acorda,
            horario_dorme,
            litros_agua,
            atividade_fisica,
            atividade_fisica_descricao,
            observacoes
          ) VALUES (
            ${nutId},
            ${nome.trim()},
            ${dataNascimento || null},
            ${sexo || null},
            ${whatsapp || telefone || null},
            ${email.trim() || null},
            ${pesoVal},
            ${alturaVal},
            ${objetivos.length > 0 ? objetivos : null},
            ${objetivoTexto.trim() || null},
            ${nivelAtividade || null},
            ${patologias.length > 0 ? patologias : null},
            ${restricoes.length > 0 ? restricoes : null},
            ${alergias.length > 0 ? alergias : null},
            ${medicamentos.trim() || null},
            ${suplementos.trim() || null},
            ${refeicoesVal},
            ${horarioAcorda.trim() || null},
            ${horarioDorme.trim() || null},
            ${litrosVal},
            ${praticaAtividade},
            ${praticaAtividade ? atividadeDescricao.trim() : null},
            ${observacoes.trim() || null}
          )
          RETURNING id
        `;

        if (inserted && inserted.length > 0) {
          const newPatientId = inserted[0].id;
          setSuccessMessage('Paciente cadastrado com sucesso!');
          setTimeout(() => {
            navigate(`/pacientes/${newPatientId}`);
          }, 800);
        } else {
          throw new Error('Falha ao registrar paciente no banco de dados.');
        }
      }
    } catch (err) {
      console.error('Erro ao salvar paciente:', err);
      setError(err.message || 'Ocorreu um erro ao salvar o paciente. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const OBJETIVOS_OPCOES = [
    'Emagrecer',
    'Ganhar massa',
    'Controlar diabetes',
    'Saúde geral',
    'Performance esportiva',
    'Reeducação alimentar'
  ];

  const ATIVIDADE_OPCOES = [
    'Sedentário',
    'Levemente ativo',
    'Moderadamente ativo',
    'Muito ativo',
    'Extremamente ativo'
  ];

  const PATOLOGIAS_OPCOES = [
    'Diabetes',
    'Hipertensão',
    'Hipotireoidismo',
    'Hipertireoidismo',
    'Síndrome do ovário policístico',
    'Doença celíaca',
    'Colesterol alto'
  ];

  const RESTRICOES_OPCOES = [
    'Lactose',
    'Glúten',
    'Açúcar',
    'Carne vermelha',
    'Frutos do mar'
  ];

  const ALERGIAS_OPCOES = [
    'Amendoim',
    'Leite',
    'Ovo',
    'Soja',
    'Trigo',
    'Frutos do mar'
  ];

  if (initialLoading) {
    return (
      <Layout user={user}>
        <div className="dashboard-content">
          <div className="stat-card">
            <div className="skeleton-list">
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="dashboard-content">
        <div style={{ marginBottom: '1.25rem' }}>
          <button 
            type="button"
            onClick={() => navigate(isEdit && id ? `/pacientes/${id}` : '/pacientes')} 
            className="btn-back"
          >
            <ArrowLeft size={18} />
            <span>{isEdit ? 'Voltar para Prontuário' : 'Voltar para Pacientes'}</span>
          </button>
        </div>

        <div className="form-header-title">
          <h1 className="dashboard-greeting">
            {isEdit ? 'Editar Paciente' : 'Novo Paciente'}
          </h1>
          <p className="dashboard-subtext">
            {isEdit 
              ? 'Atualize as informações cadastrais, clínicas e os hábitos do paciente.' 
              : 'Preencha os dados cadastrais, clínicos e hábitos para criar o prontuário.'}
          </p>
        </div>

        {error && (
          <div className="dashboard-alert-error" style={{ marginTop: '1rem' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="dashboard-alert-success" style={{ marginTop: '1rem' }}>
            <CheckCircle2 size={20} />
            <span>{successMessage} Redirecionando...</span>
          </div>
        )}

        <div className="patient-form-card">
          <div className="form-tabs-header">
            <button
              type="button"
              className={`form-tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setActiveTab('pessoal')}
            >
              <User size={18} />
              <span>1. Pessoal</span>
            </button>

            <button
              type="button"
              className={`form-tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setActiveTab('clinico')}
            >
              <Activity size={18} />
              <span>2. Clínico</span>
            </button>

            <button
              type="button"
              className={`form-tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setActiveTab('habitos')}
            >
              <HeartPulse size={18} />
              <span>3. Hábitos</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="patient-form-body">
            {/* ABA 1: DADOS PESSOAIS */}
            {activeTab === 'pessoal' && (
              <div className="tab-pane">
                <div className="form-grid-2">
                  <div className="form-group span-2">
                    <label className="form-label" htmlFor="nome">
                      Nome completo <span className="required-star">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="nome"
                      className="form-input" 
                      placeholder="Ex: Maria Clara Silva" 
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" htmlFor="dataNascimento">Data de nascimento</label>
                      {idade !== null && (
                        <span className="calculated-pill">{idade} anos</span>
                      )}
                    </div>
                    <input 
                      type="date" 
                      id="dataNascimento"
                      className="form-input" 
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <div className="radio-group-pills">
                      {['Feminino', 'Masculino', 'Outro'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`radio-pill-btn ${sexo === s ? 'selected' : ''}`}
                          onClick={() => setSexo(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="telefone">Telefone</label>
                    <input 
                      type="text" 
                      id="telefone"
                      className="form-input" 
                      placeholder="(00) 0000-0000" 
                      value={telefone}
                      onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="whatsapp">WhatsApp</label>
                    <input 
                      type="text" 
                      id="whatsapp"
                      className="form-input" 
                      placeholder="(00) 00000-0000" 
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    />
                  </div>

                  <div className="form-group span-2">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email"
                      className="form-input" 
                      placeholder="paciente@exemplo.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="tab-actions-footer">
                  <div></div>
                  <button 
                    type="button" 
                    className="btn-next-tab"
                    onClick={() => setActiveTab('clinico')}
                  >
                    <span>Avançar para Clínico</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ABA 2: DADOS CLÍNICOS */}
            {activeTab === 'clinico' && (
              <div className="tab-pane">
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="peso">Peso atual</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        step="0.1" 
                        id="peso"
                        className="form-input" 
                        placeholder="Ex: 70.5" 
                        value={pesoInicial}
                        onChange={(e) => setPesoInicial(e.target.value)}
                      />
                      <span className="input-suffix">kg</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="altura">Altura</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        step="1" 
                        id="altura"
                        className="form-input" 
                        placeholder="Ex: 175" 
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                      />
                      <span className="input-suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">IMC Calculado</label>
                    <div className="imc-display-box">
                      {imcInfo ? (
                        <div className="imc-result-wrapper">
                          <span className="imc-number">{imcInfo.valor}</span>
                          <span className={`imc-badge ${imcInfo.corBadge}`}>
                            {imcInfo.classificacao}
                          </span>
                        </div>
                      ) : (
                        <span className="imc-placeholder">Informe peso e altura</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Objetivo principal (seleção múltipla)</label>
                  <div className="chips-container">
                    {OBJETIVOS_OPCOES.map((obj) => (
                      <button
                        key={obj}
                        type="button"
                        className={`chip-btn ${objetivos.includes(obj) ? 'selected' : ''}`}
                        onClick={() => toggleChip(objetivos, setObjetivos, obj)}
                      >
                        {objetivos.includes(obj) && <Check size={14} />}
                        <span>{obj}</span>
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Outro objetivo específico ou detalhes adicionais..." 
                    style={{ marginTop: '0.6rem' }}
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Nível de atividade física</label>
                  <div className="radio-group-pills">
                    {ATIVIDADE_OPCOES.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        className={`radio-pill-btn ${nivelAtividade === lvl ? 'selected' : ''}`}
                        onClick={() => setNivelAtividade(lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Patologias ou condições de saúde</label>
                  <div className="chips-container">
                    <button
                      type="button"
                      className={`chip-btn none-chip ${patologias.includes('Nenhum') ? 'selected' : ''}`}
                      onClick={() => toggleChip(patologias, setPatologias, 'Nenhum')}
                    >
                      Nenhum
                    </button>
                    {PATOLOGIAS_OPCOES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`chip-btn ${patologias.includes(p) ? 'selected' : ''}`}
                        onClick={() => toggleChip(patologias, setPatologias, p)}
                      >
                        {patologias.includes(p) && <Check size={14} />}
                        <span>{p}</span>
                      </button>
                    ))}
                    {patologias.filter(p => !PATOLOGIAS_OPCOES.includes(p) && p !== 'Nenhum').map((custom) => (
                      <span key={custom} className="chip-btn selected custom-chip">
                        <span>{custom}</span>
                        <X size={14} onClick={() => toggleChip(patologias, setPatologias, custom)} />
                      </span>
                    ))}
                  </div>
                  <div className="add-custom-chip-row">
                    <input 
                      type="text" 
                      className="form-input custom-input" 
                      placeholder="Adicionar outra patologia..."
                      value={customPatologia}
                      onChange={(e) => setCustomPatologia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomChip(patologias, setPatologias, customPatologia, setCustomPatologia);
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-add-chip"
                      onClick={() => addCustomChip(patologias, setPatologias, customPatologia, setCustomPatologia)}
                    >
                      <Plus size={16} />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Restrições alimentares</label>
                  <div className="chips-container">
                    <button
                      type="button"
                      className={`chip-btn none-chip ${restricoes.includes('Nenhum') ? 'selected' : ''}`}
                      onClick={() => toggleChip(restricoes, setRestricoes, 'Nenhum')}
                    >
                      Nenhum
                    </button>
                    {RESTRICOES_OPCOES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={`chip-btn ${restricoes.includes(r) ? 'selected' : ''}`}
                        onClick={() => toggleChip(restricoes, setRestricoes, r)}
                      >
                        {restricoes.includes(r) && <Check size={14} />}
                        <span>{r}</span>
                      </button>
                    ))}
                    {restricoes.filter(r => !RESTRICOES_OPCOES.includes(r) && r !== 'Nenhum').map((custom) => (
                      <span key={custom} className="chip-btn selected custom-chip">
                        <span>{custom}</span>
                        <X size={14} onClick={() => toggleChip(restricoes, setRestricoes, custom)} />
                      </span>
                    ))}
                  </div>
                  <div className="add-custom-chip-row">
                    <input 
                      type="text" 
                      className="form-input custom-input" 
                      placeholder="Adicionar outra restrição..."
                      value={customRestricao}
                      onChange={(e) => setCustomRestricao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomChip(restricoes, setRestricoes, customRestricao, setCustomRestricao);
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-add-chip"
                      onClick={() => addCustomChip(restricoes, setRestricoes, customRestricao, setCustomRestricao)}
                    >
                      <Plus size={16} />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Alergias alimentares</label>
                  <div className="chips-container">
                    <button
                      type="button"
                      className={`chip-btn none-chip ${alergias.includes('Nenhum') ? 'selected' : ''}`}
                      onClick={() => toggleChip(alergias, setAlergias, 'Nenhum')}
                    >
                      Nenhum
                    </button>
                    {ALERGIAS_OPCOES.map((a) => (
                      <button
                        key={a}
                        type="button"
                        className={`chip-btn ${alergias.includes(a) ? 'selected' : ''}`}
                        onClick={() => toggleChip(alergias, setAlergias, a)}
                      >
                        {alergias.includes(a) && <Check size={14} />}
                        <span>{a}</span>
                      </button>
                    ))}
                    {alergias.filter(a => !ALERGIAS_OPCOES.includes(a) && a !== 'Nenhum').map((custom) => (
                      <span key={custom} className="chip-btn selected custom-chip">
                        <span>{custom}</span>
                        <X size={14} onClick={() => toggleChip(alergias, setAlergias, custom)} />
                      </span>
                    ))}
                  </div>
                  <div className="add-custom-chip-row">
                    <input 
                      type="text" 
                      className="form-input custom-input" 
                      placeholder="Adicionar outra alergia..."
                      value={customAlergia}
                      onChange={(e) => setCustomAlergia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomChip(alergias, setAlergias, customAlergia, setCustomAlergia);
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-add-chip"
                      onClick={() => addCustomChip(alergias, setAlergias, customAlergia, setCustomAlergia)}
                    >
                      <Plus size={16} />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="medicamentos">Medicamentos contínuos</label>
                    <textarea 
                      id="medicamentos"
                      className="form-textarea" 
                      rows={2}
                      placeholder="Ex: Losartana 50mg, Levotiroxina 25mcg..."
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="suplementos">Suplementos em uso</label>
                    <textarea 
                      id="suplementos"
                      className="form-textarea" 
                      rows={2}
                      placeholder="Ex: Whey protein, Creatina 5g, Vitamina D..."
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                    />
                  </div>
                </div>

                <div className="tab-actions-footer">
                  <button 
                    type="button" 
                    className="btn-prev-tab"
                    onClick={() => setActiveTab('pessoal')}
                  >
                    <ArrowLeft size={18} />
                    <span>Voltar</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn-next-tab"
                    onClick={() => setActiveTab('habitos')}
                  >
                    <span>Avançar para Hábitos</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ABA 3: HÁBITOS E ROTINA */}
            {activeTab === 'habitos' && (
              <div className="tab-pane">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="refeicoes">Refeições por dia</label>
                    <input 
                      type="number" 
                      id="refeicoes"
                      className="form-input" 
                      placeholder="Ex: 4" 
                      value={refeicoesPorDia}
                      onChange={(e) => setRefeicoesPorDia(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="agua">Quantidade de água por dia</label>
                    <div className="input-with-suffix">
                      <input 
                        type="number" 
                        step="0.1" 
                        id="agua"
                        className="form-input" 
                        placeholder="Ex: 2.5" 
                        value={litrosAgua}
                        onChange={(e) => setLitrosAgua(e.target.value)}
                      />
                      <span className="input-suffix">litros</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="acorda">Horário que acorda</label>
                    <div className="input-with-icon">
                      <Clock size={18} color="#64748b" />
                      <input 
                        type="text" 
                        id="acorda"
                        className="form-input" 
                        placeholder="Ex: 6 (06:00) ou 630 (06:30)" 
                        value={horarioAcorda}
                        onChange={(e) => setHorarioAcorda(e.target.value)}
                        onBlur={(e) => setHorarioAcorda(formatTime(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dorme">Horário que dorme</label>
                    <div className="input-with-icon">
                      <Clock size={18} color="#64748b" />
                      <input 
                        type="text" 
                        id="dorme"
                        className="form-input" 
                        placeholder="Ex: 23 (23:00) ou 2230 (22:30)" 
                        value={horarioDorme}
                        onChange={(e) => setHorarioDorme(e.target.value)}
                        onBlur={(e) => setHorarioDorme(formatTime(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Pratica atividade física?</label>
                  <div className="radio-group-pills">
                    <button
                      type="button"
                      className={`radio-pill-btn ${praticaAtividade === false ? 'selected' : ''}`}
                      onClick={() => setPraticaAtividade(false)}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      className={`radio-pill-btn ${praticaAtividade === true ? 'selected' : ''}`}
                      onClick={() => setPraticaAtividade(true)}
                    >
                      Sim
                    </button>
                  </div>

                  {praticaAtividade && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Qual atividade e frequência semanal? (Ex: Musculação 4x na semana)"
                        value={atividadeDescricao}
                        onChange={(e) => setAtividadeDescricao(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label" htmlFor="observacoes">Observações gerais</label>
                  <textarea 
                    id="observacoes"
                    className="form-textarea" 
                    rows={3}
                    placeholder="Histórico alimentar, preferências, rotina de trabalho ou anotações relevantes..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>

                <div className="tab-actions-footer">
                  <button 
                    type="button" 
                    className="btn-prev-tab"
                    onClick={() => setActiveTab('clinico')}
                  >
                    <ArrowLeft size={18} />
                    <span>Voltar</span>
                  </button>

                  <button 
                    type="submit" 
                    className="btn-save-patient"
                    disabled={saving}
                  >
                    <Save size={18} />
                    <span>{saving ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Salvar Paciente')}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
}
