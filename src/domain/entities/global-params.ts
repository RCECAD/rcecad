export type GlobalParams = {
  initialPopulation: number;
  finalPopulation: number;
  returnCoefficient: number; // C — coeficiente de retorno (adimensional, 0–1)
  perCapitaFlow: number; // q — consumo per capita (L/hab·dia)
  infiltrationRate: number; // taxa de infiltração (L/s·km)
  peakDailyFactor: number; // K1 — coeficiente de variação diária
  peakHourlyFactor: number; // K2 — coeficiente de variação horária
  manningCoefficient: number; // n — coeficiente de Manning padrão do projeto
};
