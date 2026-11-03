import { CircleX, Info, TriangleAlert } from "lucide-react";
import type { Nonconformity } from "@/api/contracts/design";
import { Badge } from "@/components/ui/badge";
import { nonconformityFeedback } from "@/lib/nonconformity-feedback";

const severities = {
  CRITICAL: {
    label: "Crítica",
    Icon: CircleX,
    style: "bg-destructive/10 text-destructive",
  },
  WARNING: {
    label: "Alerta",
    Icon: TriangleAlert,
    style:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
  },
  INFO: {
    label: "Informação",
    Icon: Info,
    style: "bg-muted text-muted-foreground",
  },
};

export function NonconformityDetails({ item }: { item: Nonconformity }) {
  const feedback = nonconformityFeedback(item);
  const { label, Icon, style } = severities[item.severity];
  const technicalDetails = [
    ["Código da regra", item.ruleCode],
    ["Identificador da fonte", item.sourceId],
    ["Parâmetro", item.subject],
    ["Valor observado (original)", item.observedValue],
    ["Limite esperado (original)", item.expectedLimit],
  ];

  return (
    <div className="flex min-w-0 flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 break-words font-medium">
          {feedback.title}
        </p>
        <Badge variant="outline" className={style}>
          <Icon aria-hidden="true" />
          {label}
        </Badge>
      </div>
      {feedback.description && (
        <p className="break-words text-muted-foreground">
          {feedback.description}
        </p>
      )}
      {(feedback.observedValue !== null || feedback.expectedLimit !== null) && (
        <dl className="grid gap-3 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
          {feedback.observedValue !== null && (
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Valor informado</dt>
              <dd className="mt-1 break-words font-medium tabular-nums">
                {feedback.observedValue}
              </dd>
            </div>
          )}
          {feedback.expectedLimit !== null && (
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">
                {feedback.limitLabel}
              </dt>
              <dd className="mt-1 break-words font-medium tabular-nums">
                {feedback.expectedLimit}
              </dd>
            </div>
          )}
        </dl>
      )}
      {feedback.references.length > 0 && (
        <p className="break-words text-xs text-muted-foreground">
          Referência normativa: <span>{feedback.references.join(" · ")}</span>
        </p>
      )}
      {item.waiverJustification && (
        <p className="break-words">
          Exceção aprovada: {item.waiverJustification}
        </p>
      )}
      <details className="min-w-0 border-t pt-3 text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2">
          Detalhes técnicos
        </summary>
        <div className="mt-3 flex min-w-0 flex-col gap-3">
          <dl className="flex min-w-0 flex-col gap-2">
            {technicalDetails.map(
              ([name, value]) =>
                value !== null && (
                  <div key={name} className="min-w-0">
                    <dt>{name}</dt>
                    <dd className="mt-0.5 break-words font-mono text-foreground">
                      {value}
                    </dd>
                  </div>
                ),
            )}
          </dl>
          {item.description !== feedback.description &&
            item.description !== feedback.title && (
              <p className="break-words">{item.description}</p>
            )}
        </div>
      </details>
    </div>
  );
}
