import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Função auxiliar para gerar um plano manual/fallback completo seguindo a rotina brasileira
export function gerarPlanoManualFallback(dadosPaciente = {}) {
  const restricoes = Array.isArray(dadosPaciente.restricoes_alimentares) 
    ? dadosPaciente.restricoes_alimentares.join(', ') 
    : String(dadosPaciente.restricoes_alimentares || 'Nenhuma');
  const alergias = Array.isArray(dadosPaciente.alergias) 
    ? dadosPaciente.alergias.join(', ') 
    : String(dadosPaciente.alergias || 'Nenhuma');
  const semGluten = /gl[uú]ten/i.test(restricoes) || /gl[uú]ten/i.test(alergias);
  const semLactose = /lactose|leite/i.test(restricoes) || /lactose|leite/i.test(alergias);
  const semCarneVermelha = /carne\s*vermelha|vegetariano|vegano/i.test(restricoes);

  const dias = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
  ];

  const templatesPorDia = {
    'Segunda-feira': {
      cafe_da_manha: [
        semGluten ? 'Tapioca com 2 ovos mexidos e orégano + café puro ou com leite vegetal' : '2 fatias de pão integral com ovos mexidos e café com leite desnatado' + (semLactose ? ' zero lactose' : ''),
        '1 porção de frutas da estação (mamão papaia com 1 colher de sopa de sementes de chia)',
        'Iogurte natural ' + (semLactose ? 'zero lactose' : 'desnatado') + ' com 2 colheres de sopa de aveia em flocos e morangos',
        semGluten ? 'Crepioca (goma de tapioca + 1 ovo + 1 fatia de queijo minas frescal zero lactose)' : 'Torrada integral com pasta de ricota com ervas finas e chá verde com limão',
        'Vitamina de banana com leite ' + (semLactose ? 'vegetal (amêndoas)' : 'desnatado') + ' e 1 colher de farelo de aveia'
      ],
      lanche_manha: [
        '1 maçã fatiada polvilhada com canela em pó',
        'Mix de castanhas do Brasil e nozes (30g)',
        '1 pera fresca com 4 castanhas de caju',
        '1 fatia média de melancia fresca',
        'Iogurte líquido ' + (semLactose ? 'sem lactose' : 'desnatado') + ' com 1 colher de linhaça dourada'
      ],
      almoco: [
        (semCarneVermelha ? 'Filé de peito de frango grelhado (130g)' : 'Patinho moído refogado com legumes (120g)') + ', arroz integral (3 colheres), feijão carioca (1 concha) e salada de folhas verdes à vontade',
        'Salada colorida de alface americana, rúcula, tomate cereja, cenoura ralada e azeite extravirgem (1 colher de chá)',
        'Legumes no vapor (brócolis, abobrinha e cenoura) temperados com azeite e ervas',
        'Filé de tilápia grelhado com purê de mandioquinha e salada de agrião com beterraba ralada',
        'Sobremesa: 1 fatia de abacaxi com raspas de limão'
      ],
      lanche_tarde: [
        semGluten ? '1 fatia de pão sem glúten tostado com pasta de amendoim integral' : '1 fatia de pão integral com queijo branco ' + (semLactose ? 'zero lactose' : '') + ' e orégano',
        'Vitamina de morango com leite ' + (semLactose ? 'zero lactose' : 'desnatado') + ' e farelo de aveia',
        '1 banana amassada com 1 colher de sopa de aveia em flocos e canela',
        'Biscoito de arroz integral com homus ou pasta de grão-de-bico',
        '1 punhado de amêndoas tostadas (25g) + 1 xícara de chá de hortelã'
      ],
      jantar: [
        'Omelete com 2 ovos, espinafre, tomate picado e orégano + salada mista com azeite',
        'Sopa nutritiva de legumes com ' + (semCarneVermelha ? 'frango desfiado' : 'carne magra desfiada') + ' e quinoa',
        'Filé de frango grelhado em tiras com salada de folhas verdes, palmito e tomate',
        'Crepioca recheada com frango desfiado temperado com cúrcuma e tomate',
        'Prato de legumes assados (abóbora cabotiá, abobrinha, berinjela) com peixe assado ao forno'
      ]
    },
    'Terça-feira': {
      cafe_da_manha: [
        'Overnight oats: aveia hidratada no leite ' + (semLactose ? 'vegetal' : 'desnatado') + ' com chia e frutas vermelhas',
        semGluten ? 'Ovos mexidos com tomate e manjericão + 1 fatia de queijo branco sem lactose' : 'Pão francês integral sem miolo com queijo minas e café coado sem açúcar',
        'Panqueca de banana funcional (1 banana, 1 ovo, 2 colheres de aveia) com canela',
        'Suco verde detox (couve, limão, maçã, gengibre) + 2 ovos cozidos',
        'Iogurte natural com granola caseira sem açúcar e mirtilos'
      ],
      lanche_manha: [
        '1 fatia de melão doce com sementes de girassol',
        '1 punhado de castanhas-de-caju naturais (30g)',
        '1 goiaba vermelha rica em vitamina C',
        'Palitinhos de cenoura e pepino com pasta de ricota temperada',
        'Água de coco natural (200ml) com 3 nozes'
      ],
      almoco: [
        'Filé de sobrecoxa desossada assada sem pele (130g), batata-doce cozida (100g) e feijão preto (1 concha)',
        'Salada tropical: mix de folhas, manga em cubos, pepino japonês e tomate',
        'Abobrinha italiana refogada com cebola roxa e ervas frescas',
        'Sobrecoxa ao forno com cúrcuma e alecrim acompanhada de quinoa cozida e brócolis',
        'Sobremesa: 1 tangerina / mexerica'
      ],
      lanche_tarde: [
        'Iogurte ' + (semLactose ? 'zero lactose' : 'grego light') + ' com 1 colher de chia e sementes de abóbora',
        semGluten ? 'Biscoitos de arroz integral com pasta de castanha' : 'Sanduíche natural integral com pasta de atum e cenoura ralada',
        'Muffin de banana com aveia e canela caseiro',
        'Smoothie de mamão com leite de coco e aveia',
        '1 maçã verde com 1 colher de sobremesa de pasta de amendoim'
      ],
      jantar: [
        'Salada completa com mix de folhas, atum sólido em água, ovo cozido, tomate e azeite',
        'Creme de abóbora cabotiá com gengibre e frango desfiado',
        'Wrap de folha de couve recheado com peito de peru, queijo magro e tomate seco',
        'Peixe branco grelhado ao molho de ervas finas com purê de couve-flor',
        'Omelete recheada com cogumelos frescos salteados e tomate'
      ]
    },
    'Quarta-feira': {
      cafe_da_manha: [
        semGluten ? 'Cuscuz nordestino de milho com 2 ovos caipiras mexidos' : 'Pão sírio 100% integral aquecido com queijo cottage e café com leite',
        'Bowl de mamão papaia, morangos e sementes de linhaça com iogurte',
        'Waffle de aveia e banana feito na frigideira com mel puro ou canela',
        'Ovos pochê sobre fatia de pão ' + (semGluten ? 'sem glúten' : 'integral 100%') + ' e tomate grelhado',
        'Vitamina de abacate com leite ' + (semLactose ? 'vegetal' : 'desnatado') + ' e gotas de limão'
      ],
      lanche_manha: [
        '1 cacho pequeno de uvas roxas frescas',
        '1 punhado de amêndoas cruas (25g)',
        '1 kiwi fatiado com sementes de chia',
        'Iogurte desnatado batido com polpa de maracujá',
        '1 mexerica fresca e suculenta'
      ],
      almoco: [
        (semCarneVermelha ? 'Filé de peito de frango em cubos com cúrcuma' : 'Bife magro de alcatra grelhado (120g)') + ', arroz integral com cenoura (3 colheres) e lentilha (1 concha)',
        'Salada de couve fatiada fininha com tomate picado, azeite e limão',
        'Berinjela ao forno com ervas de provence e tomate cereja',
        'Escondidinho fit de mandioca com ' + (semCarneVermelha ? 'frango desfiado' : 'patinho moído') + ' e salada verde',
        'Sobremesa: 1 fatia de melancia'
      ],
      lanche_tarde: [
        semGluten ? 'Crepioca leve com queijo branco e sementes de gergelim' : 'Torradas integrais com guacamole caseiro simples',
        'Salada de frutas frescas com raspas de limão e sementes de chia',
        'Iogurte natural ' + (semLactose ? 'sem lactose' : '') + ' com 1 colher de farinha de linhaça dourada',
        '1 fatia de bolo de caneca de banana com aveia e cacau 100%',
        'Chá de camomila com 4 castanhas do Pará'
      ],
      jantar: [
        'Filé de salmão ou pescada grelhada com legumes salteados no azeite (vagem e cenoura)',
        'Salada colorida de grão-de-bico com atum, tomate, cebola roxa e salsinha',
        'Omelete de forno com legumes variados e folhas de manjericão',
        'Caldo verde funcional (com base de couve-flor e folhas de couve rasgadas com frango)',
        'Peito de frango grelhado acebolado com brócolis ao alho'
      ]
    },
    'Quinta-feira': {
      cafe_da_manha: [
        semGluten ? 'Tapioca de banana com canela e 2 ovos cozidos à parte' : 'Pão integral de fermentação natural com pasta de ovos e cebolinha',
        'Vitamina de frutas vermelhas com leite ' + (semLactose ? 'vegetal' : 'desnatado') + ' e farelo de aveia',
        'Panqueca proteica de aveia com cottage e morangos',
        'Iogurte natural com sementes de abóbora tostadas e maçã em cubos',
        'Café com canela + 2 ovos mexidos com azeite de oliva e orégano'
      ],
      lanche_manha: [
        '1 ameixa fresca ou 2 ameixas secas com 3 nozes',
        'Chips de maçã desidratada caseira',
        '1 pote pequeno de iogurte ' + (semLactose ? 'sem lactose' : 'light'),
        '1 fatia média de abacaxi com folhas de hortelã',
        '1 barra de castanhas e sementes sem adição de açúcar'
      ],
      almoco: [
        'Peito de frango marinado com limão e ervas (130g), purê de abóbora cabotiá (120g) e feijão carioca',
        'Salada de rúcula, alface roxa, cenoura ralada e gergelim tostado',
        'Couve-flor gratinada leve com molho de queijo magro',
        'Moqueca leve de peixe branco com pimentões, tomate e arroz integral',
        'Sobremesa: 1 laranja em gomos'
      ],
      lanche_tarde: [
        semGluten ? 'Pãozinho de frigideira de tapioca com ovo e sementes' : 'Sanduíche de pão 100% integral com pasta de ricota e peito de frango desfiado',
        '1 pote de iogurte com 1 colher de farinha de aveia e nibs de cacau',
        'Banana assada com canela e 1 colher de pasta de amendoim',
        'Vitamina de abacate com limão e leite vegetal',
        '1 xícara de chá verde + mix de sementes tostadas (girassol e abóbora)'
      ],
      jantar: [
        'Hambúrguer caseiro de ' + (semCarneVermelha ? 'frango com aveia' : 'patinho magro') + ' grelhado + salada crua generosa',
        'Sopa de mandioquinha com espinafre e frango desfiado',
        'Salada morna de quinoa com abobrinha grelhada, tomate seco e atum',
        'Omelete aberta com ricota temperada, tomate e orégano fresco',
        'Filé de tilápia assado com crosta de ervas e salada de alface e pepino'
      ]
    },
    'Sexta-feira': {
      cafe_da_manha: [
        semGluten ? 'Crepioca funcional com gergelim e queijo branco' : '2 fatias de pão 100% integral com ovos mexidos e café com leite',
        'Mingau de aveia morno com canela e rodelas de banana',
        'Iogurte natural ' + (semLactose ? 'sem lactose' : '') + ' com mamão picado e sementes de chia',
        'Torrada com homus e tomate fatiado + chá de hibisco gelado',
        'Suco de laranja natural com beterraba e gengibre + 2 ovos cozidos'
      ],
      lanche_manha: [
        '1 maçã vermelha fresca com 4 amêndoas',
        '1 taça de salada de frutas da estação',
        '1 punhado de nozes (30g)',
        '1 fatia de melão orange',
        'Água aromatizada com hortelã, pepino e limão + 1 castanha-do-pará'
      ],
      almoco: [
        (semCarneVermelha ? 'Filé de Saint Peter grelhado (140g)' : 'Iscas de filé mignon ou patinho aceboladas (120g)') + ', arroz integral (3 colheres) e feijão carioca (1 concha)',
        'Salada de folhas verdes nobres com tomate cereja, palmito e sementes de chia',
        'Mix de legumes no forno (cenoura, abobrinha, cebola roxa e pimentão amarelo)',
        'Risoto fit de arroz integral com cogumelos frescos e peito de frango grelhado',
        'Sobremesa: 1 fatia de abacaxi com raspas de limão'
      ],
      lanche_tarde: [
        semGluten ? '1 tapioca pequena com pasta de amendoim e banana' : '1 pão de queijo caseiro integral + café passado',
        'Iogurte ' + (semLactose ? 'zero lactose' : 'desnatado') + ' com 1 colher de granola sem açúcar',
        'Vitamina de mamão com aveia e leite de amêndoas',
        'Cookies integrais caseiros de banana com aveia (sem açúcar)',
        '1 porção de castanhas de caju e uvas passas (30g)'
      ],
      jantar: [
        'Pizza fit de frigideira (massa de crepioca, molho de tomate caseiro, queijo magro, tomate e manjericão)',
        'Salada Caesar leve com frango em tiras, alface romana e molho de iogurte',
        'Filé de pescada branca grelhada com purê de cenoura e brócolis',
        'Sopa reconfortante de abóbora com gengibre e cubos de frango',
        'Omelete de 2 ovos com recheio de legumes salteados e orégano'
      ]
    },
    'Sábado': {
      cafe_da_manha: [
        'Brunch saudável: ovos mexidos cremosos, fatias de abacate com limão e ' + (semGluten ? 'tapioca' : 'pão integral rústico'),
        'Panquecas fofas de banana com aveia e frutas vermelhas frescas',
        'Bowl de açaí puro (sem xarope) batido com banana e coberto com chia e morangos',
        'Iogurte natural batido com manga e sementes de linhaça dourada',
        'Café com leite vegetal espumado + 2 fatias de queijo minas frescal na chapa'
      ],
      lanche_manha: [
        '1 cacho de uvas verdes sem semente',
        '1 pêssego ou nectarina fresca',
        'Mix de castanhas e sementes (30g)',
        'Água de coco gelada com raspas de limão',
        '1 fatia média de melancia fresca'
      ],
      almoco: [
        'Filé de salmão ou peixe da estação assado com ervas frescas, batatas rústicas com casca ao alecrim e brócolis no vapor',
        'Salada colorida mediterrânea com pepino, tomate, azeitonas pretas picadas, cebola roxa e azeite',
        'Legumes grelhados na grelha com azeite de oliva e orégano',
        'Frango assado de domingo estilo caseiro com salada de folhas e arroz com açafrão',
        'Sobremesa: 1 taça de morangos frescos com gotas de limão'
      ],
      lanche_tarde: [
        'Smoothie cremoso de banana congelada, morangos e leite ' + (semLactose ? 'sem lactose' : 'vegetal'),
        semGluten ? 'Biscoito de arroz com pasta de grão de bico e gergelim' : 'Torrada integral com pasta de ricota e geleia 100% fruta',
        'Muffin funcional de maçã e canela com aveia',
        'Iogurte natural com 1 colher de sementes de abóbora e chia',
        'Chá de frutas vermelhas gelado com rodelas de limão'
      ],
      jantar: [
        'Crepioca recheada com atum, cebola roxa, tomate e folhas de rúcula',
        'Wrap integral com tiras de frango grelhado, alface americana e molho de mostarda com mel suave',
        'Creme leve de couve-flor com noz-moscada e peito de peru em cubos',
        'Salada mista com ovos cozidos, palmito, cenoura ralada e azeite extravirgem',
        'Filé de tilápia com legumes salteados na manteiga ' + (semLactose ? 'ghee' : 'clarificada')
      ]
    },
    'Domingo': {
      cafe_da_manha: [
        'Café da manhã especial: ovos pochê, fatias de tomate caqui grelhado, ' + (semGluten ? 'crepioca' : 'pão integral artesanal') + ' e café especial',
        'Waffle de aveia com calda de frutas vermelhas 100% natural',
        'Vitamina tropical de manga, banana e leite de coco',
        'Iogurte natural ' + (semLactose ? 'sem lactose' : '') + ' com granola caseira de sementes e mamão',
        'Omelete com ervas frescas e café com leite'
      ],
      lanche_manha: [
        '1 fatia generosa de abacaxi com raspas de limão e folhas de hortelã',
        '1 punhado de nozes e castanhas de caju (30g)',
        '1 maçã fuji fatiada com canela',
        'Água de coco fresca com folhas de hortelã',
        '1 taça de salada de frutas'
      ],
      almoco: [
        'Frango grelhado suculento ou peixe assado com crosta de ervas, purê de batata baroa/mandioquinha e salada de folhas',
        'Salada verde caprichada com agrião, rúcula, tomates confitados e azeite de oliva',
        'Legumes salteados (abobrinha, berinjela, cenoura e cebola) ao azeite',
        'Massa integral com molho de tomate rústico caseiro e almôndegas de ' + (semCarneVermelha ? 'frango' : 'patinho magro'),
        'Sobremesa: Salada de frutas refrescante com raspas de laranja'
      ],
      lanche_tarde: [
        semGluten ? 'Pão de queijo caseiro com polvilho doce e azedo + café' : 'Sanduíche leve de pão integral com pasta de ricota e orégano',
        'Bolo fit de cenoura com farinha de aveia (sem açúcar refinado)',
        'Iogurte grelhado light com morangos picados e chia',
        'Vitamina de banana com leite vegetal e canela',
        '1 punhado de amêndoas tostadas com chá de erva-cidreira'
      ],
      jantar: [
        'Sopa leve de legumes da horta com frango desfiado e salsinha fresca',
        'Omelete cremosa de 2 ovos com queijo branco, tomate e manjericão + salada verde',
        'Wrap de folha de alface americana com patê de atum e cenoura ralada',
        'Prato leve de abobrinha recheada com ' + (semCarneVermelha ? 'frango e ricota' : 'carne moída magra') + ' gratinada',
        'Creme de abóbora com leite de coco e gengibre'
      ]
    }
  };

  return {
    plano_semanal: dias.map(dia => ({
      dia,
      refeicoes: templatesPorDia[dia] || templatesPorDia['Segunda-feira']
    }))
  };
}

// Schema estrito para Structured Outputs do Gemini
const planoSemanalSchema = {
  type: SchemaType.OBJECT,
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      description: 'Lista contendo os 7 dias da semana com suas respectivas 5 refeições diárias',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: {
            type: SchemaType.STRING,
            description: 'Nome do dia da semana (ex: Segunda-feira, Terça-feira, etc.)'
          },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: {
                type: SchemaType.ARRAY,
                description: 'Lista com exatamente 5 opções de café da manhã para o dia',
                items: { type: SchemaType.STRING }
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                description: 'Lista com exatamente 5 opções de lanche da manhã para o dia',
                items: { type: SchemaType.STRING }
              },
              almoco: {
                type: SchemaType.ARRAY,
                description: 'Lista com exatamente 5 opções de almoço para o dia',
                items: { type: SchemaType.STRING }
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                description: 'Lista com exatamente 5 opções de lanche da tarde para o dia',
                items: { type: SchemaType.STRING }
              },
              jantar: {
                type: SchemaType.ARRAY,
                description: 'Lista com exatamente 5 opções de jantar para o dia',
                items: { type: SchemaType.STRING }
              }
            },
            required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar']
          }
        },
        required: ['dia', 'refeicoes']
      }
    }
  },
  required: ['plano_semanal']
};

export default async function handler(req, res) {
  // Configuração de CORS para requisições seguras
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const { paciente } = req.body || {};

    if (!paciente) {
      return res.status(400).json({ error: 'Dados do paciente são obrigatórios para gerar o plano alimentar.' });
    }

    // Leitura estrita da chave GOOGLE_API_KEY no backend
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    // Se não houver API key configurada no ambiente, retorna o plano brasileiro seguro estruturado
    if (!apiKey || apiKey === 'sua_chave_aqui' || apiKey.trim() === '') {
      console.warn('GOOGLE_API_KEY não configurada no backend. Gerando plano clínico manual de alta qualidade.');
      const planoFallback = gerarPlanoManualFallback(paciente);
      return res.status(200).json({
        ...planoFallback,
        origem: 'template_clinico_manual',
        aviso: 'Plano gerado pelo protocolo clínico interno (chave Google Gemini não detectada no ambiente).'
      });
    }

    const metas = req.body.metasNutricionais;
    let metasInfo = '';
    if (metas && metas.vet) {
      metasInfo = `\n- Metas Energéticas & Macronutrientes Calculados:
  * Meta Calórica Diária (VET): ${metas.vet} kcal/dia (TMB: ${metas.tmb || 'N/D'} kcal | GET: ${metas.get || 'N/D'} kcal)
  * Proteínas: ${metas.macros?.proteina?.gramas || 'N/D'}g (${metas.macros?.proteina?.percentual || 'N/D'}% do VET - ${metas.macros?.proteina?.gKg || 'N/D'} g/kg)
  * Gorduras: ${metas.macros?.gordura?.gramas || 'N/D'}g (${metas.macros?.gordura?.percentual || 'N/D'}% do VET)
  * Carboidratos: ${metas.macros?.carboidrato?.gramas || 'N/D'}g (${metas.macros?.carboidrato?.percentual || 'N/D'}% do VET)
  * Meta de Água: ${metas.aguaLitros || 'N/D'} L/dia`;
    }

    // Formatar os dados do paciente para o prompt
    const dadosPacienteFormatados = `
- Nome: ${paciente.nome || 'Não informado'}
- Idade/Nascimento: ${paciente.data_nascimento || 'Não informado'} (${paciente.sexo || 'Não informado'})
- Peso Atual/Inicial: ${paciente.peso_inicial || paciente.peso || 'Não informado'} kg
- Altura: ${paciente.altura || 'Não informado'} cm
- Nível de Atividade Física: ${paciente.nivel_atividade || 'Não informado'}
- Pratica Atividade Física: ${paciente.atividade_fisica ? 'Sim: ' + (paciente.atividade_fisica_descricao || '') : 'Não'}
- Metas / Objetivos: ${Array.isArray(paciente.objetivos) ? paciente.objetivos.join(', ') : paciente.objetivos || 'Saúde geral'} ${paciente.objetivo_texto ? `(${paciente.objetivo_texto})` : ''}
- Patologias / Condições Clínicas: ${Array.isArray(paciente.patologias) ? paciente.patologias.join(', ') : paciente.patologias || 'Nenhuma'}
- Restrições Alimentares: ${Array.isArray(paciente.restricoes_alimentares) ? paciente.restricoes_alimentares.join(', ') : paciente.restricoes_alimentares || 'Nenhuma'}
- Alergias Alimentares: ${Array.isArray(paciente.alergias) ? paciente.alergias.join(', ') : paciente.alergias || 'Nenhuma'}
- Medicamentos em uso: ${paciente.medicamentos || 'Nenhum'}
- Suplementos em uso: ${paciente.suplementos || 'Nenhum'}
- Rotina Diária: Acorda às ${paciente.horario_acorda || 'Não informado'}, dorme às ${paciente.horario_dorme || 'Não informado'}, consome ${paciente.litros_agua || 'Não informado'} L de água por dia.
- Observações Clínicas Adicionais: ${paciente.observacoes || 'Nenhuma'}${metasInfo}
    `.trim();

    // Prompt estrito exigido pelo Prompt 6
    const promptTexto = `
Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPacienteFormatados}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}
`.trim();

    const genAI = new GoogleGenerativeAI(apiKey);

    // Lista de modelos suportados pelo Gemini SDK
    const modelosParaTestar = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let result = null;
    let ultimoErro = null;

    for (const modelName of modelosParaTestar) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: planoSemanalSchema,
            temperature: 0.7
          }
        });

        result = await model.generateContent(promptTexto);
        if (result && result.response) {
          break;
        }
      } catch (errModel) {
        ultimoErro = errModel;
        console.warn(`Tentativa com modelo ${modelName} falhou:`, errModel.message);
      }
    }

    if (!result || !result.response) {
      throw ultimoErro || new Error('Falha ao gerar resposta com modelos Gemini disponíveis.');
    }

    const responseText = result.response.text();

    // Validação com try/catch e sanitização de possíveis formatações
    let parsedData = null;
    try {
      // Limpeza de possíveis caracteres ou tags se houver
      const cleaned = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      parsedData = JSON.parse(cleaned);
    } catch (errParse) {
      console.error('Erro ao parsear JSON da IA Gemini:', errParse, 'Texto bruto:', responseText);
      throw new Error('A IA não retornou um formato JSON válido.');
    }

    // Validar estrutura básica do plano_semanal
    if (!parsedData || !Array.isArray(parsedData.plano_semanal) || parsedData.plano_semanal.length === 0) {
      throw new Error('A resposta gerada pela IA não contém a estrutura de dias e refeições esperada.');
    }

    // Normalizar dias e garantir 5 opções por refeição
    const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const planoNormalizado = {
      plano_semanal: diasSemana.map((nomeDia, idx) => {
        const diaEncontrado = parsedData.plano_semanal.find(
          d => d.dia && d.dia.toLowerCase().includes(nomeDia.toLowerCase().split('-')[0])
        ) || parsedData.plano_semanal[idx] || {};

        const refeicoes = diaEncontrado.refeicoes || {};

        const normalizarOpcoes = (opcoes, fallbackNome) => {
          if (Array.isArray(opcoes) && opcoes.length > 0) {
            return opcoes.slice(0, 5).concat(Array(Math.max(0, 5 - opcoes.length)).fill('Opção adicional'));
          }
          return [
            `Opção equilibrada para ${fallbackNome}`,
            `Opção rica em fibras e nutrientes`,
            `Opção proteica e saciante`,
            `Opção leve com frutas ou vegetais`,
            `Opção rápida e prática`
          ];
        };

        return {
          dia: nomeDia,
          refeicoes: {
            cafe_da_manha: normalizarOpcoes(refeicoes.cafe_da_manha, 'Café da Manhã'),
            lanche_manha: normalizarOpcoes(refeicoes.lanche_manha, 'Lanche da Manhã'),
            almoco: normalizarOpcoes(refeicoes.almoco, 'Almoço'),
            lanche_tarde: normalizarOpcoes(refeicoes.lanche_tarde, 'Lanche da Tarde'),
            jantar: normalizarOpcoes(refeicoes.jantar, 'Jantar')
          }
        };
      })
    };

    return res.status(200).json({
      ...planoNormalizado,
      origem: 'gemini_ia'
    });

  } catch (error) {
    console.error('Erro no processamento da rota /api/gerar-plano:', error);
    
    // Tratamento de Resiliência: Se a API falhar ou der timeout, retorna plano fallback seguro
    const { paciente } = req.body || {};
    const planoFallback = gerarPlanoManualFallback(paciente || {});

    return res.status(200).json({
      ...planoFallback,
      origem: 'fallback_resiliencia',
      erroOriginal: error.message || 'Erro de comunicação com o serviço de IA.',
      aviso: 'O plano foi estruturado automaticamente seguindo as diretrizes clínicas de segurança.'
    });
  }
}
