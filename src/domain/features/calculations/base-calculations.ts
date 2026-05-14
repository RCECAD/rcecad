"use server";

/**
 * Fórmulas hidráulicas centralizadas — NBR 9649 / NBR 9648.
 * Todas as funções são puras: mesmo input → mesmo output, sem efeitos colaterais.
 * O motor de cálculo (calculation-engine.ts) usa este módulo como única fonte de verdade.
 */

// ---------------------------------------------------------------------------
// Parâmetros globais do projeto
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Vazões (NBR 9649 §5)
// ---------------------------------------------------------------------------

import type { GlobalParams } from "@/domain/entities/global-params";

/**
 * Vazão doméstica de contribuição do trecho (L/s).
 * Q_d = C × q × P / 86400
 */

export async function domesticFlow(
  initialPopulation: number,
  params: Pick<
    GlobalParams,
    "returnCoefficient" | "perCapitaFlow" | "peakHourlyFactor"
  >,
): Promise<number> {
  return (
    (params.returnCoefficient *
      params.perCapitaFlow *
      initialPopulation *
      params.peakHourlyFactor) /
    86400
  );
}

/**
 * Vazão de infiltração do trecho (L/s).
 * Q_inf = taxa × L / 1000
 */
export async function infiltrationFlow(
  lengthMeters: number,
  params: Pick<GlobalParams, "infiltrationRate">,
): Promise<number> {
  return (params.infiltrationRate * lengthMeters) / 1000;
}

/**
 * Vazão inicial do trecho: contribuição própria + infiltração (L/s).
 */
export async function initialFlow(
  domesticContribution: number,
  infiltration: number,
): Promise<number> {
  return domesticContribution + infiltration;
}

/**
 * Vazão final (de projeto) do trecho (L/s).
 * Q_f = Q_acumulada × K1 × K2
 * Mínimo: 1,5 L/s (NBR 9649 §5.3)
 */
export async function finalFlow(
  accumulatedFlow: number,
  params: Pick<GlobalParams, "peakDailyFactor" | "peakHourlyFactor">,
): Promise<number> {
  const qf = accumulatedFlow * params.peakDailyFactor * params.peakHourlyFactor;
  return Math.max(qf, 1.5);
}

// ---------------------------------------------------------------------------
// Hidráulica — seção circular (Manning)
// ---------------------------------------------------------------------------

/**
 * Capacidade a seção plena (m³/s).
 * Q_plena = (1/n) × A × R^(2/3) × S^(1/2)
 * onde A = π D²/4, R = D/4
 */
export async function fullSectionFlow(
  diameterMeters: number,
  slope: number,
  manning: number,
): Promise<number> {
  const area = (Math.PI * diameterMeters ** 2) / 4;
  const hydraulicRadius = diameterMeters / 4;
  return (1 / manning) * area * hydraulicRadius ** (2 / 3) * Math.sqrt(slope);
}

/**
 * Velocidade a seção plena (m/s).
 * V_plena = Q_plena / A
 */
export async function fullSectionVelocity(
  diameterMeters: number,
  slope: number,
  manning: number,
): Promise<number> {
  const area = (Math.PI * diameterMeters ** 2) / 4;
  return (await fullSectionFlow(diameterMeters, slope, manning)) / area;
}

/**
 * Tensão trativa (Pa).
 * τ = γ × R × S    (γ_água = 9810 N/m³)
 * NBR 9649 exige τ ≥ 1,0 Pa
 */
export async function tractiveTension(
  diameterMeters: number,
  slope: number,
): Promise<number> {
  const hydraulicRadius = diameterMeters / 4;
  return 9810 * hydraulicRadius * slope;
}

/**
 * Declividade mínima pelo critério de tensão trativa (m/m).
 * S_min = 1,0 / (γ × R)    → τ = 1,0 Pa
 */
export async function minimumSlopeByCriticalTension(
  diameterMeters: number,
): Promise<number> {
  const hydraulicRadius = diameterMeters / 4;
  return 1.0 / (9810 * hydraulicRadius);
}

// ---------------------------------------------------------------------------
// Lâmina d'água (razão y/D)
// ---------------------------------------------------------------------------

/**
 * Razão de lâmina y/D para uma dada razão Q/Q_plena.
 * Aproximação iterativa (seção circular não tem forma fechada).
 * Retorna valor entre 0 e 1.
 */
export async function waterDepthRatio(flowRatio: number): Promise<number> {
  if (flowRatio <= 0) return 0;
  if (flowRatio >= 1) return 1;

  let yD = 0.5;
  for (let i = 0; i < 50; i++) {
    const theta = 2 * Math.acos(1 - 2 * yD);
    const area = (theta - Math.sin(theta)) / 8;
    const perimeter = theta / 2;
    const r = area / perimeter;
    const q = area * r ** (2 / 3); // normalizado: Q / (Q_plena × n × D^(8/3) × S^(1/2))
    const qFull = (Math.PI / 4) * (1 / 4) ** (2 / 3);
    const ratio = q / qFull;
    if (Math.abs(ratio - flowRatio) < 1e-6) break;
    yD += (flowRatio - ratio) * 0.3;
    yD = Math.max(0.01, Math.min(0.99, yD));
  }
  return yD;
}

// ---------------------------------------------------------------------------
// Seleção de diâmetro comercial
// ---------------------------------------------------------------------------

const COMMERCIAL_DIAMETERS_MM = [
  100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800,
] as const;

/**
 * Menor diâmetro comercial (mm) que atende Q_f com lâmina ≤ 75% (NBR 9649 §5.4).
 * Retorna null se nenhum diâmetro for suficiente.
 */
export async function selectDiameter(
  designFlowLps: number,
  slope: number,
  manning: number,
  maxDepthRatio = 0.75,
): Promise<number | null> {
  const qMs = designFlowLps / 1000;

  for (const diamMm of COMMERCIAL_DIAMETERS_MM) {
    const d = diamMm / 1000;
    const qFull = await fullSectionFlow(d, slope, manning);
    const ratio = qMs / qFull;
    if (ratio <= maxDepthRatio) return diamMm;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Verificações NBR 9649
// ---------------------------------------------------------------------------

export type VerificationResult = {
  passesMinSlope: boolean;
  passesMaxDepth: boolean;
  passesMinVelocity: boolean;
  tractiveTensionPa: Promise<number>;
  depthRatio: Promise<number>;
  fullVelocityMs: Promise<number>;
};

/**
 * Verifica se o trecho atende aos critérios da NBR 9649.
 * Centraliza todas as verificações normativas em um único resultado.
 */
export async function verifySegment(
  diameterMeters: number,
  slope: number,
  designFlowLps: number,
  manning: number,
): Promise<VerificationResult> {
  const qFull = await fullSectionFlow(diameterMeters, slope, manning);
  const ratio = designFlowLps / 1000 / qFull;
  const yD = waterDepthRatio(ratio);
  const tau = tractiveTension(diameterMeters, slope);
  const vFull = fullSectionVelocity(diameterMeters, slope, manning);
  const sMin = await minimumSlopeByCriticalTension(diameterMeters);

  return {
    passesMinSlope: slope >= sMin,
    passesMaxDepth: (await yD) <= 0.75,
    passesMinVelocity: (await vFull) >= 0.6, // NBR 9649 §5.5 — V mínima 0,6 m/s
    tractiveTensionPa: tau,
    depthRatio: yD,
    fullVelocityMs: vFull,
  };
}
