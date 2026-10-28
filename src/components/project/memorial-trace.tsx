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
import { label, limitLabels, quantityLabels, unitLabel } from "./design-labels";

type Formula = CalculationMemorial["formulas"][number];
export type MemorialSegment = CalculationMemorial["segments"][number];

const show = (value: unknown) =>
  typeof value === "number"
    ? value.toLocaleString("pt-BR", { maximumFractionDigits: 6 })
    : String(value);

export function MemorialTrace({ memorial }: { memorial: CalculationMemorial }) {
  return (
    <section aria-label="Memorial de cálculo" className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Memorial gerado em{" "}
        {new Date(memorial.generatedAt).toLocaleString("pt-BR")} · regras{" "}
        {memorial.rulesetVersion}
      </p>
      <details className="group rounded-xl border bg-card p-4">
        <summary className="cursor-pointer font-medium">
          Fórmulas aplicadas ({memorial.formulas.length})
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Cada grandeza dos trechos aponta para o ID da fórmula.
          </span>
        </summary>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                {["ID", "Grandeza", "Expressão", "Referência"].map((text) => (
                  <TableHead key={text}>{text}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {memorial.formulas.map((formula) => (
                <TableRow key={formula.id} id={`formula-${formula.id}`}>
                  <TableCell>{formula.id}</TableCell>
                  <TableCell>{label(quantityLabels, formula.key)}</TableCell>
                  <TableCell className="min-w-80 whitespace-normal">
                    <div className="max-h-20 overflow-auto break-all font-mono text-xs">
                      {formula.expression}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-56 whitespace-normal text-xs">
                    {formula.reference} ({formula.sourceId})
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
}: {
  segment: MemorialSegment;
  formulas: Formula[];
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
                <a
                  href={`#formula-${quantity.formulaId}`}
                  title={formula?.expression}
                  className="text-xs text-primary underline"
                >
                  {quantity.formulaId}
                </a>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
