/**
 * Módulo de Fórmulas e Cálculos Clínicos Nutricionais
 * Suporte a TMB (Mifflin-St Jeor, Harris-Benedict, Katch-McArdle),
 * GET (TDEE), VET (Meta Calórica) e Distribuição de Macros (g/kg, kcal, %).
 */

export function calcularIdade(dataNasc) {
  if (!dataNasc) return 30; // fallback padrão
  const birth = new Date(dataNasc);
  if (isNaN(birth.getTime())) return 30;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : 30;
}

/**
 * Fatores de Atividade Física (FA)
 */
export const FATORES_ATIVIDADE = {
  'Sedentário': 1.2,
  'Levemente ativo': 1.375,
  'Moderadamente ativo': 1.55,
  'Muito ativo': 1.725,
  'Extremamente ativo': 1.9
};

/**
 * Calcula a Taxa Metabólica Basal (TMB / BMR)
 * @param {Object} params - { peso, altura, idade, sexo, percentualGordura }
 * @param {string} formula - 'mifflin' | 'harris' | 'katch'
 */
export function calcularTMB({ peso, altura, idade, sexo, percentualGordura }, formula = 'mifflin') {
  const p = parseFloat(peso) || 70;
  const a = parseFloat(altura) || (altura < 3 ? altura * 100 : 170); // garante em cm
  const id = parseInt(idade, 10) || 30;
  const isMasc = String(sexo).toLowerCase().startsWith('m');

  if (formula === 'katch' && percentualGordura) {
    const fatPercent = parseFloat(percentualGordura);
    if (!isNaN(fatPercent) && fatPercent > 0 && fatPercent < 60) {
      const massaMagra = p * (1 - fatPercent / 100);
      return Math.round(370 + 21.6 * massaMagra);
    }
  }

  if (formula === 'harris') {
    // Harris-Benedict revisada (Roza & Shizgal, 1984)
    if (isMasc) {
      return Math.round(88.362 + 13.397 * p + 4.799 * a - 5.677 * id);
    } else {
      return Math.round(447.593 + 9.247 * p + 3.098 * a - 4.330 * id);
    }
  }

  // Padrão Ouro: Mifflin-St Jeor (1990)
  if (isMasc) {
    return Math.round(10 * p + 6.25 * a - 5 * id + 5);
  } else {
    return Math.round(10 * p + 6.25 * a - 5 * id - 161);
  }
}

/**
 * Calcula o Gasto Energético Total (GET / TDEE)
 */
export function calcularGET(tmb, nivelAtividade = 'Moderadamente ativo') {
  const fator = FATORES_ATIVIDADE[nivelAtividade] || 1.55;
  return Math.round(tmb * fator);
}

/**
 * Calcula o Valor Energético Total Planejado (VET / Meta Calórica)
 */
export function calcularVET(get, estrategia = 'manutencao', ajustePersonalizado = 0) {
  switch (estrategia) {
    case 'deficit_leve':
      return Math.round(get - 300);
    case 'deficit_moderado':
      return Math.round(get - 500);
    case 'deficit_intenso':
      return Math.round(get - 750);
    case 'superavit_leve':
      return Math.round(get + 300);
    case 'superavit_moderado':
      return Math.round(get + 500);
    case 'personalizado':
      return Math.round(ajustePersonalizado > 0 ? ajustePersonalizado : get);
    case 'manutencao':
    default:
      return Math.round(get);
  }
}

/**
 * Distribui os Macronutrientes com base no VET e no Peso do paciente
 */
export function calcularMacronutrientes({ vet, peso, proteinaGKg = 2.0, gorduraPercentual = 25 }) {
  const p = parseFloat(peso) || 70;
  const metaVet = parseFloat(vet) || 2000;
  const protGKg = parseFloat(proteinaGKg) || 2.0;
  const gordPct = parseFloat(gorduraPercentual) || 25;

  // 1. Proteínas (4 kcal/g)
  const proteinaG = Math.round(p * protGKg);
  const proteinaKcal = Math.round(proteinaG * 4);
  const proteinaPct = Math.round((proteinaKcal / metaVet) * 100);

  // 2. Gorduras (9 kcal/g)
  const gorduraKcal = Math.round((metaVet * gordPct) / 100);
  const gorduraG = Math.round(gorduraKcal / 9);
  const gorduraGKg = parseFloat((gorduraG / p).toFixed(2));
  const gorduraPct = Math.round(gordPct);

  // 3. Carboidratos (4 kcal/g) - Restante do VET
  const carboidratoKcal = Math.max(0, Math.round(metaVet - (proteinaKcal + gorduraKcal)));
  const carboidratoG = Math.round(carboidratoKcal / 4);
  const carboidratoGKg = parseFloat((carboidratoG / p).toFixed(2));
  const carboidratoPct = Math.max(0, 100 - (proteinaPct + gorduraPct));

  // 4. Meta de Água (35 ml / kg)
  const aguaLitros = parseFloat(((p * 35) / 1000).toFixed(1));

  return {
    vet: metaVet,
    proteina: {
      gramas: proteinaG,
      kcal: proteinaKcal,
      percentual: proteinaPct,
      gKg: protGKg
    },
    gordura: {
      gramas: gorduraG,
      kcal: gorduraKcal,
      percentual: gorduraPct,
      gKg: gorduraGKg
    },
    carboidrato: {
      gramas: carboidratoG,
      kcal: carboidratoKcal,
      percentual: carboidratoPct,
      gKg: carboidratoGKg
    },
    aguaLitros
  };
}
