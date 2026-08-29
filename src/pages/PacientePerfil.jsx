import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  X, 
  Save,
  LineChart,
  Scale,
  Percent,
  Clock,
  Sparkles,
  HeartPulse,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Eye,
  Check,
  Trash2,
  Coffee,
  Apple,
  Salad,
  Sandwich,
  Soup,
  RotateCcw,
  Loader2,
  Copy,
  Edit3,
  Printer,
  FileDown,
  MessageCircle,
  Zap,
  ShoppingCart
} from 'lucide-react';
import Layout from '../components/Layout';
import { sql } from '../lib/db';
import { baixarArquivoPDF, imprimirExportarPDF, compartilharWhatsApp } from '../lib/pdfGenerator';
import CalculadoraNutricionalModal from '../components/CalculadoraNutricionalModal';
import ListaComprasModal from '../components/ListaComprasModal';
import { 
  calcularIdade, 
  calcularTMB, 
  calcularGET, 
  calcularVET, 
  calcularMacronutrientes 
} from '../lib/calculosNutricionais';

export default function PacientePerfil({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados principais
  const [paciente, setPaciente] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navegação entre as 3 seções principais
  const [activeMainSection, setActiveMainSection] = useState('dados'); // 'dados' | 'consultas' | 'planos'
  const [activeSubTab, setActiveSubTab] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'
  const [viewMetric, setViewMetric] = useState('peso'); // 'peso' | 'gordura'

  // Estados de Edição Direta do Paciente (Seção 1)
  const [savingPatient, setSavingPatient] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState(null);

  // Formulário de Edição dos Dados do Paciente
  const [formData, setFormData] = useState({
    // Pessoal
    nome: '',
    data_nascimento: '',
    sexo: '',
    whatsapp: '',
    email: '',
    // Clínico
    peso_inicial: '',
    altura: '',
    nivel_atividade: '',
    objetivos: [],
    objetivo_texto: '',
    patologias: [],
    restricoes_alimentares: [],
    alergias: [],
    medicamentos: '',
    suplementos: '',
    // Hábitos
    refeicoes_por_dia: '',
    litros_agua: '',
    horario_acorda: '',
    horario_dorme: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  // Chips customizados
  const [customPatologia, setCustomPatologia] = useState('');
  const [customRestricao, setCustomRestricao] = useState('');
  const [customAlergia, setCustomAlergia] = useState('');

  // Estados do Modal de Nova Consulta (Seção 2)
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [consultaModalError, setConsultaModalError] = useState(null);
  const [formConsulta, setFormConsulta] = useState({
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  // Estados de Planos Alimentares (Seção 3: IA, Edição e Histórico)
  const [gerandoPlanoIA, setGerandoPlanoIA] = useState(false);
  const [loadingMensagemIndex, setLoadingMensagemIndex] = useState(0);
  const [planoAtivo, setPlanoAtivo] = useState(null); // { plano_semanal: [...] }
  const [diaAtivoIndex, setDiaAtivoIndex] = useState(0);
  const [salvandoPlano, setSalvandoPlano] = useState(false);
  const [planoToast, setPlanoToast] = useState(null); // { type, message, canRetry, canManual }
  const [selectedPlano, setSelectedPlano] = useState(null); // visualização modal do plano salvo
  const [selectedPlanoDiaIndex, setSelectedPlanoDiaIndex] = useState(0);
  const [deletingPlanoId, setDeletingPlanoId] = useState(null);
  const [copiadoFeedback, setCopiadoFeedback] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // Estados da Calculadora Nutricional de Macros & TMB
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [metasNutricionais, setMetasNutricionais] = useState(null);

  // Estados da Lista de Compras Automática
  const [isListaComprasModalOpen, setIsListaComprasModalOpen] = useState(false);
  const [planoParaListaCompras, setPlanoParaListaCompras] = useState(null);

  // Mensagens dinâmicas para o loading da IA
  const LOADING_MESSAGES = useMemo(() => [
    'Buscando dados do paciente e histórico clínico...',
    'Analisando metas, alergias e restrições alimentares...',
    'IA calculando cardápio saudável e balanceado...',
    'Estruturando 5 opções para cada refeição da semana...',
    'Finalizando plano nutricional personalizado...'
  ], []);

  // Configuração visual das 5 refeições do dia
  const REFEICOES_CONFIG = useMemo(() => [
    { key: 'cafe_da_manha', title: 'Café da Manhã', icon: Coffee, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
    { key: 'lanche_manha', title: 'Lanche da Manhã', icon: Apple, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
    { key: 'almoco', title: 'Almoço', icon: Salad, color: '#00b4d8', bg: 'rgba(0, 180, 216, 0.12)', border: 'rgba(0, 180, 216, 0.25)' },
    { key: 'lanche_tarde', title: 'Lanche da Tarde', icon: Sandwich, color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)' },
    { key: 'jantar', title: 'Jantar', icon: Soup, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.25)' }
  ], []);

  // Efeito para alternar mensagens durante a geração da IA
  useEffect(() => {
    let interval;
    if (gerandoPlanoIA) {
      setLoadingMensagemIndex(0);
      interval = setInterval(() => {
        setLoadingMensagemIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [gerandoPlanoIA, LOADING_MESSAGES]);

  // Função para Gerar Plano com IA via Serverless Function
  const handleGerarPlanoComIA = async () => {
    setGerandoPlanoIA(true);
    setPlanoToast(null);

    try {
      const pacientePayload = {
        ...formData,
        id,
        peso: formData.peso_inicial || paciente?.peso_inicial
      };

      const res = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          paciente: pacientePayload,
          metasNutricionais: metasNutricionais || null
        })
      });

      if (!res.ok) {
        throw new Error(`Erro na chamada da API: status ${res.status}`);
      }

      const data = await res.json();

      let planoObj = data;
      if (typeof data === 'string') {
        try {
          planoObj = JSON.parse(data);
        } catch {
          throw new Error('Falha ao interpretar resposta da IA.');
        }
      }

      if (!planoObj || !Array.isArray(planoObj.plano_semanal) || planoObj.plano_semanal.length === 0) {
        throw new Error('Estrutura de plano inválida retornada pela IA.');
      }

      setPlanoAtivo(planoObj);
      setDiaAtivoIndex(0);
      setPlanoToast({
        type: 'success',
        message: planoObj.origem === 'gemini_ia'
          ? '✨ Plano Alimentar semanal gerado com sucesso pela Inteligência Artificial!'
          : 'Plano Alimentar semanal gerado com base nas diretrizes clínicas de segurança.'
      });
      setTimeout(() => setPlanoToast(null), 5000);
    } catch (err) {
      console.error('Erro ao gerar plano alimentar:', err);
      setPlanoToast({
        type: 'error',
        message: 'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
        canRetry: true,
        canManual: true
      });
    } finally {
      setGerandoPlanoIA(false);
    }
  };

  // Criar Plano Manual do Zero
  const handleCriarPlanoManual = () => {
    setPlanoToast(null);
    const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const novoPlano = {
      plano_semanal: diasSemana.map(dia => ({
        dia,
        refeicoes: {
          cafe_da_manha: ['', '', '', '', ''],
          lanche_manha: ['', '', '', '', ''],
          almoco: ['', '', '', '', ''],
          lanche_tarde: ['', '', '', '', ''],
          jantar: ['', '', '', '', '']
        }
      })),
      origem: 'manual'
    };
    setPlanoAtivo(novoPlano);
    setDiaAtivoIndex(0);
  };

  // Alterar uma opção específica de refeição
  const handleMealOptionChange = (diaIdx, mealKey, optionIdx, value) => {
    if (!planoAtivo) return;
    setPlanoAtivo(prev => {
      const newPlanoSemanal = [...prev.plano_semanal];
      const diaObj = { ...newPlanoSemanal[diaIdx] };
      const refeicoesObj = { ...diaObj.refeicoes };
      const opcoesArr = [...(refeicoesObj[mealKey] || [])];
      opcoesArr[optionIdx] = value;
      refeicoesObj[mealKey] = opcoesArr;
      diaObj.refeicoes = refeicoesObj;
      newPlanoSemanal[diaIdx] = diaObj;
      return {
        ...prev,
        plano_semanal: newPlanoSemanal
      };
    });
  };

  // Persistir o Plano no NeonDB
  const handleSalvarPlanoAlimentar = async () => {
    if (!planoAtivo) return;
    setSalvandoPlano(true);
    setPlanoToast(null);

    try {
      await sql`
        INSERT INTO planos_alimentares (paciente_id, conteudo)
        VALUES (${id}, ${JSON.stringify(planoAtivo)})
      `;

      // Recarregar histórico de planos imediatamente
      const planosAtualizados = await sql`
        SELECT * FROM planos_alimentares WHERE paciente_id = ${id} ORDER BY created_at DESC
      `;
      setPlanos(planosAtualizados || []);

      setPlanoToast({
        type: 'success',
        message: 'Plano Alimentar salvo com sucesso no banco de dados Neon!'
      });
      setTimeout(() => setPlanoToast(null), 5000);
    } catch (err) {
      console.error('Erro ao salvar plano alimentar no NeonDB:', err);
      setPlanoToast({
        type: 'error',
        message: 'Erro ao salvar o plano alimentar no NeonDB. Verifique a conexão e tente novamente.'
      });
    } finally {
      setSalvandoPlano(false);
    }
  };

  // Carregar plano antigo no editor
  const handleCarregarPlanoNoEditor = (plano) => {
    try {
      let parsed = plano.conteudo;
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      if (parsed && Array.isArray(parsed.plano_semanal)) {
        setPlanoAtivo(parsed);
        setDiaAtivoIndex(0);
        setSelectedPlano(null);
        setActiveMainSection('planos');
        window.scrollTo({ top: 300, behavior: 'smooth' });
      } else {
        alert('Este plano não possui o formato semanal estruturado.');
      }
    } catch (e) {
      console.error('Erro ao abrir plano no editor:', e);
      alert('Não foi possível carregar o plano no editor.');
    }
  };

  // Excluir plano alimentar do histórico
  const handleDeletePlano = async (planoId) => {
    if (!window.confirm('Tem certeza de que deseja excluir este plano alimentar do histórico?')) {
      return;
    }
    setDeletingPlanoId(planoId);
    try {
      await sql`
        DELETE FROM planos_alimentares WHERE id = ${planoId}
      `;
      setPlanos(prev => prev.filter(p => p.id !== planoId));
      if (selectedPlano && selectedPlano.id === planoId) {
        setSelectedPlano(null);
      }
      setPlanoToast({
        type: 'success',
        message: 'Plano alimentar excluído do histórico com sucesso.'
      });
      setTimeout(() => setPlanoToast(null), 4000);
    } catch (err) {
      console.error('Erro ao excluir plano alimentar:', err);
      setPlanoToast({
        type: 'error',
        message: 'Erro ao excluir o plano do banco de dados.'
      });
    } finally {
      setDeletingPlanoId(null);
    }
  };

  // Copiar resumo do plano para a área de transferência
  const handleCopiarPlanoTexto = (planoData) => {
    try {
      let obj = planoData.conteudo || planoData;
      if (typeof obj === 'string') {
        obj = JSON.parse(obj);
      }
      if (!obj.plano_semanal) return;

      let texto = `PLANO NUTRICIONAL - ${paciente?.nome || 'PACIENTE'}\n\n`;
      obj.plano_semanal.forEach(d => {
        texto += `=== ${d.dia.toUpperCase()} ===\n`;
        REFEICOES_CONFIG.forEach(r => {
          const opcoes = (d.refeicoes && d.refeicoes[r.key]) || [];
          texto += `\n[${r.title}]\n`;
          opcoes.forEach((op, idx) => {
            if (op && op.trim()) {
              texto += `  • Opção ${idx + 1}: ${op}\n`;
            }
          });
        });
        texto += `\n----------------------------------------\n\n`;
      });

      navigator.clipboard.writeText(texto);
      setCopiadoFeedback(true);
      setTimeout(() => setCopiadoFeedback(false), 2500);
    } catch (err) {
      console.error('Erro ao copiar texto:', err);
    }
  };

  // Exportar Plano Alimentar em PDF com Logo da Clínica
  const handleExportarPDF = async (planoData, modo = 'imprimir') => {
    const dadosPlano = planoData || planoAtivo;
    if (!dadosPlano) return;

    const dadosPaciente = {
      ...formData,
      nome: formData.nome || paciente?.nome,
      whatsapp: formData.whatsapp || paciente?.whatsapp,
      data_nascimento: formData.data_nascimento || paciente?.data_nascimento,
      sexo: formData.sexo || paciente?.sexo,
      peso_inicial: formData.peso_inicial || paciente?.peso_inicial,
      altura: formData.altura || paciente?.altura,
      objetivos: formData.objetivos || paciente?.objetivos,
      objetivo_texto: formData.objetivo_texto || paciente?.objetivo_texto,
      alergias: formData.alergias || paciente?.alergias,
      restricoes_alimentares: formData.restricoes_alimentares || paciente?.restricoes_alimentares,
      litros_agua: formData.litros_agua || paciente?.litros_agua,
      metasNutricionais: metasNutricionais || null
    };

    const dadosNutri = {
      nome: user?.name || user?.nome || 'Nutricionista Responsável'
    };

    if (modo === 'download') {
      await baixarArquivoPDF({
        plano: dadosPlano,
        paciente: dadosPaciente,
        nutricionista: dadosNutri,
        onProgress: (status) => setGerandoPdf(status)
      });
    } else {
      imprimirExportarPDF({
        plano: dadosPlano,
        paciente: dadosPaciente,
        nutricionista: dadosNutri
      });
    }
  };

  // Compartilhar Plano Alimentar via WhatsApp
  const handleCompartilharWhatsApp = (planoData) => {
    const dadosPlano = planoData || planoAtivo;
    if (!dadosPlano) return;

    const dadosPaciente = {
      ...formData,
      nome: formData.nome || paciente?.nome,
      whatsapp: formData.whatsapp || paciente?.whatsapp,
      objetivos: formData.objetivos || paciente?.objetivos,
      objetivo_texto: formData.objetivo_texto || paciente?.objetivo_texto,
      alergias: formData.alergias || paciente?.alergias,
      restricoes_alimentares: formData.restricoes_alimentares || paciente?.restricoes_alimentares,
      litros_agua: formData.litros_agua || paciente?.litros_agua,
      metasNutricionais: metasNutricionais || null
    };

    const dadosNutri = {
      nome: user?.name || user?.nome || 'Nutricionista Responsável'
    };

    compartilharWhatsApp({
      plano: dadosPlano,
      paciente: dadosPaciente,
      nutricionista: dadosNutri
    });
  };

  // Salvar metas da calculadora
  const handleSalvarMetas = (novasMetas) => {
    setMetasNutricionais(novasMetas);
    if (novasMetas.aguaLitros) {
      setFormData(prev => ({ ...prev, litros_agua: novasMetas.aguaLitros }));
    }
    setSaveSuccessMsg(`Metas calculadas com sucesso! Meta Calórica (VET): ${novasMetas.vet} kcal/dia.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Abrir Lista de Compras da Semana
  const handleAbrirListaCompras = (planoTarget) => {
    const p = planoTarget || planoAtivo || (planos && planos.length > 0 ? planos[0] : null);
    if (!p) {
      setPlanoToast({
        type: 'error',
        message: 'Nenhum plano alimentar encontrado. Gere um cardápio com a IA ou crie um Plano Manual primeiro.'
      });
      return;
    }
    setPlanoParaListaCompras(p);
    setIsListaComprasModalOpen(true);
  };

  // Opções pré-definidas para os chips
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
    'Colesterol alto',
    'Nenhum'
  ];

  const RESTRICOES_OPCOES = [
    'Lactose',
    'Glúten',
    'Açúcar',
    'Carne vermelha',
    'Frutos do mar',
    'Nenhum'
  ];

  const ALERGIAS_OPCOES = [
    'Amendoim',
    'Leite',
    'Ovo',
    'Soja',
    'Trigo',
    'Frutos do mar',
    'Nenhum'
  ];

  // Funções utilitárias de tratamento de datas e arrays
  const toISODateString = (val) => {
    if (!val) return '';
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return String(val).split('T')[0];
  };

  const formatDate = (val) => {
    if (!val) return 'Não informado';
    try {
      if (val instanceof Date) {
        return val.toLocaleDateString('pt-BR');
      }
      const str = String(val);
      const dateOnly = str.split('T')[0];
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(val).toLocaleDateString('pt-BR');
    } catch {
      return String(val);
    }
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

  // Carregar dados completos do NeonDB
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

      const p = pacienteRes[0];
      setPaciente(p);

      // Preencher o formulário de edição com os dados atuais
      setFormData({
        nome: p.nome || '',
        data_nascimento: toISODateString(p.data_nascimento),
        sexo: p.sexo || '',
        whatsapp: p.whatsapp || '',
        email: p.email || '',
        peso_inicial: p.peso_inicial ? String(p.peso_inicial) : '',
        altura: p.altura ? (p.altura < 3 ? String(Math.round(p.altura * 100)) : String(p.altura)) : '',
        nivel_atividade: p.nivel_atividade || '',
        objetivos: parseArrayField(p.objetivos),
        objetivo_texto: p.objetivo_texto || '',
        patologias: parseArrayField(p.patologias),
        restricoes_alimentares: parseArrayField(p.restricoes_alimentares),
        alergias: parseArrayField(p.alergias),
        medicamentos: p.medicamentos || '',
        suplementos: p.suplementos || '',
        refeicoes_por_dia: p.refeicoes_por_dia ? String(p.refeicoes_por_dia) : '',
        litros_agua: p.litros_agua ? String(p.litros_agua) : '',
        horario_acorda: p.horario_acorda || '',
        horario_dorme: p.horario_dorme || '',
        atividade_fisica: Boolean(p.atividade_fisica),
        atividade_fisica_descricao: p.atividade_fisica_descricao || '',
        observacoes: p.observacoes || ''
      });

      // Inicializar Metas Nutricionais Clínicas (TMB / GET / VET / Macros)
      const pesoBase = parseFloat(p.peso_inicial) || 70;
      const alturaBase = parseFloat(p.altura) || (p.altura < 3 ? p.altura * 100 : 170);
      const idadeBase = calcularIdade(p.data_nascimento);
      const sexoBase = p.sexo || 'Feminino';
      const atividadeBase = p.nivel_atividade || 'Moderadamente ativo';

      const tmbInit = calcularTMB({ peso: pesoBase, altura: alturaBase, idade: idadeBase, sexo: sexoBase });
      const getInit = calcularGET(tmbInit, atividadeBase);
      const vetInit = calcularVET(getInit, 'deficit_moderado');
      const macrosInit = calcularMacronutrientes({ vet: vetInit, peso: pesoBase, proteinaGKg: 2.0, gorduraPercentual: 25 });

      setMetasNutricionais({
        tmb: tmbInit,
        get: getInit,
        vet: vetInit,
        formula: 'mifflin',
        estrategia: 'deficit_moderado',
        macros: macrosInit,
        aguaLitros: macrosInit.aguaLitros,
        dadosBase: { peso: pesoBase, altura: alturaBase, idade: idadeBase, sexo: sexoBase, nivelAtividade: atividadeBase }
      });

      // Buscar Consultas ordenadas cronologicamente (ASC para gráfico)
      const consultasRes = await sql`
        SELECT * FROM consultas WHERE paciente_id = ${id} ORDER BY data_consulta ASC, created_at ASC
      `;
      setConsultas(consultasRes || []);

      // Buscar Planos Alimentares salvos (DESC para histórico)
      try {
        const planosRes = await sql`
          SELECT * FROM planos_alimentares WHERE paciente_id = ${id} ORDER BY created_at DESC
        `;
        setPlanos(planosRes || []);
      } catch (errPlanos) {
        console.warn('Tabela planos_alimentares:', errPlanos);
        setPlanos([]);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do paciente:', err);
      setError('Erro ao carregar os dados do paciente em tempo real.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPacienteDetails();
    }
  }, [id, fetchPacienteDetails]);

  // Cálculo da idade
  const idade = useMemo(() => {
    const birthDate = formData.data_nascimento || paciente?.data_nascimento;
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [formData.data_nascimento, paciente]);

  // Toggle de Chips
  const toggleChip = (field, item) => {
    setFormData(prev => {
      const currentList = prev[field] || [];
      if (item === 'Nenhum') {
        return {
          ...prev,
          [field]: currentList.includes('Nenhum') ? [] : ['Nenhum']
        };
      }
      let newList = currentList.filter(i => i !== 'Nenhum');
      if (newList.includes(item)) {
        newList = newList.filter(i => i !== item);
      } else {
        newList.push(item);
      }
      return {
        ...prev,
        [field]: newList
      };
    });
  };

  const addCustomChip = (field, value, clearFn) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setFormData(prev => {
      const currentList = prev[field] || [];
      let newList = currentList.filter(i => i !== 'Nenhum');
      if (!newList.includes(trimmed)) {
        newList = [...newList, trimmed];
      }
      return {
        ...prev,
        [field]: newList
      };
    });
    clearFn('');
  };

  // Salvar Alterações dos Dados do Paciente (Seção 1)
  const handleSavePatient = async (e) => {
    e.preventDefault();
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    if (!formData.nome.trim()) {
      setSaveErrorMsg('O nome do paciente é obrigatório.');
      setActiveSubTab('pessoal');
      return;
    }

    setSavingPatient(true);

    try {
      const pesoVal = formData.peso_inicial ? parseFloat(formData.peso_inicial) : null;
      let alturaVal = formData.altura ? parseFloat(formData.altura) : null;
      if (alturaVal && alturaVal > 3) {
        alturaVal = parseFloat((alturaVal / 100).toFixed(2));
      }
      const litrosVal = formData.litros_agua ? parseFloat(formData.litros_agua) : null;
      const refeicoesVal = formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia, 10) : null;

      await sql`
        UPDATE pacientes SET
          nome = ${formData.nome.trim()},
          data_nascimento = ${formData.data_nascimento || null},
          sexo = ${formData.sexo || null},
          whatsapp = ${formData.whatsapp || null},
          email = ${formData.email.trim() || null},
          peso_inicial = ${pesoVal},
          altura = ${alturaVal},
          objetivos = ${formData.objetivos.length > 0 ? formData.objetivos : null},
          objetivo_texto = ${formData.objetivo_texto.trim() || null},
          nivel_atividade = ${formData.nivel_atividade || null},
          patologias = ${formData.patologias.length > 0 ? formData.patologias : null},
          restricoes_alimentares = ${formData.restricoes_alimentares.length > 0 ? formData.restricoes_alimentares : null},
          alergias = ${formData.alergias.length > 0 ? formData.alergias : null},
          medicamentos = ${formData.medicamentos.trim() || null},
          suplementos = ${formData.suplementos.trim() || null},
          refeicoes_por_dia = ${refeicoesVal},
          horario_acorda = ${formData.horario_acorda.trim() || null},
          horario_dorme = ${formData.horario_dorme.trim() || null},
          litros_agua = ${litrosVal},
          atividade_fisica = ${formData.atividade_fisica},
          atividade_fisica_descricao = ${formData.atividade_fisica ? formData.atividade_fisica_descricao.trim() : null},
          observacoes = ${formData.observacoes.trim() || null}
        WHERE id = ${id}
      `;

      // Atualizar o paciente no estado local
      setPaciente(prev => ({
        ...prev,
        nome: formData.nome.trim(),
        data_nascimento: formData.data_nascimento,
        sexo: formData.sexo,
        whatsapp: formData.whatsapp,
        email: formData.email.trim(),
        peso_inicial: pesoVal,
        altura: alturaVal,
        objetivos: formData.objetivos,
        objetivo_texto: formData.objetivo_texto.trim(),
        nivel_atividade: formData.nivel_atividade,
        patologias: formData.patologias,
        restricoes_alimentares: formData.restricoes_alimentares,
        alergias: formData.alergias,
        medicamentos: formData.medicamentos.trim(),
        suplementos: formData.suplementos.trim(),
        refeicoes_por_dia: refeicoesVal,
        horario_acorda: formData.horario_acorda.trim(),
        horario_dorme: formData.horario_dorme.trim(),
        litros_agua: litrosVal,
        atividade_fisica: formData.atividade_fisica,
        atividade_fisica_descricao: formData.atividade_fisica_descricao.trim(),
        observacoes: formData.observacoes.trim()
      }));

      setSaveSuccessMsg('Alterações salvas com sucesso!');
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 4000);
    } catch (err) {
      console.error('Erro ao salvar alterações do paciente:', err);
      setSaveErrorMsg('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setSavingPatient(false);
    }
  };

  // Salvar Nova Consulta (Seção 2)
  const handleSaveConsulta = async (e) => {
    e.preventDefault();
    setConsultaModalError(null);
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

      setIsConsultaModalOpen(false);
      setFormConsulta({
        data_consulta: new Date().toISOString().split('T')[0],
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      });

      // Recarregar dados automaticamente em tempo real
      await fetchPacienteDetails();
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
      setConsultaModalError('Não foi possível salvar a consulta. Verifique os campos e tente novamente.');
    } finally {
      setSavingConsulta(false);
    }
  };

  // Excluir Paciente
  const handleDeletePatient = async () => {
    if (!paciente) return;
    const confirmNome = window.prompt(`Para confirmar a exclusão deste paciente e de todo o seu histórico (consultas e planos), digite o nome do paciente "${paciente.nome}":`);
    if (confirmNome !== paciente.nome) {
      if (confirmNome !== null) {
        alert('Nome incorreto. A exclusão foi cancelada por segurança.');
      }
      return;
    }

    try {
      setLoading(true);
      // 1. Excluir planos alimentares e consultas vinculadas
      await sql`DELETE FROM planos_alimentares WHERE paciente_id = ${id}`;
      await sql`DELETE FROM consultas WHERE paciente_id = ${id}`;
      // 2. Excluir paciente
      await sql`DELETE FROM pacientes WHERE id = ${id}`;
      
      alert(`Paciente ${paciente.nome} excluído com sucesso.`);
      navigate('/pacientes');
    } catch (err) {
      console.error('Erro ao excluir paciente:', err);
      setError('Erro ao excluir o paciente. Verifique sua conexão e tente novamente.');
      setLoading(false);
    }
  };

  // Excluir Consulta individual do histórico
  const handleDeleteConsulta = async (consultaId, dataConsulta) => {
    if (!window.confirm(`Tem certeza que deseja excluir o registro de consulta de ${formatDate(dataConsulta)}?`)) {
      return;
    }

    try {
      await sql`DELETE FROM consultas WHERE id = ${consultaId}`;
      setConsultas(prev => prev.filter(c => c.id !== consultaId));
      setSaveSuccessMsg('Consulta excluída com sucesso.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao excluir consulta:', err);
      setSaveErrorMsg('Não foi possível excluir esta consulta.');
      setTimeout(() => setSaveErrorMsg(null), 4000);
    }
  };

  // Dados cronológicos para o gráfico de evolução de peso
  const timelineData = useMemo(() => {
    if (!paciente) return [];
    const points = [];

    // Ponto 0: Peso inicial no cadastro
    if (paciente.peso_inicial) {
      points.push({
        data: paciente.created_at ? toISODateString(paciente.created_at) : 'Início',
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
        data: c.data_consulta ? toISODateString(c.data_consulta) : '',
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

  // Estatísticas de evolução de peso e IMC
  const statsEvolucao = useMemo(() => {
    if (!paciente) return null;

    const pesoInicial = paciente.peso_inicial ? parseFloat(paciente.peso_inicial) : null;
    const ultimasComPeso = consultas.filter(c => c.peso !== null && c.peso !== undefined);
    const pesoAtual = ultimasComPeso.length > 0 
      ? parseFloat(ultimasComPeso[ultimasComPeso.length - 1].peso) 
      : pesoInicial;

    let diferencaPeso = null;
    let percentualPeso = null;
    if (pesoInicial && pesoAtual) {
      diferencaPeso = (pesoAtual - pesoInicial).toFixed(1);
      percentualPeso = (((pesoAtual - pesoInicial) / pesoInicial) * 100).toFixed(1);
    }

    const alturaMetros = paciente.altura ? (paciente.altura > 3 ? paciente.altura / 100 : paciente.altura) : null;
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
      imcAtual,
      imcClassificacao,
      imcCor,
      totalConsultas: consultas.length
    };
  }, [paciente, consultas]);

  // Renderizador do Gráfico SVG de Evolução de Peso
  const renderChart = () => {
    // Se não houver consultas ainda
    if (consultas.length === 0) {
      return (
        <div className="chart-empty-state">
          <LineChart size={36} color="#94a3b8" />
          <p className="chart-empty-title">Nenhuma consulta registrada ainda</p>
          <p className="chart-empty-subtitle">
            O gráfico de evolução de peso será preenchido automaticamente assim que a primeira consulta for registrada.
          </p>
        </div>
      );
    }

    const validPoints = timelineData.filter(p => viewMetric === 'peso' ? p.peso !== null : p.gordura !== null);

    if (validPoints.length < 1) {
      return (
        <div className="chart-empty-state">
          <LineChart size={36} color="#94a3b8" />
          <p className="chart-empty-title">Nenhum dado de {viewMetric === 'peso' ? 'peso' : '% gordura'} registrado</p>
          <p className="chart-empty-subtitle">
            Preencha o campo correspondente nas consultas para gerar a curva do gráfico.
          </p>
        </div>
      );
    }

    const values = validPoints.map(p => viewMetric === 'peso' ? p.peso : p.gordura);
    const minVal = Math.min(...values) - 1.5;
    const maxVal = Math.max(...values) + 1.5;
    const range = maxVal - minVal || 1;

    const width = 680;
    const height = 240;
    const paddingX = 45;
    const paddingY = 30;

    const getX = (index) => {
      if (validPoints.length === 1) return width / 2;
      return paddingX + (index / (validPoints.length - 1)) * (width - paddingX * 2);
    };
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

    const areaD = coordinates.length > 1 
      ? `${pathD} L ${coordinates[coordinates.length - 1].x} ${height - paddingY} L ${coordinates[0].x} ${height - paddingY} Z`
      : '';

    return (
      <div className="evolution-chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="evolution-svg">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00b4d8" stopOpacity="0.35" />
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
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* Linha de evolução */}
          {coordinates.length > 1 && (
            <path d={pathD} fill="none" stroke="#00b4d8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Pontos de dados estáticos (sem animação saltando) */}
          {coordinates.map((c, i) => (
            <g key={i} className="chart-dot-group">
              <circle cx={c.x} cy={c.y} r="5.5" fill="#ffffff" stroke="#0077b6" strokeWidth="3" />
              <circle cx={c.x} cy={c.y} r="8.5" fill="#00b4d8" opacity="0.2" />
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
        {/* Barra superior de navegação */}
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
                className="btn-nova-consulta"
                onClick={() => setIsConsultaModalOpen(true)}
              >
                <Plus size={16} />
                <span>Nova Consulta</span>
              </button>

              <button 
                type="button"
                className="btn-delete-patient-profile"
                onClick={handleDeletePatient}
                title="Excluir paciente e todos os registros"
              >
                <Trash2 size={16} />
                <span>Excluir Paciente</span>
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
                      <Mail size={14} /> Sem email
                    </span>
                  )}
                  {paciente.whatsapp ? (
                    <span className="profile-tag">
                      <Phone size={14} /> {paciente.whatsapp}
                    </span>
                  ) : (
                    <span className="profile-tag" style={{ opacity: 0.7 }}>
                      <Phone size={14} /> Sem telefone
                    </span>
                  )}
                  {paciente.sexo && (
                    <span className="profile-tag" style={{ textTransform: 'capitalize' }}>
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

            {/* NAVEGAÇÃO PRINCIPAL EM 3 SEÇÕES */}
            <div className="main-profile-nav">
              <button
                type="button"
                className={`main-nav-tab-btn ${activeMainSection === 'dados' ? 'active' : ''}`}
                onClick={() => setActiveMainSection('dados')}
              >
                <User size={18} />
                <span>Dados do Paciente</span>
              </button>

              <button
                type="button"
                className={`main-nav-tab-btn ${activeMainSection === 'consultas' ? 'active' : ''}`}
                onClick={() => setActiveMainSection('consultas')}
              >
                <Calendar size={18} />
                <span>Consultas</span>
                <span className="main-nav-badge">{consultas.length}</span>
              </button>

              <button
                type="button"
                className={`main-nav-tab-btn ${activeMainSection === 'planos' ? 'active' : ''}`}
                onClick={() => setActiveMainSection('planos')}
              >
                <Utensils size={18} />
                <span>Planos Alimentares</span>
                <span className="main-nav-badge">{planos.length}</span>
              </button>
            </div>

            {/* SEÇÃO 1 — DADOS DO PACIENTE (EDITÁVEIS DIRETAMENTE) */}
            {activeMainSection === 'dados' && (
              <div className="patient-form-card">
                
                {/* Banner de Metas Energéticas & Macros */}
                {metasNutricionais && (
                  <div className="patient-macros-banner">
                    <div className="patient-macros-summary-group">
                      <div className="macro-pill-metric">
                        <span className="metric-label">Meta Calórica (VET)</span>
                        <span className="metric-val" style={{ color: '#0077b6' }}>
                          <Zap size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                          {metasNutricionais.vet} kcal
                        </span>
                      </div>

                      <div className="macro-pill-metric">
                        <span className="metric-label">TMB / GET</span>
                        <span className="metric-val" style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {metasNutricionais.tmb} / {metasNutricionais.get} kcal
                        </span>
                      </div>

                      <div className="macro-pill-metric">
                        <span className="metric-label">🍗 Proteína</span>
                        <span className="metric-val" style={{ fontSize: '0.95rem', color: '#0284c7' }}>
                          {metasNutricionais.macros.proteina.gramas}g ({metasNutricionais.macros.proteina.percentual}%)
                        </span>
                      </div>

                      <div className="macro-pill-metric">
                        <span className="metric-label">🥑 Gorduras</span>
                        <span className="metric-val" style={{ fontSize: '0.95rem', color: '#ea580c' }}>
                          {metasNutricionais.macros.gordura.gramas}g ({metasNutricionais.macros.gordura.percentual}%)
                        </span>
                      </div>

                      <div className="macro-pill-metric">
                        <span className="metric-label">🍚 Carboidratos</span>
                        <span className="metric-val" style={{ fontSize: '0.95rem', color: '#10b981' }}>
                          {metasNutricionais.macros.carboidrato.gramas}g ({metasNutricionais.macros.carboidrato.percentual}%)
                        </span>
                      </div>

                      <div className="macro-pill-metric">
                        <span className="metric-label">💧 Meta Água</span>
                        <span className="metric-val" style={{ fontSize: '0.95rem', color: '#0369a1' }}>
                          {metasNutricionais.aguaLitros} L
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-open-calc"
                      onClick={() => setIsCalcModalOpen(true)}
                      title="Abrir calculadora nutricional de TMB e Macronutrientes"
                    >
                      <Zap size={16} color="#0077b6" />
                      <span>Ajustar Macros & TMB</span>
                    </button>
                  </div>
                )}

                {/* Mensagens de Feedback */}
                {saveSuccessMsg && (
                  <div className="feedback-success-banner">
                    <CheckCircle2 size={20} color="#10b981" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {saveErrorMsg && (
                  <div className="dashboard-alert-error" style={{ marginBottom: '1.25rem' }}>
                    <AlertCircle size={20} />
                    <span>{saveErrorMsg}</span>
                  </div>
                )}

                {/* Sub-abas: Pessoal, Clínico, Hábitos */}
                <div className="edit-subtabs-bar">
                  <button
                    type="button"
                    className={`edit-subtab-btn ${activeSubTab === 'pessoal' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('pessoal')}
                  >
                    <User size={16} />
                    <span>Pessoal</span>
                  </button>

                  <button
                    type="button"
                    className={`edit-subtab-btn ${activeSubTab === 'clinico' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('clinico')}
                  >
                    <Activity size={16} />
                    <span>Clínico</span>
                  </button>

                  <button
                    type="button"
                    className={`edit-subtab-btn ${activeSubTab === 'habitos' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('habitos')}
                  >
                    <HeartPulse size={16} />
                    <span>Hábitos</span>
                  </button>
                </div>

                <form onSubmit={handleSavePatient}>
                  {/* ABA PESSOAL */}
                  {activeSubTab === 'pessoal' && (
                    <div className="form-grid-2">
                      <div className="form-group span-2">
                        <label className="form-label" htmlFor="edit_nome">
                          Nome Completo <span className="required-star">*</span>
                        </label>
                        <input
                          type="text"
                          id="edit_nome"
                          className="form-input"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="edit_nascimento">Data de Nascimento</label>
                        <input
                          type="date"
                          id="edit_nascimento"
                          className="form-input"
                          value={formData.data_nascimento}
                          onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="edit_sexo">Sexo</label>
                        <select
                          id="edit_sexo"
                          className="form-select"
                          value={formData.sexo}
                          onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                        >
                          <option value="">Selecione...</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="edit_whatsapp">WhatsApp / Telefone</label>
                        <input
                          type="text"
                          id="edit_whatsapp"
                          className="form-input"
                          placeholder="(00) 00000-0000"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="edit_email">E-mail</label>
                        <input
                          type="email"
                          id="edit_email"
                          className="form-input"
                          placeholder="paciente@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* ABA CLÍNICO */}
                  {activeSubTab === 'clinico' && (
                    <div>
                      <div className="form-grid-3" style={{ marginBottom: '1.5rem' }}>
                        <div className="form-group">
                          <label className="form-label" htmlFor="edit_peso_inicial">Peso Inicial</label>
                          <div className="input-with-suffix">
                            <input
                              type="number"
                              step="0.1"
                              id="edit_peso_inicial"
                              className="form-input"
                              placeholder="Ex: 70.5"
                              value={formData.peso_inicial}
                              onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
                            />
                            <span className="input-suffix">kg</span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="edit_altura">Altura</label>
                          <div className="input-with-suffix">
                            <input
                              type="number"
                              step="1"
                              id="edit_altura"
                              className="form-input"
                              placeholder="Ex: 175"
                              value={formData.altura}
                              onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                            />
                            <span className="input-suffix">cm</span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="edit_nivel_atividade">Nível de Atividade</label>
                          <select
                            id="edit_nivel_atividade"
                            className="form-select"
                            value={formData.nivel_atividade}
                            onChange={(e) => setFormData({ ...formData, nivel_atividade: e.target.value })}
                          >
                            <option value="">Selecione...</option>
                            {ATIVIDADE_OPCOES.map((op, i) => (
                              <option key={i} value={op}>{op}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Objetivos */}
                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Objetivos Principais</label>
                        <div className="chips-container">
                          {OBJETIVOS_OPCOES.map((obj, i) => (
                            <button
                              key={i}
                              type="button"
                              className={`chip-btn ${formData.objetivos.includes(obj) ? 'selected' : ''}`}
                              onClick={() => toggleChip('objetivos', obj)}
                            >
                              {formData.objetivos.includes(obj) && <Check size={14} />}
                              <span>{obj}</span>
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          style={{ marginTop: '0.75rem' }}
                          placeholder="Objetivo específico ou detalhes adicionais..."
                          value={formData.objetivo_texto}
                          onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
                        />
                      </div>

                      {/* Patologias */}
                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Condições Clínicas / Patologias</label>
                        <div className="chips-container">
                          {PATOLOGIAS_OPCOES.map((pat, i) => (
                            <button
                              key={i}
                              type="button"
                              className={`chip-btn ${formData.patologias.includes(pat) ? (pat === 'Nenhum' ? 'none-chip selected' : 'selected') : ''}`}
                              onClick={() => toggleChip('patologias', pat)}
                            >
                              {formData.patologias.includes(pat) && <Check size={14} />}
                              <span>{pat}</span>
                            </button>
                          ))}
                          {formData.patologias.filter(p => !PATOLOGIAS_OPCOES.includes(p)).map((custom, i) => (
                            <button
                              key={`cust-pat-${i}`}
                              type="button"
                              className="chip-btn selected"
                              onClick={() => toggleChip('patologias', custom)}
                            >
                              <Check size={14} />
                              <span>{custom}</span>
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Outra patologia..."
                            value={customPatologia}
                            onChange={(e) => setCustomPatologia(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomChip('patologias', customPatologia, setCustomPatologia);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn-add-mini"
                            onClick={() => addCustomChip('patologias', customPatologia, setCustomPatologia)}
                          >
                            <Plus size={16} /> Adicionar
                          </button>
                        </div>
                      </div>

                      {/* Restrições Alimentares */}
                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Restrições Alimentares</label>
                        <div className="chips-container">
                          {RESTRICOES_OPCOES.map((res, i) => (
                            <button
                              key={i}
                              type="button"
                              className={`chip-btn ${formData.restricoes_alimentares.includes(res) ? (res === 'Nenhum' ? 'none-chip selected' : 'selected') : ''}`}
                              onClick={() => toggleChip('restricoes_alimentares', res)}
                            >
                              {formData.restricoes_alimentares.includes(res) && <Check size={14} />}
                              <span>{res}</span>
                            </button>
                          ))}
                          {formData.restricoes_alimentares.filter(r => !RESTRICOES_OPCOES.includes(r)).map((custom, i) => (
                            <button
                              key={`cust-res-${i}`}
                              type="button"
                              className="chip-btn selected"
                              onClick={() => toggleChip('restricoes_alimentares', custom)}
                            >
                              <Check size={14} />
                              <span>{custom}</span>
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Outra restrição..."
                            value={customRestricao}
                            onChange={(e) => setCustomRestricao(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomChip('restricoes_alimentares', customRestricao, setCustomRestricao);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn-add-mini"
                            onClick={() => addCustomChip('restricoes_alimentares', customRestricao, setCustomRestricao)}
                          >
                            <Plus size={16} /> Adicionar
                          </button>
                        </div>
                      </div>

                      {/* Alergias */}
                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Alergias Alimentares</label>
                        <div className="chips-container">
                          {ALERGIAS_OPCOES.map((ale, i) => (
                            <button
                              key={i}
                              type="button"
                              className={`chip-btn ${formData.alergias.includes(ale) ? (ale === 'Nenhum' ? 'none-chip selected' : 'selected') : ''}`}
                              onClick={() => toggleChip('alergias', ale)}
                            >
                              {formData.alergias.includes(ale) && <Check size={14} />}
                              <span>{ale}</span>
                            </button>
                          ))}
                          {formData.alergias.filter(a => !ALERGIAS_OPCOES.includes(a)).map((custom, i) => (
                            <button
                              key={`cust-ale-${i}`}
                              type="button"
                              className="chip-btn selected"
                              onClick={() => toggleChip('alergias', custom)}
                            >
                              <Check size={14} />
                              <span>{custom}</span>
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Outra alergia..."
                            value={customAlergia}
                            onChange={(e) => setCustomAlergia(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomChip('alergias', customAlergia, setCustomAlergia);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn-add-mini"
                            onClick={() => addCustomChip('alergias', customAlergia, setCustomAlergia)}
                          >
                            <Plus size={16} /> Adicionar
                          </button>
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label" htmlFor="edit_medicamentos">Medicamentos em Uso</label>
                          <input
                            type="text"
                            id="edit_medicamentos"
                            className="form-input"
                            placeholder="Ex: Losartana 50mg, Levotiroxina..."
                            value={formData.medicamentos}
                            onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="edit_suplementos">Suplementos</label>
                          <input
                            type="text"
                            id="edit_suplementos"
                            className="form-input"
                            placeholder="Ex: Whey protein, Creatina, Vitamina D..."
                            value={formData.suplementos}
                            onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ABA HÁBITOS */}
                  {activeSubTab === 'habitos' && (
                    <div>
                      <div className="form-grid-2" style={{ marginBottom: '1.5rem' }}>
                        <div className="form-group">
                          <label className="form-label" htmlFor="edit_refeicoes">Refeições por Dia</label>
                          <input
                            type="number"
                            id="edit_refeicoes"
                            className="form-input"
                            placeholder="Ex: 4"
                            value={formData.refeicoes_por_dia}
                            onChange={(e) => setFormData({ ...formData, refeicoes_por_dia: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="edit_agua">Consumo de Água (Litros/dia)</label>
                          <div className="input-with-suffix">
                            <input
                              type="number"
                              step="0.1"
                              id="edit_agua"
                              className="form-input"
                              placeholder="Ex: 2.5"
                              value={formData.litros_agua}
                              onChange={(e) => setFormData({ ...formData, litros_agua: e.target.value })}
                            />
                            <span className="input-suffix">L</span>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="edit_horario_acorda">Horário que Acorda</label>
                          <input
                            type="text"
                            id="edit_horario_acorda"
                            className="form-input"
                            placeholder="Ex: 06:30"
                            value={formData.horario_acorda}
                            onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="edit_horario_dorme">Horário que Dorme</label>
                          <input
                            type="text"
                            id="edit_horario_dorme"
                            className="form-input"
                            placeholder="Ex: 22:30"
                            value={formData.horario_dorme}
                            onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Pratica Atividade Física?</label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="edit_atividade_fisica"
                              checked={formData.atividade_fisica === true}
                              onChange={() => setFormData({ ...formData, atividade_fisica: true })}
                            />
                            <span>Sim</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="edit_atividade_fisica"
                              checked={formData.atividade_fisica === false}
                              onChange={() => setFormData({ ...formData, atividade_fisica: false })}
                            />
                            <span>Não</span>
                          </label>
                        </div>
                        {formData.atividade_fisica && (
                          <input
                            type="text"
                            className="form-input"
                            style={{ marginTop: '0.75rem' }}
                            placeholder="Frequência e tipo de exercício (ex: Musculação 4x/semana)..."
                            value={formData.atividade_fisica_descricao}
                            onChange={(e) => setFormData({ ...formData, atividade_fisica_descricao: e.target.value })}
                          />
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="edit_observacoes">Observações Gerais</label>
                        <textarea
                          id="edit_observacoes"
                          className="form-textarea"
                          rows={4}
                          placeholder="Histórico alimentar, preferências, rotina familiar ou observações relevantes..."
                          value={formData.observacoes}
                          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* BARRA DE BOTÃO SALVAR ALTERAÇÕES */}
                  <div className="save-actions-bar">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      As alterações são salvas diretamente no banco de dados Neon.
                    </span>
                    <button
                      type="submit"
                      className="btn-save-patient"
                      disabled={savingPatient}
                    >
                      <Save size={18} />
                      <span>{savingPatient ? 'Salvando alterações...' : 'Salvar alterações'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SEÇÃO 2 — CONSULTAS (GRÁFICO + HISTÓRICO + NOVA CONSULTA) */}
            {activeMainSection === 'consultas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* PAINEL DE EVOLUÇÃO E GRÁFICO */}
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
                        {statsEvolucao?.pesoInicial ? `${statsEvolucao.pesoInicial} kg` : 'Não informado'}
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

                  {/* Renderização do Gráfico SVG Estático */}
                  {renderChart()}
                </div>

                {/* LISTAGEM DE CONSULTAS */}
                <div className="stat-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h4 className="section-title" style={{ marginBottom: 0 }}>
                      <Calendar size={18} color="#0077b6" /> Histórico de Consultas ({consultas.length})
                    </h4>
                    <button 
                      type="button" 
                      className="btn-nova-consulta"
                      style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem' }}
                      onClick={() => setIsConsultaModalOpen(true)}
                    >
                      <Plus size={16} />
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
                        Clique no botão "Nova Consulta" para adicionar a primeira avaliação física e clínica do paciente.
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {c.proximo_retorno && (
                                <span className="retorno-badge">
                                  Próximo Retorno: {formatDate(c.proximo_retorno)}
                                </span>
                              )}
                              <button
                                type="button"
                                className="btn-delete-item-inline"
                                onClick={() => handleDeleteConsulta(c.id, c.data_consulta)}
                                title="Excluir este registro de consulta"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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
              </div>
            )}

            {/* SEÇÃO 3 — PLANOS ALIMENTARES */}
            {activeMainSection === 'planos' && (
              <div className="stat-card">
                <div className="planos-top-header">
                  <div>
                    <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>
                      <Utensils size={20} color="#00b4d8" /> Planos Alimentares
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Gere e consulte o histórico de planos alimentares personalizados para este paciente.
                    </p>
                  </div>

                  <div className="planos-actions-header">
                    <button
                      type="button"
                      className="btn-open-calc"
                      onClick={() => setIsCalcModalOpen(true)}
                      title="Calcular ou ajustar a meta calórica e distribuição de macronutrientes"
                    >
                      <Zap size={16} color="#0077b6" />
                      <span>Calculadora TMB & Macros</span>
                    </button>

                    <button
                      type="button"
                      className="btn-plano-manual"
                      onClick={handleCriarPlanoManual}
                      disabled={gerandoPlanoIA}
                      title="Criar um plano semanal em branco preenchido manualmente"
                    >
                      <Plus size={16} />
                      <span>Criar Plano Manual</span>
                    </button>

                    <button
                      type="button"
                      className="btn-gerar-plano-ia"
                      onClick={handleGerarPlanoComIA}
                      disabled={gerandoPlanoIA}
                    >
                      {gerandoPlanoIA ? (
                        <>
                          <Loader2 size={18} className="ia-loading-spinner" />
                          <span>IA Calculando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          <span>✨ Gerar Plano com IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Banner de Feedback / Toast */}
                {planoToast && (
                  <div className={`plano-toast-banner ${planoToast.type}`}>
                    <div className="plano-toast-content">
                      {planoToast.type === 'success' ? (
                        <CheckCircle2 size={20} color="#10b981" />
                      ) : (
                        <AlertTriangle size={20} color="#ef4444" />
                      )}
                      <span>{planoToast.message}</span>
                    </div>

                    {planoToast.type === 'error' && (
                      <div className="plano-toast-actions">
                        {planoToast.canRetry && (
                          <button
                            type="button"
                            className="btn-toast-action btn-toast-retry"
                            onClick={handleGerarPlanoComIA}
                          >
                            <RotateCcw size={14} />
                            <span>Tentar Novamente</span>
                          </button>
                        )}
                        {planoToast.canManual && (
                          <button
                            type="button"
                            className="btn-toast-action btn-toast-manual"
                            onClick={handleCriarPlanoManual}
                          >
                            <Plus size={14} />
                            <span>Criar Plano Manual</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Loading Visual Dinâmico com IA */}
                {gerandoPlanoIA && (
                  <div className="ia-loading-card">
                    <div className="ia-loading-icon-wrapper">
                      <Sparkles size={32} />
                    </div>
                    <h4 className="ia-loading-title">Inteligência Artificial em Ação</h4>
                    <p className="ia-loading-message">
                      {LOADING_MESSAGES[loadingMensagemIndex]}
                    </p>
                    <div className="ia-loading-progress-bar">
                      <div className="ia-loading-progress-fill" />
                    </div>
                  </div>
                )}

                {/* EDITOR INTERATIVO EM ABAS SEMANAIS */}
                {planoAtivo && planoAtivo.plano_semanal && (
                  <div className="plano-editor-card">
                    <div className="plano-editor-topbar">
                      <div className="plano-editor-title-box">
                        <h4>
                          <Sparkles size={18} color="#00b4d8" /> 
                          {planoAtivo.origem === 'gemini_ia' ? 'Plano Semanal Gerado por IA' : 'Editor de Plano Semanal'}
                        </h4>
                        <p>
                          Altere qualquer uma das 5 opções de cada refeição abaixo e clique em salvar para registrar no histórico.
                        </p>
                      </div>

                      <div className="plano-editor-controls">
                        <button
                          type="button"
                          className="btn-editor-secondary"
                          onClick={() => handleAbrirListaCompras(planoAtivo)}
                          title="Gerar lista de compras consolidada da semana em 1 clique"
                        >
                          <ShoppingCart size={15} color="#10b981" />
                          <span>Lista de Compras</span>
                        </button>

                        <button
                          type="button"
                          className="btn-whatsapp-share"
                          onClick={() => handleCompartilharWhatsApp(planoAtivo)}
                          title="Enviar cardápio semanal diretamente para o WhatsApp do paciente"
                        >
                          <MessageCircle size={15} />
                          <span>Enviar WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          className="btn-editor-secondary"
                          onClick={() => handleExportarPDF(planoAtivo, 'download')}
                          disabled={gerandoPdf}
                          title="Baixar arquivo PDF com Logo da Clínica"
                        >
                          {gerandoPdf ? <Loader2 size={15} className="ia-loading-spinner" /> : <FileDown size={15} color="#10b981" />}
                          <span>{gerandoPdf ? 'Gerando...' : 'Baixar PDF'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn-export-pdf"
                          onClick={() => handleExportarPDF(planoAtivo, 'imprimir')}
                          title="Imprimir ou Salvar como PDF com Logo da Clínica"
                        >
                          <Printer size={15} color="#0077b6" />
                          <span>Imprimir / PDF</span>
                        </button>

                        <button
                          type="button"
                          className="btn-editor-secondary"
                          onClick={() => handleGerarPlanoComIA()}
                          disabled={gerandoPlanoIA}
                          title="Regenerar cardápio com IA"
                        >
                          <RotateCcw size={15} />
                          <span>Regenerar com IA</span>
                        </button>

                        <button
                          type="button"
                          className="btn-editor-secondary"
                          onClick={() => setPlanoAtivo(null)}
                          title="Fechar editor"
                        >
                          <X size={15} />
                          <span>Fechar Editor</span>
                        </button>

                        <button
                          type="button"
                          className="btn-salvar-plano-primary"
                          onClick={handleSalvarPlanoAlimentar}
                          disabled={salvandoPlano}
                        >
                          <Save size={16} />
                          <span>{salvandoPlano ? 'Salvando...' : 'Salvar Plano Alimentar'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Abas dos 7 Dias da Semana */}
                    <div className="dias-semana-tabs-bar">
                      {planoAtivo.plano_semanal.map((diaItem, idx) => (
                        <button
                          key={diaItem.dia || idx}
                          type="button"
                          className={`dia-semana-tab-btn ${diaAtivoIndex === idx ? 'active' : ''}`}
                          onClick={() => setDiaAtivoIndex(idx)}
                        >
                          {diaItem.dia}
                        </button>
                      ))}
                    </div>

                    {/* 5 Refeições do Dia Ativo com 5 Inputs Editáveis Cada */}
                    {planoAtivo.plano_semanal[diaAtivoIndex] && (
                      <div className="refeicoes-editor-grid">
                        {REFEICOES_CONFIG.map((refeicao) => {
                          const IconComp = refeicao.icon;
                          const opcoes = planoAtivo.plano_semanal[diaAtivoIndex].refeicoes?.[refeicao.key] || ['', '', '', '', ''];

                          return (
                            <div key={refeicao.key} className="refeicao-editor-card">
                              <div className="refeicao-editor-header">
                                <div className="refeicao-header-title">
                                  <div 
                                    className="refeicao-icon-badge" 
                                    style={{ backgroundColor: refeicao.bg, color: refeicao.color }}
                                  >
                                    <IconComp size={18} />
                                  </div>
                                  <span className="refeicao-name">{refeicao.title}</span>
                                </div>
                                <span className="refeicao-counter-tag">5 Opções</span>
                              </div>

                              <div className="refeicao-opcoes-list">
                                {[0, 1, 2, 3, 4].map((optIdx) => (
                                  <div key={optIdx} className="refeicao-opcao-row">
                                    <div className="opcao-number-badge">
                                      {optIdx + 1}
                                    </div>
                                    <input
                                      type="text"
                                      className="refeicao-opcao-input"
                                      placeholder={`Ex: Opção ${optIdx + 1} de ${refeicao.title.toLowerCase()}...`}
                                      value={opcoes[optIdx] || ''}
                                      onChange={(e) => handleMealOptionChange(diaAtivoIndex, refeicao.key, optIdx, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Botão de Salvar no Rodapé do Editor */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                      <button
                        type="button"
                        className="btn-salvar-plano-primary"
                        style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}
                        onClick={handleSalvarPlanoAlimentar}
                        disabled={salvandoPlano}
                      >
                        <Save size={18} />
                        <span>{salvandoPlano ? 'Salvando Plano...' : 'Salvar Plano Alimentar'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* HISTÓRICO DE PLANOS ALIMENTARES */}
                <div style={{ marginTop: planoAtivo ? '2.5rem' : '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>
                      <FileText size={18} color="#0077b6" /> Histórico de Planos Salvos ({planos.length})
                    </h4>
                  </div>

                  {planos.length === 0 ? (
                    <div className="empty-state-container" style={{ padding: '3.5rem 1rem' }}>
                      <div className="empty-state-icon">
                        <Utensils size={42} color="#00b4d8" />
                      </div>
                      <h4 className="empty-state-title">Nenhum plano alimentar gerado ainda</h4>
                      <p className="empty-state-subtitle">
                        Clique no botão "✨ Gerar Plano com IA" acima para criar a primeira prescrição nutricional deste paciente.
                      </p>
                    </div>
                  ) : (
                    <div className="planos-grid">
                      {planos.map((plano, index) => {
                        const dataGen = plano.created_at ? formatDate(plano.created_at) : 'Data não registrada';
                        
                        let parsedConteudo = plano.conteudo;
                        if (typeof parsedConteudo === 'string') {
                          try {
                            parsedConteudo = JSON.parse(parsedConteudo);
                          } catch {
                            // string simples
                          }
                        }

                        let resumoTexto = '';
                        if (parsedConteudo && Array.isArray(parsedConteudo.plano_semanal)) {
                          const seg = parsedConteudo.plano_semanal[0];
                          if (seg && seg.refeicoes) {
                            const almoco = seg.refeicoes.almoco?.[0] || 'Refeições semanais estruturadas';
                            resumoTexto = `Segunda: ${almoco}`;
                          }
                        } else if (typeof parsedConteudo === 'object') {
                          resumoTexto = parsedConteudo.resumo || parsedConteudo.descricao || 'Plano nutricional completo';
                        } else {
                          resumoTexto = String(parsedConteudo);
                        }

                        return (
                          <div
                            key={plano.id || index}
                            className="plano-card"
                          >
                            <div className="plano-card-header">
                              <div>
                                <span className="retorno-badge" style={{ fontSize: '0.75rem' }}>
                                  Plano #{planos.length - index}
                                </span>
                                <h4 className="plano-title">Prescrição Nutricional</h4>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="plano-date">
                                  <Calendar size={13} /> {dataGen}
                                </span>
                                <button
                                  type="button"
                                  className="btn-delete-item-inline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePlano(plano.id);
                                  }}
                                  disabled={deletingPlanoId === plano.id}
                                  title="Excluir este plano alimentar do histórico"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <p className="plano-snippet">
                              {resumoTexto || 'Clique para visualizar as refeições e orientações deste plano.'}
                            </p>

                            <div className="plano-card-footer" style={{ justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <button
                                  type="button"
                                  style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'var(--primary-dark)', 
                                    fontSize: '0.82rem', 
                                    fontWeight: 600, 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                  onClick={() => handleCarregarPlanoNoEditor(plano)}
                                  title="Carregar este plano no editor para fazer alterações"
                                >
                                  <Edit3 size={14} />
                                  <span>Editar</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-export-pdf-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportarPDF(plano, 'download');
                                  }}
                                  title="Baixar arquivo PDF deste plano"
                                >
                                  <FileDown size={14} />
                                </button>
                              </div>

                              <button
                                type="button"
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: 'var(--primary-dark)', 
                                  fontSize: '0.85rem', 
                                  fontWeight: 700, 
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                                onClick={() => {
                                  setSelectedPlano(plano);
                                  setSelectedPlanoDiaIndex(0);
                                }}
                              >
                                <span>Ver Completo</span>
                                <Eye size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* MODAL DE VISUALIZAÇÃO COMPLETA DE PLANO ALIMENTAR SALVO */}
        {selectedPlano && (
          <div className="modal-overlay">
            <div className="modal-content plano-modal-custom">
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Utensils size={22} color="#00b4d8" />
                  <div>
                    <h3 className="modal-title">
                      Plano Alimentar Semanal — {formatDate(selectedPlano.created_at)}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Paciente: {paciente?.nome}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-editor-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={() => handleAbrirListaCompras(selectedPlano)}
                    title="Gerar lista de compras consolidada da semana em 1 clique"
                  >
                    <ShoppingCart size={14} color="#10b981" />
                    <span>Lista de Compras</span>
                  </button>

                  <button
                    type="button"
                    className="btn-whatsapp-share"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={() => handleCompartilharWhatsApp(selectedPlano)}
                    title="Enviar este plano via WhatsApp para o paciente"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    className="btn-editor-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={() => handleExportarPDF(selectedPlano, 'download')}
                    disabled={gerandoPdf}
                    title="Baixar arquivo PDF no dispositivo"
                  >
                    {gerandoPdf ? <Loader2 size={14} className="ia-loading-spinner" /> : <FileDown size={14} color="#10b981" />}
                    <span>{gerandoPdf ? 'Gerando...' : 'Baixar PDF'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-export-pdf"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={() => handleExportarPDF(selectedPlano, 'imprimir')}
                    title="Imprimir ou Salvar em PDF com Logo da Clínica"
                  >
                    <Printer size={14} color="#0077b6" />
                    <span>Imprimir</span>
                  </button>

                  <button
                    type="button"
                    className="btn-editor-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={() => handleCopiarPlanoTexto(selectedPlano)}
                    title="Copiar texto do plano para área de transferência"
                  >
                    {copiadoFeedback ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiadoFeedback ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <button 
                    type="button" 
                    className="modal-close-btn"
                    onClick={() => setSelectedPlano(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {(() => {
                  let parsed = selectedPlano.conteudo;
                  if (typeof parsed === 'string') {
                    try {
                      parsed = JSON.parse(parsed);
                    } catch {
                      // fallback
                    }
                  }

                  if (parsed && Array.isArray(parsed.plano_semanal)) {
                    const diaAtivoSalvo = parsed.plano_semanal[selectedPlanoDiaIndex] || parsed.plano_semanal[0];

                    return (
                      <div>
                        {/* Seletor de Dias no Modal */}
                        <div className="dias-semana-tabs-bar" style={{ marginBottom: '1.25rem' }}>
                          {parsed.plano_semanal.map((diaItem, idx) => (
                            <button
                              key={diaItem.dia || idx}
                              type="button"
                              className={`dia-semana-tab-btn ${selectedPlanoDiaIndex === idx ? 'active' : ''}`}
                              onClick={() => setSelectedPlanoDiaIndex(idx)}
                            >
                              {diaItem.dia}
                            </button>
                          ))}
                        </div>

                        {/* Lista das 5 Refeições do Dia */}
                        {diaAtivoSalvo && (
                          <div className="plano-saved-refeicoes-view">
                            {REFEICOES_CONFIG.map((refeicao) => {
                              const IconComp = refeicao.icon;
                              const opcoes = diaAtivoSalvo.refeicoes?.[refeicao.key] || [];

                              return (
                                <div key={refeicao.key} className="plano-saved-refeicao-block">
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                      <div 
                                        className="refeicao-icon-badge" 
                                        style={{ backgroundColor: refeicao.bg, color: refeicao.color }}
                                      >
                                        <IconComp size={18} />
                                      </div>
                                      <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                                        {refeicao.title}
                                      </strong>
                                    </div>
                                    <span className="refeicao-counter-tag">
                                      {opcoes.filter(Boolean).length} opções disponíveis
                                    </span>
                                  </div>

                                  <ul className="plano-saved-opcoes-list">
                                    {opcoes.map((opcao, optIdx) => (
                                      opcao && opcao.trim() ? (
                                        <li key={optIdx} className="plano-saved-opcao-item">
                                          <span className="plano-saved-opcao-bullet">
                                            {optIdx + 1}
                                          </span>
                                          <span>{opcao}</span>
                                        </li>
                                      ) : null
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Fallback se for formato texto puro
                  return (
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontFamily: 'inherit', 
                      fontSize: '0.9rem', 
                      lineHeight: '1.6', 
                      color: 'var(--text-main)',
                      backgroundColor: 'var(--bg-color)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {typeof selectedPlano.conteudo === 'string' 
                        ? selectedPlano.conteudo 
                        : JSON.stringify(selectedPlano.conteudo, null, 2)}
                    </pre>
                  );
                })()}
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <button
                  type="button"
                  className="btn-editor-secondary"
                  onClick={() => handleCarregarPlanoNoEditor(selectedPlano)}
                >
                  <Edit3 size={15} />
                  <span>Carregar no Editor</span>
                </button>

                <button 
                  type="button" 
                  className="btn-modal-cancel"
                  onClick={() => setSelectedPlano(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE REGISTRAR NOVA CONSULTA */}
        {isConsultaModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar size={22} color="#00b4d8" />
                  <h3 className="modal-title">Nova Consulta</h3>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn"
                  onClick={() => setIsConsultaModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {consultaModalError && (
                <div className="dashboard-alert-error" style={{ margin: '1rem 1.5rem 0 1.5rem' }}>
                  <AlertCircle size={18} />
                  <span>{consultaModalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveConsulta} className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="data_consulta">
                      Data da Consulta <span className="required-star">*</span>
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
                    <label className="form-label" htmlFor="proximo_retorno">Próximo Retorno</label>
                    <input 
                      type="date" 
                      id="proximo_retorno"
                      className="form-input" 
                      value={formConsulta.proximo_retorno}
                      onChange={(e) => setFormConsulta({ ...formConsulta, proximo_retorno: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="consulta_peso">Peso Atual</label>
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
                    <label className="form-label" htmlFor="consulta_cintura">Circunferência da Cintura</label>
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
                    <label className="form-label" htmlFor="consulta_quadril">Circunferência do Quadril</label>
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
                    <label className="form-label" htmlFor="consulta_observacoes">Observações</label>
                    <textarea 
                      id="consulta_observacoes"
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
                    onClick={() => setIsConsultaModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-modal-submit"
                    disabled={savingConsulta}
                  >
                    <Save size={16} />
                    <span>{savingConsulta ? 'Salvando...' : 'Salvar consulta'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* MODAL DE CALCULADORA NUTRICIONAL (TMB / GET / VET / MACROS) */}
        <CalculadoraNutricionalModal
          paciente={paciente}
          consultas={consultas}
          isOpen={isCalcModalOpen}
          onClose={() => setIsCalcModalOpen(false)}
          onSalvarMetas={handleSalvarMetas}
        />

        {/* MODAL DE LISTA DE COMPRAS AUTOMÁTICA DA SEMANA */}
        <ListaComprasModal
          plano={planoParaListaCompras || planoAtivo || (planos && planos.length > 0 ? planos[0] : null)}
          paciente={formData.nome ? formData : paciente}
          nutricionista={{ nome: user?.name || user?.nome || 'Nutricionista Responsável' }}
          isOpen={isListaComprasModalOpen}
          onClose={() => setIsListaComprasModalOpen(false)}
        />
      </div>
    </Layout>
  );
}

