export const quantityLabels: Record<string, string> = {
  initialDischarge: "Vazão inicial (Qi)",
  finalDischarge: "Vazão final (Qf)",
  initialVelocity: "Velocidade inicial",
  finalVelocity: "Velocidade final",
  initialDepthRatio: "Lâmina inicial (Y/D)",
  finalDepthRatio: "Lâmina final (Y/D)",
  initialWaterLevel: "Nível d'água inicial",
  finalWaterLevel: "Nível d'água final",
  tractiveTension: "Tensão trativa (τ)",
  referenceTractiveTension: "Tensão trativa de referência",
  peakConveyance: "Capacidade de condução",
  manningN: "Coeficiente de Manning (n)",
};

export const parameterLabels: Record<string, string> = {
  returnCoefficient: "Coeficiente de retorno",
  peakDailyFactor: "Fator de pico diário (K1)",
  peakHourlyFactor: "Fator de pico horário (K2)",
  perCapitaFlow: "Consumo per capita",
  infiltrationRate: "Taxa de infiltração",
  minimumDesignDischarge: "Vazão mínima de projeto",
  initialPopulation: "População inicial",
  finalPopulation: "População final",
};

export const limitLabels: Record<string, string> = {
  minimumCover: "Recobrimento mínimo",
  segmentDiameter: "Diâmetro",
  segmentSlope: "Declividade",
};

export const unitLabel = (unit: string) =>
  unit === "dimensionless" ? "" : unit;

export const label = (labels: Record<string, string>, key: string) =>
  labels[key] ?? key;
