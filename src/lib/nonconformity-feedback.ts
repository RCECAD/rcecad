import type { Nonconformity } from "@/api/contracts/design";
import { ruleDescriptions } from "@/lib/project-feedback";

export const parameterLabels: Record<string, string> = {
  returnCoefficient: "Coeficiente de retorno",
  peakDailyFactor: "Fator de pico diário (K1)",
  peakHourlyFactor: "Fator de pico horário (K2)",
  perCapitaFlow: "Consumo per capita",
  infiltrationRate: "Taxa de infiltração",
  initialPopulation: "População inicial",
  finalPopulation: "População final",
  manningCoefficient: "Coeficiente de Manning (n)",
};

const technicalGuidance: Record<
  string,
  { label: string; description: string }
> = {
  MANNING_N_NOT_JUSTIFIED: {
    label: "Justificativa do coeficiente de Manning",
    description:
      "O coeficiente de Manning adotado é diferente de 0,013. É necessário justificar os critérios usados para a tensão trativa e a declividade mínima (item 5.1.4.1 da norma de referência).",
  },
};

const parameterUnits: Record<string, string> = {
  perCapitaFlow: "L/hab·dia",
  infiltrationRate: "L/s·km",
  initialPopulation: "hab",
  finalPopulation: "hab",
};
const numericPattern = "[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:[eE][+-]?\\d+)?";
const numericValue = new RegExp(`^${numericPattern}$`);
const boundPattern = new RegExp(
  `^(>=|<=|>|<|=|≥|≤)\\s*(${numericPattern})(?:\\s+\\(([^)]+)\\))?$`,
);
const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumSignificantDigits: 15,
});

function formatValue(value: string, unit: string): string {
  if (!numericValue.test(value.trim()) || !Number.isFinite(Number(value))) {
    return value;
  }
  return [numberFormatter.format(Number(value)), unit]
    .filter(Boolean)
    .join(" ");
}

function presentLimit(value: string | null, unit: string) {
  if (!value) return { value: null, references: [] as string[] };

  // Only simplify complete, recognized bounds; other engine formats stay intact.
  const bounds = value.split(/\s+e\s+/).map((part) => {
    const match = part.trim().match(boundPattern);
    return match
      ? {
          operator: match[1].replace(">=", "≥").replace("<=", "≤"),
          value: match[2],
          reference: match[3],
        }
      : null;
  });
  if (bounds.some((bound) => bound === null)) {
    return { value: formatValue(value, unit), references: [] as string[] };
  }

  const parsed = bounds.filter((bound) => bound !== null);
  const references = [
    ...new Set(
      parsed.flatMap((bound) => (bound.reference ? [bound.reference] : [])),
    ),
  ];
  const [lower, upper] = parsed;
  if (parsed.length === 2 && lower.operator === "≥" && upper.operator === "≤") {
    return {
      value: `${formatValue(lower.value, "")} a ${formatValue(upper.value, unit)}`,
      references,
    };
  }
  return {
    value: parsed
      .map((bound) => `${bound.operator} ${formatValue(bound.value, unit)}`)
      .join(" e "),
    references,
  };
}

export function nonconformityFeedback(item: Nonconformity) {
  const isDomain = item.ruleCode === "DOMAIN_VALUE_MISMATCH";
  // The parameter can still be identified when the optional subject is absent.
  const subject =
    item.subject ??
    (isDomain ? item.description.match(/\bpara (\w+),/)?.[1] : undefined);
  const parameter = subject ? parameterLabels[subject] : undefined;
  const unit = subject ? (parameterUnits[subject] ?? "") : "";
  const limit = presentLimit(item.expectedLimit, unit);
  const observedValue =
    item.observedValue === null ? null : formatValue(item.observedValue, unit);
  const adoptedFrom = isDomain
    ? item.description.match(/,\s*adotado de (.+?),\s*está/)?.[1]
    : undefined;
  const domainExplanation = `${parameter ?? "Parâmetro"}: ${observedValue !== null ? `o valor de ${observedValue}` : "o valor adotado"} está fora ${limit.value ? `da faixa permitida de ${limit.value}` : "dos limites normativos aplicados"}.${adoptedFrom ? ` Valor adotado conforme ${adoptedFrom}.` : ""}${item.waiverJustification ? " Esta ocorrência possui uma exceção aprovada, conforme a justificativa acima." : ""}`;
  const references = [
    ...new Set([
      ...limit.references,
      ...(item.sourceId && !item.sourceId.startsWith("cdre-engine:")
        ? [item.sourceId]
        : []),
    ]),
  ];

  return {
    ruleLabel: isDomain
      ? "Conferência dos limites normativos"
      : (technicalGuidance[item.ruleCode]?.label ??
        ruleDescriptions[item.ruleCode]?.replace(/\.$/, "") ??
        item.ruleCode),
    sourceLabel:
      item.sourceId === "cdre-engine:check-generico"
        ? "Verificação automática do cálculo hidráulico (CDRE)"
        : item.sourceId.startsWith("cdre-engine:")
          ? "Motor de cálculo hidráulico CDRE"
          : item.sourceId,
    parameterLabel: parameter ?? subject ?? null,
    technicalDescription: isDomain
      ? domainExplanation
      : (technicalGuidance[item.ruleCode]?.description ?? item.description),
    title: isDomain
      ? `${parameter ?? "Parâmetro"} fora da faixa permitida`
      : (ruleDescriptions[item.ruleCode]?.replace(/\.$/, "") ??
        "Ocorrência no dimensionamento"),
    description: isDomain
      ? item.waiverJustification
        ? "Esta ocorrência possui uma exceção aprovada. Consulte a justificativa e as referências normativas abaixo."
        : parameter
          ? "Revise o valor informado nos dados hidráulicos do projeto e calcule novamente."
          : "Revise o parâmetro informado e os limites das normas aplicadas ao projeto."
      : ruleDescriptions[item.ruleCode]
        ? null
        : item.description,
    observedValue,
    expectedLimit: limit.value,
    limitLabel: isDomain ? "Faixa permitida" : "Limite esperado",
    references,
  };
}
