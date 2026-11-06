import type { CalculationMemorial } from "@/api/contracts/resources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formulaSourceLabel,
  presentExpression,
  rulesetLabel,
} from "@/lib/memorial-presentation";
import { label, limitLabels, quantityLabels, unitLabel } from "./design-labels";

type Formula = CalculationMemorial["formulas"][number];
export type MemorialSegment = CalculationMemorial["segments"][number];

const FORMULAS_ID = "memorial-formulas";

// Fragment navigation does not reliably open a closed <details>.
function openFormulas() {
  const formulas = document.getElementById(FORMULAS_ID);
  if (formulas instanceof HTMLDetailsElement) formulas.open = true;
}

const show = (value: unknown) =>
  typeof value === "number"
    ? value.toLocaleString("pt-BR", { maximumFractionDigits: 6 })
    : String(value);

function withOffsets(parts: string[]) {
  let offset = 0;
  return parts.map((text) => {
    const part = { text, offset };
    offset += text.length + 1;
    return part;
  });
}

function ExpressionText({ text }: { text: string }) {
  // Display atomic exponents and symbol indices without changing the calculation.
  return withOffsets(
    text.split(/(\^\([^()]+\)|\^[+-]?\d+(?:,\d+)?|_[\p{L}\d,]+)/u),
  ).map(({ text: part, offset }) =>
    part.startsWith("^") ? (
      <sup key={offset}>{part.slice(1).replace(/^\((.*)\)$/, "$1")}</sup>
    ) : part.startsWith("_") ? (
      <sub key={offset}>{part.slice(1)}</sub>
    ) : (
      part
    ),
  );
}

function FormulaDetails({ formula }: { formula: Formula }) {
  const expression = presentExpression(formula.expression);
  return (
    <article
      id={`formula-${formula.id}`}
      className="min-w-0 scroll-mt-6 rounded-lg border bg-background p-4 target:ring-2 target:ring-primary/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-medium">
          <span className="mr-2 rounded bg-primary/10 px-2 py-1 text-xs text-primary">
            {formula.id}
          </span>
          {label(quantityLabels, formula.key)}
        </h3>
        <p className="max-w-lg text-sm text-muted-foreground">
          {formulaSourceLabel(formula.sourceId, formula.reference)}
        </p>
      </div>
      <ol
        aria-label={`Etapas da fórmula ${formula.id}`}
        className="mt-4 space-y-3"
      >
        {withOffsets(expression.steps).map(({ text: step, offset }, index) => (
          <li
            key={offset}
            className="flex min-w-0 items-baseline gap-3 rounded-md bg-muted/40 px-3 py-2"
          >
            <span
              aria-hidden="true"
              className="shrink-0 text-xs text-muted-foreground"
            >
              {index + 1}.
            </span>
            <p className="min-w-0 whitespace-pre-wrap break-words font-mono text-sm leading-7 [overflow-wrap:anywhere]">
              <ExpressionText text={step} />
            </p>
          </li>
        ))}
      </ol>
      {expression.variables.length > 0 && (
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
          {expression.variables.map((variable) => (
            <div key={variable.symbol} className="min-w-0">
              <dt className="font-mono">
                <ExpressionText text={variable.symbol} />
              </dt>
              <dd className="text-muted-foreground">{variable.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
      <details className="mt-4 border-t pt-3 text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer">
          Expressão original e identificação técnica
        </summary>
        <pre className="mt-3 whitespace-pre-wrap break-words font-mono leading-6 [overflow-wrap:anywhere]">
          {formula.expression}
        </pre>
        <p className="mt-2">
          Referência original: {formula.reference} · Fonte: {formula.sourceId}
        </p>
      </details>
    </article>
  );
}

export function MemorialTrace({ memorial }: { memorial: CalculationMemorial }) {
  return (
    <section aria-label="Memorial de cálculo" className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Memorial gerado em{" "}
        {new Date(memorial.generatedAt).toLocaleString("pt-BR")} ·{" "}
        {rulesetLabel(memorial.rulesetVersion)}
      </p>
      <details id={FORMULAS_ID} className="group rounded-xl border bg-card p-4">
        <summary className="cursor-pointer font-medium">
          Fórmulas aplicadas ({memorial.formulas.length})
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Consulte as etapas do cálculo e o significado das variáveis.
          </span>
        </summary>
        <div className="mt-4 space-y-4">
          {memorial.formulas.map((formula) => (
            <FormulaDetails key={formula.id} formula={formula} />
          ))}
        </div>
      </details>
      {memorial.appliedContributions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contribuições singulares aplicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {memorial.appliedContributions.map((item) => (
                <li key={item.id}>
                  {item.name} · {item.targetCode} → trecho{" "}
                  {item.injectedSegmentCode} · {show(item.initialLps)} /{" "}
                  {show(item.finalLps)} L/s
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

/** Limits resolved for one segment and the formula behind each quantity. */
export function SegmentMemorial({
  segment,
  formulas,
  hasFormulaLinks = false,
}: {
  segment: MemorialSegment;
  formulas: Formula[];
  hasFormulaLinks?: boolean;
}) {
  const byId = new Map(formulas.map((formula) => [formula.id, formula]));
  const bound = (value: MemorialSegment["limits"][number]["lowerBound"]) =>
    value ? `${show(value.value)} (${value.sourceIds.join(", ")})` : "—";
  return (
    <div className="space-y-3">
      {segment.limits.length > 0 && (
        <Table aria-label={`Limites do trecho ${segment.code}`}>
          <TableHeader>
            <TableRow>
              {[
                "Limite",
                "Mínimo (fonte)",
                "Máximo (fonte)",
                "Valores admitidos",
              ].map((text) => (
                <TableHead key={text}>{text}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {segment.limits.map((limit) => (
              <TableRow key={limit.key}>
                <TableCell>
                  {label(limitLabels, limit.key)}
                  {unitLabel(limit.unit) && ` (${unitLabel(limit.unit)})`}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {bound(limit.lowerBound)}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {bound(limit.upperBound)}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {limit.allowedValues?.map(show).join(", ") ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
        {segment.quantities.map((quantity) => {
          const formula = byId.get(quantity.formulaId);
          return (
            <div key={quantity.key}>
              <dt className="text-muted-foreground">
                {label(quantityLabels, quantity.key)}
              </dt>
              <dd>
                {show(quantity.value)} {unitLabel(quantity.unit)}{" "}
                {hasFormulaLinks ? (
                  <a
                    href={`#formula-${quantity.formulaId}`}
                    title={
                      formula
                        ? `Consultar ${quantity.formulaId}: ${label(quantityLabels, formula.key)}`
                        : `Consultar fórmula ${quantity.formulaId}`
                    }
                    className="text-xs text-primary underline"
                    onClick={openFormulas}
                  >
                    {quantity.formulaId}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {quantity.formulaId}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
