import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Zap, 
  Flame, 
  Scale, 
  Activity, 
  Check, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  calcularIdade, 
  calcularTMB, 
  calcularGET, 
  calcularVET, 
  calcularMacronutrientes,
  FATORES_ATIVIDADE 
} from '../lib/calculosNutricionais';

export default function CalculadoraNutricionalModal({ 
  paciente, 
  consultas = [], 
  isOpen, 
  onClose, 
  onSalvarMetas 
}) {
  // Extrai dados mais recentes do paciente ou da última consulta
  const pesoAtual = useMemo(() => {
    if (consultas && consultas.length > 0) {
      const pesoConsulta = consultas[0].peso;
      if (pesoConsulta) return parseFloat(pesoConsulta);
    }
    return parseFloat(paciente?.peso_inicial) || 70;
  }, [paciente, consultas]);

  const percentualGorduraAtual = useMemo(() => {
    if (consultas && consultas.length > 0) {
      const gordura = consultas[0].percentual_gordura;
      if (gordura) return parseFloat(gordura);
    }
    return '';
  }, [consultas]);

  const idadeCalculada = useMemo(() => {
    return calcularIdade(paciente?.data_nascimento);
  }, [paciente]);

  // Estados locais da calculadora
  const [peso, setPeso] = useState(pesoAtual);
  const [altura, setAltura] = useState(paciente?.altura ? (paciente.altura < 3 ? paciente.altura * 100 : paciente.altura) : 170);
  const [idade, setIdade] = useState(idadeCalculada);
  const [sexo, setSexo] = useState(paciente?.sexo || 'Feminino');
  const [nivelAtividade, setNivelAtividade] = useState(paciente?.nivel_atividade || 'Moderadamente ativo');
  const [percentualGordura, setPercentualGordura] = useState(percentualGorduraAtual);

  const [formulaTMB, setFormulaTMB] = useState('mifflin');
  const [estrategiaVET, setEstrategiaVET] = useState('deficit_moderado');
  const [ajusteKcalCustom, setAjusteKcalCustom] = useState(2000);

  const [proteinaGKg, setProteinaGKg] = useState(2.0);
  const [gorduraPercentual, setGorduraPercentual] = useState(25);

  // Sincroniza se o paciente mudar
  useEffect(() => {
    setPeso(pesoAtual);
    if (paciente?.altura) setAltura(paciente.altura < 3 ? paciente.altura * 100 : paciente.altura);
    setIdade(idadeCalculada);
    if (paciente?.sexo) setSexo(paciente.sexo);
    if (paciente?.nivel_atividade) setNivelAtividade(paciente.nivel_atividade);
    if (percentualGorduraAtual) setPercentualGordura(percentualGorduraAtual);
  }, [paciente, pesoAtual, idadeCalculada, percentualGorduraAtual]);

  // Cálculos reativos em tempo real
  const tmbCalculada = useMemo(() => {
    return calcularTMB({
      peso,
      altura,
      idade,
      sexo,
      percentualGordura
    }, formulaTMB);
  }, [peso, altura, idade, sexo, percentualGordura, formulaTMB]);

  const getCalculado = useMemo(() => {
    return calcularGET(tmbCalculada, nivelAtividade);
  }, [tmbCalculada, nivelAtividade]);

  const vetCalculado = useMemo(() => {
    return calcularVET(getCalculado, estrategiaVET, ajusteKcalCustom);
  }, [getCalculado, estrategiaVET, ajusteKcalCustom]);

  const macrosCalculados = useMemo(() => {
    return calcularMacronutrientes({
      vet: vetCalculado,
      peso,
      proteinaGKg,
      gorduraPercentual
    });
  }, [vetCalculado, peso, proteinaGKg, gorduraPercentual]);

  const handleSalvar = () => {
    if (onSalvarMetas) {
      onSalvarMetas({
        tmb: tmbCalculada,
        get: getCalculado,
        vet: vetCalculado,
        formula: formulaTMB,
        estrategia: estrategiaVET,
        macros: macrosCalculados,
        aguaLitros: macrosCalculados.aguaLitros,
        dadosBase: { peso, altura, idade, sexo, nivelAtividade }
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content calc-modal-container">
        
        {/* CABEÇALHO */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="calc-modal-icon-badge">
              <Zap size={22} color="#00b4d8" />
            </div>
            <div>
              <h3 className="modal-title">Calculadora de Gasto Energético & Macros</h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Paciente: <strong>{paciente?.nome || 'Paciente'}</strong>
              </span>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="modal-body calc-modal-body">
          
          <div className="calc-grid-layout">
            
            {/* COLUNA ESQUERDA: PARÂMETROS E CONTROLES */}
            <div className="calc-controls-pane">
              
              {/* Seção 1: Dados Biométricos */}
              <div className="calc-section-box">
                <h4 className="calc-section-title">
                  <Scale size={16} color="#0077b6" /> 1. Parâmetros Antropométricos
                </h4>
                
                <div className="calc-form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Peso (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="form-input"
                      value={peso} 
                      onChange={(e) => setPeso(parseFloat(e.target.value) || 0)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Altura (cm)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={altura} 
                      onChange={(e) => setAltura(parseFloat(e.target.value) || 0)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Idade (anos)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={idade} 
                      onChange={(e) => setIdade(parseInt(e.target.value, 10) || 0)} 
                    />
                  </div>
                </div>

                <div className="calc-form-grid-3" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <select 
                      className="form-select"
                      value={sexo} 
                      onChange={(e) => setSexo(e.target.value)}
                    >
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Nível de Atividade Física (FA)</label>
                    <select 
                      className="form-select"
                      value={nivelAtividade} 
                      onChange={(e) => setNivelAtividade(e.target.value)}
                    >
                      {Object.keys(FATORES_ATIVIDADE).map((faKey) => (
                        <option key={faKey} value={faKey}>
                          {faKey} (×{FATORES_ATIVIDADE[faKey]})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Fórmula da TMB */}
              <div className="calc-section-box">
                <h4 className="calc-section-title">
                  <Flame size={16} color="#f59e0b" /> 2. Fórmula da Taxa Metabólica Basal (TMB)
                </h4>
                
                <div className="calc-pills-selector">
                  <button
                    type="button"
                    className={`calc-pill-btn ${formulaTMB === 'mifflin' ? 'active' : ''}`}
                    onClick={() => setFormulaTMB('mifflin')}
                  >
                    <span>Mifflin-St Jeor</span>
                    <span className="calc-pill-tag">Padrão Ouro</span>
                  </button>

                  <button
                    type="button"
                    className={`calc-pill-btn ${formulaTMB === 'harris' ? 'active' : ''}`}
                    onClick={() => setFormulaTMB('harris')}
                  >
                    <span>Harris-Benedict</span>
                    <span className="calc-pill-tag">Revisada</span>
                  </button>

                  <button
                    type="button"
                    className={`calc-pill-btn ${formulaTMB === 'katch' ? 'active' : ''}`}
                    onClick={() => setFormulaTMB('katch')}
                  >
                    <span>Katch-McArdle</span>
                    <span className="calc-pill-tag">Massa Magra</span>
                  </button>
                </div>

                {formulaTMB === 'katch' && (
                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label">% de Gordura Corporal (BF)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 18.5"
                      className="form-input"
                      value={percentualGordura}
                      onChange={(e) => setPercentualGordura(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Seção 3: Meta Calórica (VET) */}
              <div className="calc-section-box">
                <h4 className="calc-section-title">
                  <Activity size={16} color="#10b981" /> 3. Estratégia Calórica (Meta VET)
                </h4>

                <div className="calc-strategies-grid">
                  <button
                    type="button"
                    className={`calc-strategy-card ${estrategiaVET === 'deficit_moderado' ? 'active' : ''}`}
                    onClick={() => setEstrategiaVET('deficit_moderado')}
                  >
                    <div className="strategy-icon-box emagrecer">
                      <TrendingDown size={16} />
                    </div>
                    <div className="strategy-info">
                      <strong>Emagrecimento</strong>
                      <span>Déficit -500 kcal</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`calc-strategy-card ${estrategiaVET === 'manutencao' ? 'active' : ''}`}
                    onClick={() => setEstrategiaVET('manutencao')}
                  >
                    <div className="strategy-icon-box manter">
                      <Minus size={16} />
                    </div>
                    <div className="strategy-info">
                      <strong>Manutenção</strong>
                      <span>Consumo = GET</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`calc-strategy-card ${estrategiaVET === 'superavit_leve' ? 'active' : ''}`}
                    onClick={() => setEstrategiaVET('superavit_leve')}
                  >
                    <div className="strategy-icon-box hipertrofia">
                      <TrendingUp size={16} />
                    </div>
                    <div className="strategy-info">
                      <strong>Hipertrofia</strong>
                      <span>Superávit +300 kcal</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`calc-strategy-card ${estrategiaVET === 'personalizado' ? 'active' : ''}`}
                    onClick={() => setEstrategiaVET('personalizado')}
                  >
                    <div className="strategy-icon-box custom">
                      <Sparkles size={16} />
                    </div>
                    <div className="strategy-info">
                      <strong>Personalizado</strong>
                      <span>Definir kcal livre</span>
                    </div>
                  </button>
                </div>

                {estrategiaVET === 'personalizado' && (
                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label">Meta Calórica Diária (kcal)</label>
                    <input
                      type="number"
                      step="50"
                      className="form-input"
                      value={ajusteKcalCustom}
                      onChange={(e) => setAjusteKcalCustom(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>

              {/* Seção 4: Distribuição de Macronutrientes */}
              <div className="calc-section-box">
                <h4 className="calc-section-title">
                  <Sparkles size={16} color="#8b5cf6" /> 4. Distribuição de Macronutrientes
                </h4>

                {/* Proteína g/kg */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label className="form-label">🍗 Proteínas (g/kg)</label>
                    <span style={{ fontWeight: 700, color: '#0077b6' }}>{proteinaGKg} g/kg</span>
                  </div>
                  
                  <div className="calc-macro-presets">
                    {[1.2, 1.6, 1.8, 2.0, 2.2, 2.4].map((gVal) => (
                      <button
                        key={gVal}
                        type="button"
                        className={`macro-preset-btn ${proteinaGKg === gVal ? 'active' : ''}`}
                        onClick={() => setProteinaGKg(gVal)}
                      >
                        {gVal} g/kg
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gorduras % */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label className="form-label">🥑 Gorduras (% do VET)</label>
                    <span style={{ fontWeight: 700, color: '#ea580c' }}>{gorduraPercentual}%</span>
                  </div>

                  <div className="calc-macro-presets">
                    {[20, 25, 30, 35].map((gordVal) => (
                      <button
                        key={gordVal}
                        type="button"
                        className={`macro-preset-btn ${gorduraPercentual === gordVal ? 'active' : ''}`}
                        onClick={() => setGorduraPercentual(gordVal)}
                      >
                        {gordVal}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* COLUNA DIREITA: RESUMO VISUAL E RESULTADOS */}
            <div className="calc-results-pane">
              
              <div className="calc-summary-card">
                <h4 className="calc-results-title">⚡ Balanço Energético</h4>
                
                <div className="calc-kpi-grid">
                  <div className="calc-kpi-item">
                    <span className="calc-kpi-label">TMB (Basal)</span>
                    <span className="calc-kpi-val">{tmbCalculada}</span>
                    <span className="calc-kpi-unit">kcal/dia</span>
                  </div>

                  <div className="calc-kpi-item">
                    <span className="calc-kpi-label">GET (Gasto Total)</span>
                    <span className="calc-kpi-val">{getCalculado}</span>
                    <span className="calc-kpi-unit">kcal/dia</span>
                  </div>

                  <div className="calc-kpi-item highlight">
                    <span className="calc-kpi-label">Meta VET Planejada</span>
                    <span className="calc-kpi-val">{vetCalculado}</span>
                    <span className="calc-kpi-unit">kcal/dia</span>
                  </div>

                  <div className="calc-kpi-item">
                    <span className="calc-kpi-label">Meta de Água (35ml/kg)</span>
                    <span className="calc-kpi-val">{macrosCalculados.aguaLitros}</span>
                    <span className="calc-kpi-unit">Litros/dia</span>
                  </div>
                </div>

                {/* Barra Visual de Proporção de Macros */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Proporção dos Macronutrientes</span>
                    <span style={{ color: 'var(--text-muted)' }}>100% da Meta</span>
                  </div>

                  <div className="calc-macro-multi-bar">
                    <div 
                      className="calc-bar-segment proteina" 
                      style={{ width: `${macrosCalculados.proteina.percentual}%` }}
                      title={`Proteína: ${macrosCalculados.proteina.percentual}%`}
                    />
                    <div 
                      className="calc-bar-segment gordura" 
                      style={{ width: `${macrosCalculados.gordura.percentual}%` }}
                      title={`Gorduras: ${macrosCalculados.gordura.percentual}%`}
                    />
                    <div 
                      className="calc-bar-segment carboidrato" 
                      style={{ width: `${macrosCalculados.carboidrato.percentual}%` }}
                      title={`Carboidratos: ${macrosCalculados.carboidrato.percentual}%`}
                    />
                  </div>
                </div>

                {/* Cards Detalhados dos 3 Macros */}
                <div className="calc-macro-cards-list">
                  
                  {/* Proteínas */}
                  <div className="calc-macro-detail-card prot">
                    <div className="macro-detail-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="macro-dot prot"></span>
                        <strong>Proteínas</strong>
                      </div>
                      <span className="macro-badge prot">{macrosCalculados.proteina.gKg} g/kg</span>
                    </div>
                    <div className="macro-detail-values">
                      <div className="macro-big-grams">{macrosCalculados.proteina.gramas}g</div>
                      <div className="macro-sub-info">
                        <span>{macrosCalculados.proteina.kcal} kcal</span> • <span>{macrosCalculados.proteina.percentual}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Gorduras */}
                  <div className="calc-macro-detail-card gord">
                    <div className="macro-detail-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="macro-dot gord"></span>
                        <strong>Gorduras / Lipídios</strong>
                      </div>
                      <span className="macro-badge gord">{macrosCalculados.gordura.gKg} g/kg</span>
                    </div>
                    <div className="macro-detail-values">
                      <div className="macro-big-grams">{macrosCalculados.gordura.gramas}g</div>
                      <div className="macro-sub-info">
                        <span>{macrosCalculados.gordura.kcal} kcal</span> • <span>{macrosCalculados.gordura.percentual}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Carboidratos */}
                  <div className="calc-macro-detail-card carb">
                    <div className="macro-detail-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="macro-dot carb"></span>
                        <strong>Carboidratos</strong>
                      </div>
                      <span className="macro-badge carb">{macrosCalculados.carboidrato.gKg} g/kg</span>
                    </div>
                    <div className="macro-detail-values">
                      <div className="macro-big-grams">{macrosCalculados.carboidrato.gramas}g</div>
                      <div className="macro-sub-info">
                        <span>{macrosCalculados.carboidrato.kcal} kcal</span> • <span>{macrosCalculados.carboidrato.percentual}%</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="calc-tip-box">
                  <Info size={16} color="#0077b6" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    Ao salvar, estas metas calóricas e hídricas serão vinculadas ao perfil do paciente e enviadas para a IA gerar o cardápio personalizado.
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* RODAPÉ DE AÇÕES */}
        <div className="modal-footer calc-modal-footer">
          <button type="button" className="btn-calc-cancel" onClick={onClose}>
            Cancelar
          </button>
          
          <button type="button" className="btn-calc-confirm" onClick={handleSalvar}>
            <Check size={18} strokeWidth={2.5} />
            <span>Aplicar Metas ao Paciente</span>
          </button>
        </div>

      </div>
    </div>
  );
}
