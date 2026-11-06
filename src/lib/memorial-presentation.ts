const variables: Record<string, { symbol: string; meaning: string }> = {
  diameterMm: { symbol: "D_mm", meaning: "Diâmetro da tubulação, em mm" },
  slope: { symbol: "I", meaning: "Declividade, em m/m" },
  lengthM: { symbol: "L", meaning: "Comprimento do trecho, em m" },
  infiltrationRate: {
    symbol: "T_inf",
    meaning: "Taxa de infiltração, em L/s por km",
  },
  infiltration: { symbol: "Q_inf", meaning: "Vazão de infiltração, em L/s" },
  Ltotal: { symbol: "L_total", meaning: "Comprimento total da rede, em m" },
  initialPopulation: { symbol: "P_i", meaning: "População inicial" },
  finalPopulation: { symbol: "P_f", meaning: "População final" },
  perCapitaFlow: {
    symbol: "q_pc",
    meaning: "Consumo de água por habitante, em L/hab.dia",
  },
  returnCoefficient: { symbol: "C", meaning: "Coeficiente de retorno" },
  peakDailyFactor: { symbol: "K₁", meaning: "Fator de pico diário" },
  peakHourlyFactor: { symbol: "K₂", meaning: "Fator de pico horário" },
  Qbar: { symbol: "Q_dom", meaning: "Vazão doméstica de projeto, em L/s" },
  rate: {
    symbol: "q_dist",
    meaning: "Vazão distribuída por comprimento, em L/s por m",
  },
  accumulatedLength: {
    symbol: "L_acum",
    meaning: "Comprimento acumulado a montante, em m",
  },
  singular: {
    symbol: "Q_sing",
    meaning: "Contribuições singulares acumuladas, em L/s",
  },
  initialSingularContributionLps: {
    symbol: "Q_sing,i",
    meaning: "Contribuição singular inicial, em L/s",
  },
  finalSingularContributionLps: {
    symbol: "Q_sing,f",
    meaning: "Contribuição singular final, em L/s",
  },
  initialLps: {
    symbol: "Q_i",
    meaning: "Vazão inicial da contribuição, em L/s",
  },
  finalLps: { symbol: "Q_f", meaning: "Vazão final da contribuição, em L/s" },
  minimumDesignDischarge: {
    symbol: "Q_mín",
    meaning: "Vazão mínima de projeto, em L/s",
  },
  floor: {
    symbol: "Q_mín",
    meaning: "Vazão mínima aplicada ao trecho, em L/s",
  },
  upstreamInvertM: {
    symbol: "Z_mont",
    meaning: "Cota de fundo a montante, em m",
  },
  initialWaterLevel: { symbol: "NA_i", meaning: "Nível d’água inicial, em m" },
  finalWaterLevel: { symbol: "NA_f", meaning: "Nível d’água final, em m" },
  initialDepthRatio: {
    symbol: "(Y/D)_i",
    meaning: "Relação entre lâmina e diâmetro no início do plano",
  },
  finalDepthRatio: {
    symbol: "(Y/D)_f",
    meaning: "Relação entre lâmina e diâmetro no fim do plano",
  },
};

export function rulesetLabel(version: string) {
  const baseline = /^nbr-baseline-(\d+)$/.exec(version);
  return baseline
    ? `Critérios normativos NBR · versão ${baseline[1]}`
    : `Conjunto de critérios: ${version}`;
}

export function justificationLabel(text: string) {
  return text.replace(
    "infiltration override applied: the whole network is guaranteed PVC, including declared segment materials and the switch target.",
    "Taxa de infiltração ajustada automaticamente: toda a rede foi identificada como PVC, considerando os materiais informados nos trechos e o material de destino configurado para a troca.",
  );
}

export function formulaSourceLabel(sourceId: string, reference: string) {
  if (sourceId === "com.cdre.engine") return "Motor de cálculo hidráulico CDRE";
  if (sourceId === "rcecad.water-level")
    return "Cálculo do nível d’água a partir da cota de fundo e da lâmina relativa";
  if (reference === sourceId || reference.includes(sourceId)) return reference;
  return reference || sourceId;
}

export function presentExpression(expression: string) {
  const used = new Set<string>();
  const translated = expression
    .replaceAll(
      "floor applied after accumulation per segment, never propagated upstream or downstream",
      "A vazão mínima é aplicada após a acumulação em cada trecho, sem ser propagada para montante ou jusante",
    )
    .replaceAll(
      "contributions injected into s",
      "contribuições lançadas no trecho s",
    )
    .replaceAll("if absent", "quando não informado")
    .replace(/\bupstream\b/g, "montante")
    .replace(/\bdownstream\b/g, "jusante")
    .replace(/\binitial\b/g, "iniciais")
    .replace(/\bfinal\b/g, "finais")
    .replace(/\b[A-Za-z_][A-Za-z_0-9]*\b/g, (token) => {
      if (variables[token]) {
        used.add(token);
        return variables[token].symbol;
      }
      return (
        ({ max: "máx", min: "mín", acos: "arccos" } as Record<string, string>)[
          token
        ] ?? token
      );
    })
    .replace(/\b(\d+)\.(\d+)\b/g, "$1,$2")
    .replace(/\s*\*\s*/g, " × ");
  return {
    steps: translated
      .split(/;\s*/)
      .map((step) => step.trim())
      .filter(Boolean),
    variables: [
      ...new Map(
        [...used].map((key) => [variables[key].symbol, variables[key]]),
      ).values(),
    ],
  };
}
