import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Categorias de Supermercado com identificadores e cores temáticas
 */
export const CATEGORIAS_COMPRAS = [
  { id: 'hortifruti', title: 'Hortifrúti & Feira', icon: '🥦', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  { id: 'proteinas', title: 'Açougue, Ovos & Proteínas', icon: '🥩', color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
  { id: 'laticinios', title: 'Laticínios & Frios', icon: '🥛', color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
  { id: 'mercearia', title: 'Mercearia, Grãos & Cereais', icon: '🌾', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  { id: 'temperos', title: 'Temperos, Ervas & Bebidas', icon: '🌿', color: '#059669', bg: '#d1fae5', border: '#a7f3d0' },
  { id: 'suplementos', title: 'Suplementos & Especiais', icon: '💊', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
  { id: 'outros', title: 'Outros & Diversos', icon: '🛒', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' }
];

/**
 * Dicionário Semântico de Palavras-Chave para Classificação
 */
const REGRAS_CATEGORIAS = {
  hortifruti: [
    'banana', 'maçã', 'maca', 'abacate', 'morango', 'laranja', 'limão', 'limao', 'mamão', 'mamao',
    'melancia', 'melão', 'melao', 'uva', 'abacaxi', 'kiwi', 'manga', 'pera', 'pêra', 'frutas',
    'alface', 'tomate', 'cenoura', 'brócolis', 'brocolis', 'espinafre', 'couve', 'rúcula', 'rucula',
    'pepino', 'abobrinha', 'abóbora', 'abobora', 'berinjela', 'chuchu', 'beterraba', 'cebola',
    'alho', 'pimentão', 'pimentao', 'salada', 'folhas', 'legumes', 'verduras', 'batata', 'batata-doce',
    'mandioca', 'aipim', 'inhame', 'mandioquinha', 'cogumelo', 'shimeji', 'shitake'
  ],
  proteinas: [
    'frango', 'peito de frango', 'sobrecoxa', 'carne', 'patinho', 'alcatra', 'filé', 'músculo',
    'peixe', 'tilápia', 'tilapia', 'salmão', 'salmao', 'atum', 'sardinha', 'camarão', 'camarao',
    'ovo', 'ovos', 'clara', 'gema', 'omelete', 'tofu', 'tempeh', 'carne moída', 'lombo', 'porco'
  ],
  laticinios: [
    'leite', 'iogurte', 'queijo', 'cottage', 'ricota', 'mussarela', 'muçarela', 'parmesão', 'minas',
    'requeijão', 'requeijao', 'coalhada', 'manteiga', 'creme de leite', 'whey'
  ],
  mercearia: [
    'arroz', 'feijão', 'feijao', 'aveia', 'quinoa', 'chia', 'linhaça', 'linhaca', 'azeite',
    'pão', 'pao', 'torrada', 'tapioca', 'farinha', 'granola', 'castanha', 'nozes', 'amêndoa', 'amendoa',
    'pasta de amendoim', 'amendoim', 'macarrão', 'macarrao', 'lentilha', 'grão-de-bico', 'grao de bico',
    'gergelim', 'semente', 'milho', 'farelo'
  ],
  temperos: [
    'canela', 'orégano', 'oregano', 'açafrão', 'acafrao', 'cúrcuma', 'curcuma', 'pimenta',
    'chá', 'cha', 'café', 'cafe', 'ervas', 'alecrim', 'manjericão', 'manjericao', 'salsinha',
    'cebolinha', 'coentro', 'louro', 'gengibre', 'hortelã', 'hortela', 'vinagre'
  ],
  suplementos: [
    'whey', 'creatina', 'glutamina', 'vitamina', 'ômega', 'omega', 'suplemento', 'colágeno', 'colageno',
    'adoçante', 'adocante', 'stevia', 'psyllium', 'albumina', 'bcaa'
  ]
};

/**
 * Classifica um alimento com base em palavras-chave
 */
export function classificarAlimento(texto) {
  if (!texto) return 'outros';
  const normalizado = String(texto).toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [categoria, keywords] of Object.entries(REGRAS_CATEGORIAS)) {
    for (const kw of keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const regex = new RegExp(`\\b${kwNorm}`, 'i');
      if (regex.test(normalizado)) {
        return categoria;
      }
    }
  }

  return 'outros';
}

/**
 * Limpa e padroniza o nome do alimento retirando porções repetitivas de forma legível
 */
export function limparNomeItem(itemStr) {
  if (!itemStr) return '';
  return itemStr
    .trim()
    .replace(/^[•\-*]\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/\s+/g, ' ');
}

/**
 * Segmenta uma opção de refeição em alimentos individuais
 */
export function segmentarAlimentos(texto) {
  if (!texto || typeof texto !== 'string') return [];
  const limpo = limparNomeItem(texto);
  if (!limpo || limpo.length < 2) return [];

  // Se a frase for curta (ex: "2 ovos cozidos", "1 maçã"), retorna direto
  if (limpo.length <= 35 && !limpo.includes(' com ') && !limpo.includes(', ') && !limpo.includes(' + ')) {
    return [limpo.charAt(0).toUpperCase() + limpo.slice(1)];
  }

  // Divide por divisores comuns (vírgula, "com", "e", "+", "acompanhado de")
  const partes = limpo
    .split(/,|\s+com\s+|\s+e\s+|\s*\+\s*|\s+acompanhado de\s+/i)
    .map(p => p.trim())
    .filter(p => p.length >= 2 && !/^(opção|opcao|dia|refeição|refeicao|\d+)$/i.test(p));

  if (partes.length === 0) {
    return [limpo.charAt(0).toUpperCase() + limpo.slice(1)];
  }

  return partes.map(p => p.charAt(0).toUpperCase() + p.slice(1));
}

/**
 * Extrai e consolida todos os itens do plano alimentar semanal (qualquer formato)
 */
export function extrairListaDeCompras(planoInput) {
  if (!planoInput) return [];

  let planoSemanal = [];

  // Suporte a diferentes formatos e objetos serializados
  if (Array.isArray(planoInput)) {
    planoSemanal = planoInput;
  } else if (typeof planoInput === 'string') {
    try {
      const parsed = JSON.parse(planoInput);
      return extrairListaDeCompras(parsed);
    } catch {
      return [];
    }
  } else if (typeof planoInput === 'object') {
    if (Array.isArray(planoInput.plano_semanal)) {
      planoSemanal = planoInput.plano_semanal;
    } else if (planoInput.conteudo) {
      return extrairListaDeCompras(planoInput.conteudo);
    } else if (Array.isArray(planoInput.dias)) {
      planoSemanal = planoInput.dias;
    }
  }

  if (!Array.isArray(planoSemanal) || planoSemanal.length === 0) {
    return [];
  }

  const itensExtraidos = new Set();
  const itensPorCategoria = {
    hortifruti: [],
    proteinas: [],
    laticinios: [],
    mercearia: [],
    temperos: [],
    suplementos: [],
    outros: []
  };

  planoSemanal.forEach((dia) => {
    const refeicoes = dia.refeicoes || {};
    Object.values(refeicoes).forEach((opcoes) => {
      if (Array.isArray(opcoes)) {
        opcoes.forEach((opcao) => {
          if (!opcao || typeof opcao !== 'string') return;
          const itensSegmentados = segmentarAlimentos(opcao);
          itensSegmentados.forEach(item => {
            if (item && item.length > 2) {
              itensExtraidos.add(item);
            }
          });
        });
      }
    });
  });

  // Classifica e agrupa
  Array.from(itensExtraidos).forEach((item) => {
    const catId = classificarAlimento(item);
    if (!itensPorCategoria[catId]) {
      itensPorCategoria[catId] = [];
    }
    itensPorCategoria[catId].push({
      id: `${catId}-${Math.random().toString(36).substr(2, 9)}`,
      nome: item,
      selected: true,
      categoria: catId
    });
  });

  // Retorna categorias com itens ordenados alfabeticamente
  return CATEGORIAS_COMPRAS.map((cat) => {
    const itens = (itensPorCategoria[cat.id] || []).sort((a, b) => a.nome.localeCompare(b.nome));
    return {
      ...cat,
      itens
    };
  }).filter((cat) => cat.itens.length > 0);
}

/**
 * Gera o texto formatado para envio direto via WhatsApp (apenas itens selecionados)
 */
export function formatarListaComprasWhatsApp(listaCategorizada, pacienteNome) {
  let msg = `🛒 *NUTRY+ | LISTA DE COMPRAS DA SEMANA* 📋\n`;
  msg += `👤 *Paciente:* ${pacienteNome || 'Paciente'}\n`;
  msg += `📅 *Referência:* Cardápio Semanal Personalizado\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  let totalItens = 0;

  listaCategorizada.forEach((cat) => {
    const itensSelecionados = (cat.itens || []).filter(i => i.selected !== false);
    if (itensSelecionados.length === 0) return;

    msg += `*${cat.icon} ${cat.title.toUpperCase()}*\n`;
    itensSelecionados.forEach((item) => {
      totalItens++;
      msg += `  ▫️ ${item.nome}\n`;
    });
    msg += `\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `✅ *Total de Itens Selecionados:* ${totalItens}\n`;
  msg += `💡 _Dica Nutry+: Priorize alimentos frescos e da época para maior valor nutricional e economia!_`;

  return msg;
}

/**
 * Gera e baixa o PDF A4 da Lista de Compras com Checkboxes (apenas itens selecionados)
 */
export async function baixarPDFListaCompras({
  listaCategorizada,
  paciente,
  nutricionista,
  onProgress
}) {
  if (onProgress) onProgress(true);

  try {
    const pacienteNome = paciente?.nome || 'Paciente';
    const nutriNome = nutricionista?.nome || 'Nutricionista Responsável';
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Filtrar categorias que possuem itens selecionados
    const categoriasComSelecionados = listaCategorizada
      .map(cat => ({
        ...cat,
        itens: (cat.itens || []).filter(i => i.selected !== false)
      }))
      .filter(cat => cat.itens.length > 0);

    let totalItens = 0;
    categoriasComSelecionados.forEach(c => { totalItens += c.itens.length; });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          body { background-color: #f8fafc; color: #0f172a; padding: 24px; }
          .pdf-container { width: 750px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0; }
          
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00b4d8; padding-bottom: 16px; margin-bottom: 20px; }
          .brand { display: flex; align-items: center; gap: 10px; }
          .logo-badge { width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: bold; }
          .brand-title { font-size: 22px; font-weight: 800; color: #0f172a; }
          .brand-title span { color: #00b4d8; }
          .brand-sub { font-size: 11px; color: #64748b; font-weight: 600; }
          
          .meta-box { text-align: right; font-size: 11px; color: #475569; }
          .meta-title { font-size: 14px; font-weight: 700; color: #0077b6; margin-bottom: 3px; }
          
          .patient-card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 12px; }
          .patient-card strong { color: #0369a1; }
          
          .categories-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          
          .category-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; break-inside: avoid; }
          .category-header { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
          
          .items-list { display: flex; flex-direction: column; gap: 8px; }
          .item-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #334155; }
          .checkbox { width: 13px; height: 13px; border: 1.5px solid #94a3b8; border-radius: 3px; flex-shrink: 0; }
          
          .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <div class="header">
            <div class="brand">
              <div class="logo-badge">N+</div>
              <div>
                <div class="brand-title">Nutry<span>+</span></div>
                <div class="brand-sub">Clínica & Consultoria Nutricional Integrada</div>
              </div>
            </div>
            <div class="meta-box">
              <div class="meta-title">Lista de Compras da Semana</div>
              <div><strong>Data:</strong> ${dataAtual}</div>
              <div><strong>Nutricionista:</strong> ${nutriNome}</div>
            </div>
          </div>

          <div class="patient-card">
            <div><strong>Paciente:</strong> ${pacienteNome}</div>
            <div><strong>Total de Itens:</strong> ${totalItens} selecionados</div>
          </div>

          <div class="categories-grid">
            ${categoriasComSelecionados.map(cat => `
              <div class="category-card" style="border-top: 3px solid ${cat.color};">
                <div class="category-header" style="color: ${cat.color};">
                  <span>${cat.icon}</span>
                  <span>${cat.title}</span>
                  <span style="font-size: 10px; opacity: 0.8; margin-left: auto;">(${cat.itens.length})</span>
                </div>
                <div class="items-list">
                  ${cat.itens.map(item => `
                    <div class="item-row">
                      <div class="checkbox"></div>
                      <span>${item.nome}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <span>Nutry+ • Lista de compras gerada automaticamente a partir do plano nutricional</span>
            <span>Página 1 de 1</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '800px';
    iframe.style.height = '1200px';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    await new Promise(resolve => setTimeout(resolve, 350));

    const element = doc.querySelector('.pdf-container');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(iframe);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
    pdf.save(`NutryPlus_Lista_Compras_${pacienteNome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF da lista de compras:', error);
  } finally {
    if (onProgress) onProgress(false);
  }
}
