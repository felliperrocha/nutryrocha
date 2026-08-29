import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Utilitário de Geração e Exportação de PDF para Planos Alimentares
 * Layout médico-nutricional em 4 páginas A4 fixas e balanceadas (2 dias por página),
 * com logotipo oficial Nutry+, grid organizado em 2 colunas por dia e ZERO cortes.
 */

export function gerarHtmlDocumentoPlano({ plano, paciente, nutricionista }) {
  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let parsed = plano?.conteudo || plano;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = { plano_semanal: [] };
    }
  }

  const dias = Array.isArray(parsed?.plano_semanal) ? parsed.plano_semanal : [];

  const refeicoesLabels = [
    { key: 'cafe_da_manha', title: 'Café da Manhã', icon: '🌅', color: '#d97706', bg: '#fef3c7' },
    { key: 'lanche_manha', title: 'Lanche da Manhã', icon: '🍏', color: '#059669', bg: '#d1fae5' },
    { key: 'almoco', title: 'Almoço', icon: '🥗', color: '#0284c7', bg: '#e0f2fe' },
    { key: 'lanche_tarde', title: 'Lanche da Tarde', icon: '🥪', color: '#ea580c', bg: '#ffedd5' },
    { key: 'jantar', title: 'Jantar', icon: '🍲', color: '#7c3aed', bg: '#ede9fe' }
  ];

  const formatList = (val) => {
    if (!val) return 'Nenhum';
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'Nenhum';
    return String(val);
  };

  const pacienteNome = paciente?.nome || 'Paciente';
  const pacienteIdade = paciente?.data_nascimento ? calcularIdade(paciente.data_nascimento) : null;
  const pacientePeso = paciente?.peso_inicial || paciente?.peso ? `${paciente.peso_inicial || paciente.peso} kg` : 'Não informado';
  const pacienteAltura = paciente?.altura ? (paciente.altura < 3 ? `${Math.round(paciente.altura * 100)} cm` : `${paciente.altura} cm`) : 'Não informada';
  const pacienteObjetivos = formatList(paciente?.objetivos) + (paciente?.objetivo_texto ? ` (${paciente.objetivo_texto})` : '');
  const pacienteAlergias = formatList(paciente?.alergias);
  const pacienteRestricoes = formatList(paciente?.restricoes_alimentares);
  const pacienteAgua = paciente?.litros_agua ? `${paciente.litros_agua} L / dia` : '2,0 L / dia';
  const nutriNome = nutricionista?.nome || 'Nutricionista Responsável';

  // Distribuição equilibrada: 2 dias por página para garantir layout 100% respirável
  const paginas = [
    { num: 1, total: 4, dias: dias.slice(0, 2), tipo: 'inicial' },
    { num: 2, total: 4, dias: dias.slice(2, 4), tipo: 'meio' },
    { num: 3, total: 4, dias: dias.slice(4, 6), tipo: 'meio' },
    { num: 4, total: 4, dias: dias.slice(6, 7), tipo: 'final' }
  ];

  const renderRefeicao = (refeicoes, refConfig) => {
    const opcoes = refeicoes?.[refConfig.key] || [];
    const opcoesValidas = opcoes.filter(o => o && String(o).trim() !== '');
    if (opcoesValidas.length === 0) return '';

    return `
      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-icon">${refConfig.icon}</span>
          <span class="meal-title">${refConfig.title}</span>
          <span class="meal-badge" style="background-color: ${refConfig.bg}; color: ${refConfig.color};">
            ${opcoesValidas.length} opções
          </span>
        </div>
        <div class="meal-options">
          ${opcoesValidas.map((opt, idx) => `
            <div class="option-row">
              <span class="option-num">${idx + 1}</span>
              <span class="option-text">${opt}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const renderDiaBlock = (diaItem) => {
    if (!diaItem) return '';
    const ref = diaItem.refeicoes || {};

    return `
      <div class="day-block">
        <div class="day-header">
          <div class="day-title">📅 ${diaItem.dia}</div>
          <div class="day-badge">Prescrição Nutricional</div>
        </div>

        <div class="day-meals-2col">
          <!-- Coluna Esquerda: Café da Manhã e Almoço -->
          <div class="meal-col">
            ${renderRefeicao(ref, refeicoesLabels[0])}
            ${renderRefeicao(ref, refeicoesLabels[2])}
          </div>

          <!-- Coluna Direita: Lanches e Jantar -->
          <div class="meal-col">
            ${renderRefeicao(ref, refeicoesLabels[1])}
            ${renderRefeicao(ref, refeicoesLabels[3])}
            ${renderRefeicao(ref, refeicoesLabels[4])}
          </div>
        </div>
      </div>
    `;
  };

  const renderRunningHeader = (pagNum, totalPags) => `
    <header class="page-running-header">
      <div class="running-brand">
        <div class="mini-logo-box">
          <svg viewBox="0 0 24 24" class="mini-logo-icon">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
          </svg>
        </div>
        <span class="running-brand-text">Nutry<span class="plus-color">+</span> <span class="running-sep">•</span> Prescrição Nutricional</span>
      </div>
      <div class="running-patient">
        Paciente: <strong>${pacienteNome}</strong> | Pág. ${pagNum} de ${totalPags}
      </div>
    </header>
  `;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano Alimentar - ${pacienteNome} - Nutry+</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background-color: #f1f5f9;
      font-size: 11px;
      line-height: 1.35;
    }

    /* PÁGINAS A4 FIXAS COM ZERO CORTES */
    .pdf-page {
      width: 794px;
      height: 1123px;
      max-height: 1123px;
      margin: 0 auto 20px auto;
      background: #ffffff;
      padding: 24px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      page-break-after: always;
      break-after: page;
      position: relative;
      overflow: hidden;
    }

    @media print {
      body {
        background-color: #ffffff;
      }
      .pdf-page {
        margin: 0;
        box-shadow: none;
        page-break-after: always;
        break-after: page;
        height: 100vh;
        max-height: 100vh;
      }
      .pdf-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
    }

    /* CABEÇALHO OFICIAL COM LOGO DA CLÍNICA (PÁGINA 1) */
    .clinic-main-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2.5px solid #00b4d8;
      margin-bottom: 10px;
    }

    .clinic-brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .clinic-logo-badge {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 3px 8px rgba(0, 180, 216, 0.35);
    }

    .clinic-logo-badge svg {
      width: 26px;
      height: 26px;
      stroke: white;
      stroke-width: 2.2;
      fill: none;
    }

    .clinic-titles h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0077b6;
      line-height: 1.1;
      letter-spacing: -0.5px;
    }

    .clinic-titles h1 span.plus {
      color: #00b4d8;
    }

    .clinic-titles p {
      font-size: 9.5px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 1px;
    }

    .clinic-meta-box {
      text-align: right;
      font-size: 9.5px;
      color: #475569;
      line-height: 1.35;
    }

    .doc-badge-pill {
      display: inline-block;
      background-color: #e0f2fe;
      color: #0369a1;
      font-weight: 700;
      font-size: 9px;
      padding: 2.5px 8px;
      border-radius: 9999px;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* MINI CABEÇALHO PARA PÁGINAS 2, 3 E 4 */
    .page-running-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1.5px solid #e2e8f0;
      margin-bottom: 10px;
    }

    .running-brand {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .mini-logo-box {
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mini-logo-box svg {
      width: 14px;
      height: 14px;
      stroke: white;
      stroke-width: 2.2;
      fill: none;
    }

    .running-brand-text {
      font-size: 11px;
      font-weight: 800;
      color: #0077b6;
    }

    .running-brand-text .plus-color {
      color: #00b4d8;
    }

    .running-sep {
      color: #cbd5e1;
      margin: 0 3px;
    }

    .running-patient {
      font-size: 10px;
      color: #64748b;
    }

    /* FICHA CLÍNICA DO PACIENTE (PÁGINA 1) */
    .patient-summary-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 12px;
      margin-bottom: 10px;
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 8px;
    }

    .patient-full-row {
      grid-column: span 3;
    }

    .patient-cell-label {
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .patient-cell-val {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 1px;
    }

    .patient-badges-wrap {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 3px;
    }

    .tag-pill {
      font-size: 9.5px;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .tag-pill.agua {
      background-color: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .tag-pill.alergia {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }

    .tag-pill.restricao {
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    /* CARDS DOS DIAS COM ESTRUTURA EM 2 COLUNAS */
    .days-list-stack {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }

    .day-block {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background-color: #ffffff;
    }

    .day-header {
      background: linear-gradient(135deg, #0077b6 0%, #0096c7 100%);
      color: white;
      padding: 5.5px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .day-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .day-badge {
      font-size: 9px;
      font-weight: 500;
      opacity: 0.9;
    }

    .day-meals-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 8px 10px;
    }

    .meal-col {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .meal-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 5px 8px;
      background-color: #fafbfc;
    }

    .meal-header {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10.5px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
      padding-bottom: 2px;
      border-bottom: 1px dashed #e2e8f0;
    }

    .meal-badge {
      font-size: 8px;
      padding: 1px 5px;
      border-radius: 9999px;
      font-weight: 700;
      margin-left: auto;
    }

    .meal-options {
      display: flex;
      flex-direction: column;
      gap: 2.5px;
    }

    .option-row {
      display: flex;
      align-items: flex-start;
      gap: 5px;
      font-size: 9.5px;
      color: #334155;
      line-height: 1.25;
    }

    .option-num {
      font-size: 8px;
      font-weight: 700;
      background-color: #e2e8f0;
      color: #475569;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* RECOMENDAÇÕES E ASSINATURA NA PÁGINA 4 */
    .guidelines-card {
      margin-top: 12px;
      padding: 10px 12px;
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      font-size: 10px;
      color: #166534;
      line-height: 1.4;
    }

    .guidelines-card h4 {
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 3px;
    }

    .signature-area {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .signature-slot {
      text-align: center;
      width: 220px;
    }

    .signature-rule {
      border-top: 1.5px solid #0f172a;
      margin-bottom: 4px;
    }

    .signature-name-text {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }

    .signature-role-text {
      font-size: 9px;
      color: #64748b;
    }

    .page-bottom-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- PÁGINA 1: LOGO NUTRY+ • DADOS DO PACIENTE • SEGUNDA E TERÇA -->
  <div class="pdf-page" data-page="1">
    <div>
      <header class="clinic-main-header">
        <div class="clinic-brand-group">
          <div class="clinic-logo-badge">
            <svg viewBox="0 0 24 24">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
            </svg>
          </div>
          <div class="clinic-titles">
            <h1>Nutry<span class="plus">+</span></h1>
            <p>Clínica & Consultoria Nutricional Integrada</p>
          </div>
        </div>

        <div class="clinic-meta-box">
          <span class="doc-badge-pill">Prescrição Nutricional</span>
          <div><strong>Emissão:</strong> ${dataEmissao}</div>
          <div><strong>Nutricionista:</strong> ${nutriNome}</div>
        </div>
      </header>

      <section class="patient-summary-card">
        <div>
          <div class="patient-cell-label">Paciente</div>
          <div class="patient-cell-val">${pacienteNome}</div>
        </div>
        <div>
          <div class="patient-cell-label">Idade / Sexo</div>
          <div class="patient-cell-val">${pacienteIdade ? `${pacienteIdade} anos` : 'Não informada'} ${paciente?.sexo ? `(${paciente.sexo})` : ''}</div>
        </div>
        <div>
          <div class="patient-cell-label">Peso / Altura</div>
          <div class="patient-cell-val">${pacientePeso} • ${pacienteAltura}</div>
        </div>
        <div class="patient-full-row">
          <div class="patient-cell-label">Objetivo Principal</div>
          <div class="patient-cell-val">${pacienteObjetivos}</div>
        </div>
        <div class="patient-full-row">
          <div class="patient-cell-label">Atenção & Restrições Clínicas</div>
          <div class="patient-badges-wrap">
            <span class="tag-pill agua">💧 Meta Hídrica: ${pacienteAgua}</span>
            ${paciente?.metasNutricionais ? `
              <span class="tag-pill" style="background-color: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;">
                ⚡ Meta: ${paciente.metasNutricionais.vet} kcal (P: ${paciente.metasNutricionais.macros?.proteina?.gramas}g • G: ${paciente.metasNutricionais.macros?.gordura?.gramas}g • C: ${paciente.metasNutricionais.macros?.carboidrato?.gramas}g)
              </span>
            ` : ''}
            ${pacienteAlergias !== 'Nenhum' ? `<span class="tag-pill alergia">⚠️ Alergias: ${pacienteAlergias}</span>` : ''}
            ${pacienteRestricoes !== 'Nenhum' ? `<span class="tag-pill restricao">🚫 Restrições: ${pacienteRestricoes}</span>` : ''}
          </div>
        </div>
      </section>

      <div class="days-list-stack">
        ${paginas[0].dias.map(d => renderDiaBlock(d)).join('')}
      </div>
    </div>

    <div class="page-bottom-footer">
      <span>Nutry+ Gestão Nutricional Integrada</span>
      <span>Página 1 de 4</span>
    </div>
  </div>

  <!-- PÁGINA 2: LOGO NUTRY+ • QUARTA E QUINTA -->
  <div class="pdf-page" data-page="2">
    <div>
      ${renderRunningHeader(2, 4)}
      <div class="days-list-stack">
        ${paginas[1].dias.map(d => renderDiaBlock(d)).join('')}
      </div>
    </div>

    <div class="page-bottom-footer">
      <span>Nutry+ Gestão Nutricional Integrada</span>
      <span>Página 2 de 4</span>
    </div>
  </div>

  <!-- PÁGINA 3: LOGO NUTRY+ • SEXTA E SÁBADO -->
  <div class="pdf-page" data-page="3">
    <div>
      ${renderRunningHeader(3, 4)}
      <div class="days-list-stack">
        ${paginas[2].dias.map(d => renderDiaBlock(d)).join('')}
      </div>
    </div>

    <div class="page-bottom-footer">
      <span>Nutry+ Gestão Nutricional Integrada</span>
      <span>Página 3 de 4</span>
    </div>
  </div>

  <!-- PÁGINA 4: LOGO NUTRY+ • DOMINGO • ORIENTAÇÕES • ASSINATURA -->
  <div class="pdf-page" data-page="4">
    <div>
      ${renderRunningHeader(4, 4)}
      
      <div class="days-list-stack">
        ${paginas[3].dias.map(d => renderDiaBlock(d)).join('')}
      </div>

      <div class="guidelines-card">
        <h4>💡 Recomendações Importantes</h4>
        <p>• Mantenha uma hidratação constante ao longo do dia, atingindo sua meta diária de água indicada.</p>
        <p>• Varie as opções das refeições conforme sua rotina e preferências, respeitando rigorosamente suas restrições e alergias.</p>
        <p>• Mastigue devagar e evite ingestão excessiva de líquidos durante as refeições principais (almoço e jantar).</p>
      </div>

      <div class="signature-area">
        <div class="signature-slot">
          <div class="signature-rule"></div>
          <div class="signature-name-text">${nutriNome}</div>
          <div class="signature-role-text">Nutricionista Clínico(a) • CRN</div>
        </div>

        <div style="text-align: right; font-size: 8.5px; color: #64748b;">
          <strong>Nutry+ Gestão Nutricional</strong><br/>
          Documento gerado em ${dataEmissao}<br/>
          Válido para acompanhamento clínico.
        </div>
      </div>
    </div>

    <div class="page-bottom-footer">
      <span>Nutry+ Gestão Nutricional Integrada</span>
      <span>Página 4 de 4</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
  `;
}

function calcularIdade(dataNasc) {
  if (!dataNasc) return null;
  const birth = new Date(dataNasc);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Abre a janela de impressão nativa A4
 */
export function imprimirExportarPDF({ plano, paciente, nutricionista }) {
  const htmlContent = gerarHtmlDocumentoPlano({ plano, paciente, nutricionista });
  const printWindow = window.open('', '_blank', 'width=950,height=1000');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  }
}

/**
 * Gera e baixa diretamente o arquivo .pdf página por página
 */
export async function baixarArquivoPDF({ plano, paciente, nutricionista, onProgress }) {
  if (onProgress) onProgress(true);

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';

  const rawHtml = gerarHtmlDocumentoPlano({ plano, paciente, nutricionista });
  const cleanHtml = rawHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
  container.innerHTML = cleanHtml;
  document.body.appendChild(container);

  try {
    const pageElements = container.querySelectorAll('.pdf-page');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i];
      if (i > 0) {
        pdf.addPage();
      }

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    const nomeFormatado = (paciente?.nome || 'Paciente').trim().replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`Plano_Alimentar_${nomeFormatado}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar arquivo PDF por páginas:', error);
    imprimirExportarPDF({ plano, paciente, nutricionista });
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    if (onProgress) onProgress(false);
  }
}

/**
 * Formata e abre o WhatsApp com a prescrição do plano alimentar
 */
export function compartilharWhatsApp({ plano, paciente, nutricionista }) {
  let parsed = plano?.conteudo || plano;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = { plano_semanal: [] };
    }
  }

  const pacienteNome = paciente?.nome || 'Paciente';
  const nutriNome = nutricionista?.nome || 'Nutricionista Responsável';
  const dias = Array.isArray(parsed?.plano_semanal) ? parsed.plano_semanal : [];

  const refeicoesLabels = [
    { key: 'cafe_da_manha', title: '🌅 Café da Manhã' },
    { key: 'lanche_manha', title: '🍏 Lanche da Manhã' },
    { key: 'almoco', title: '🥗 Almoço' },
    { key: 'lanche_tarde', title: '🥪 Lanche da Tarde' },
    { key: 'jantar', title: '🍲 Jantar' }
  ];

  let mensagem = `*NUTRY+ | PLANO ALIMENTAR PERSONALIZADO* 🌿\n\n`;
  mensagem += `👤 *Paciente:* ${pacienteNome}\n`;
  if (paciente?.objetivos) {
    const objStr = Array.isArray(paciente.objetivos) ? paciente.objetivos.join(', ') : paciente.objetivos;
    mensagem += `🎯 *Objetivo:* ${objStr}\n`;
  }
  if (paciente?.litros_agua) {
    mensagem += `💧 *Meta Hídrica:* ${paciente.litros_agua} L / dia\n`;
  }
  if (paciente?.metasNutricionais) {
    const m = paciente.metasNutricionais;
    mensagem += `⚡ *Meta Calórica (VET):* ${m.vet} kcal/dia (🍗 P: ${m.macros?.proteina?.gramas}g | 🥑 G: ${m.macros?.gordura?.gramas}g | 🍚 C: ${m.macros?.carboidrato?.gramas}g)\n`;
  }
  if (paciente?.alergias && paciente.alergias.length > 0 && !paciente.alergias.includes('Nenhum')) {
    const alergiasStr = Array.isArray(paciente.alergias) ? paciente.alergias.join(', ') : paciente.alergias;
    mensagem += `⚠️ *Alergias:* ${alergiasStr}\n`;
  }
  if (paciente?.restricoes_alimentares && paciente.restricoes_alimentares.length > 0 && !paciente.restricoes_alimentares.includes('Nenhum')) {
    const restricoesStr = Array.isArray(paciente.restricoes_alimentares) ? paciente.restricoes_alimentares.join(', ') : paciente.restricoes_alimentares;
    mensagem += `🚫 *Restrições:* ${restricoesStr}\n`;
  }
  mensagem += `👩‍⚕️ *Nutricionista:* ${nutriNome}\n\n`;
  mensagem += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  mensagem += `📋 *PRESCRIÇÃO NUTRICIONAL SEMANAL*\n`;
  mensagem += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  dias.forEach((diaItem) => {
    mensagem += `*📅 ${diaItem.dia.toUpperCase()}*\n`;
    const refeicoes = diaItem.refeicoes || {};

    refeicoesLabels.forEach((ref) => {
      const opcoes = refeicoes[ref.key] || [];
      const opcoesValidas = opcoes.filter(o => o && String(o).trim() !== '');

      if (opcoesValidas.length > 0) {
        mensagem += `\n*${ref.title}:*\n`;
        opcoesValidas.forEach((opt, idx) => {
          mensagem += `  ${idx + 1}. ${opt}\n`;
        });
      }
    });

    mensagem += `\n──────────────────────\n\n`;
  });

  mensagem += `💡 *Orientações:* Mastigue devagar, mantenha sua hidratação e siga seu cardápio com consistência!\n\n`;
  mensagem += `_Nutry+ Clínica de Nutrição_ 💚`;

  let rawPhone = String(paciente?.whatsapp || paciente?.telefone || '').replace(/\D/g, '');
  if (rawPhone.length === 10 || rawPhone.length === 11) {
    rawPhone = `55${rawPhone}`;
  }

  const encodedMsg = encodeURIComponent(mensagem);
  const whatsappUrl = rawPhone 
    ? `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodedMsg}`
    : `https://api.whatsapp.com/send?text=${encodedMsg}`;

  window.open(whatsappUrl, '_blank');
}
