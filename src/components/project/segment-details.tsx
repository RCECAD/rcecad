import {
  type AdoptedParameter,
  isCalculated,
  type Nonconformity,
  type SegmentDesign,
} from "@/api/contracts/design";
import type { CalculationMemorial } from "@/api/contracts/resources";
import {
  label,
  parameterLabels,
  quantityLabels,
  unitLabel,
} from "./design-labels";
import { type MemorialSegment, SegmentMemorial } from "./memorial-trace";

export const designStatusLabels = {
  designed: "Dimensionado",
  verified: "Verificado (DN imposto)",
  conflicted: "Conflito de regras",
  infeasible: "Inviável",
  notEvaluated: "Bloqueado a montante",
} as const;
export function quantityValue(
  segment: SegmentDesign,
  key: string,
): number | undefined {
  return isCalculated(segment)
    ? segment.quantities.find((quantity) => quantity.key === key)?.value
    : undefined;
}
export const format = (value: number | undefined, digits = 4) =>
  value === undefined
    ? "—"
    : value.toLocaleString("pt-BR", { maximumFractionDigits: digits });
const severityLabels = {
  CRITICAL: "Crítica",
  WARNING: "Alerta",
  INFO: "Informação",
};

export function AdoptedParameters({ items }: { items: AdoptedParameter[] }) {
  return (
    <dl className="grid gap-x-4 gap-y-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.key}>
          <dt className="text-xs text-muted-foreground">
            {label(parameterLabels, item.key)}
          </dt>
          <dd className="mt-1 text-sm">
            {format(item.value, 6)} {unitLabel(item.unit)}
            <span className="block text-xs text-muted-foreground">
              {item.projectSupplied ? "Informado no projeto" : item.origin}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Findings({ items }: { items: Nonconformity[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={JSON.stringify(item)}
          className="rounded-md border p-3 text-sm"
        >
          <p className="font-medium">
            {severityLabels[item.severity]} · {item.ruleCode}
          </p>
          <p>{item.description}</p>
          <p className="text-muted-foreground">Fonte: {item.sourceId}</p>
          {item.observedValue !== null && (
            <p>Valor observado: {item.observedValue}</p>
          )}
          {item.expectedLimit !== null && (
            <p>Limite esperado: {item.expectedLimit}</p>
          )}
          {item.waiverJustification && (
            <p>Justificativa: {item.waiverJustification}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function Quantities({
  items,
}: {
  items: { key: string; unit: string; value: number }[];
}) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
      {items.map((quantity) => (
        <div key={quantity.key}>
          <dt className="text-muted-foreground">
            {label(quantityLabels, quantity.key)}
          </dt>
          <dd>
            {format(quantity.value, 6)} {unitLabel(quantity.unit)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function SegmentDetails({
  segment,
  expanded,
  memorial,
}: {
  segment: SegmentDesign;
  expanded?: boolean;
  memorial?: CalculationMemorial;
}) {
  const traced: MemorialSegment | undefined = memorial?.segments.find(
    (item) => item.segmentId === segment.segmentId,
  );
  return (
    <details
      id={`result-${segment.segmentId}`}
      open={expanded}
      className="rounded-lg border p-4 scroll-mt-6"
    >
      <summary className="cursor-pointer font-medium">
        {segment.segmentCode} · {designStatusLabels[segment.status]}
      </summary>
      <div className="mt-4 space-y-4">
        {segment.justifications.map((text) => (
          <p key={text} className="text-sm">
            {text}
          </p>
        ))}
        {isCalculated(segment) && (
          <>
            <p className="text-sm">
              DN {segment.choice.diameterMm} mm
              {segment.choice.diameterImposed ? " (imposto)" : ""} ·{" "}
              {segment.choice.material} · declividade{" "}
              {format(segment.choice.slope, 6)} m/m · cota de montante{" "}
              {format(segment.choice.upstreamInvertM)} m · degrau a montante{" "}
              {format(segment.choice.upstreamDropM, 3)} m
            </p>
            {traced && memorial ? (
              <SegmentMemorial segment={traced} formulas={memorial.formulas} />
            ) : (
              <Quantities items={segment.quantities} />
            )}
            {segment.nonconformities.length > 0 ? (
              <Findings items={segment.nonconformities} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma ocorrência normativa neste trecho.
              </p>
            )}
          </>
        )}
        {segment.status === "conflicted" && (
          <ul className="space-y-2 text-sm">
            {segment.conflicts.map((conflict) => (
              <li key={conflict.subject}>
                <strong>{conflict.subject}</strong>: {conflict.reason}
                <p>Fontes: {conflict.conflictingSources.join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
        {segment.status === "notEvaluated" && (
          <>
            <p>{segment.reason}</p>
            <p className="text-sm">
              Resolva os trechos a montante:{" "}
              {segment.blockedBy.map((id, index) => (
                <a
                  key={id}
                  className="mr-2 text-primary underline"
                  href={`#result-${id}`}
                >
                  {segment.blockedByCodes[index] ?? id}
                </a>
              ))}
            </p>
          </>
        )}
        {segment.status === "infeasible" && (
          <div className="space-y-4">
            <p>Nenhum candidato foi aceito. Confira as tentativas:</p>
            {segment.attempts.map((attempt) => (
              <details
                key={`${attempt.choice.diameterMm}-${attempt.choice.slope}`}
                className="rounded-md border p-3"
              >
                <summary className="cursor-pointer text-sm">
                  DN {attempt.choice.diameterMm} mm ·{" "}
                  {format(attempt.choice.slope, 6)} m/m
                </summary>
                <div className="mt-3 space-y-3">
                  <Findings items={attempt.blocking} />
                  <Quantities items={attempt.quantities} />
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
