"use client";

import {
  ArrowUpRight,
  CircleAlert,
  CircleX,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { Tabs } from "radix-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const severityStyles = {
  error: {
    label: "Erro",
    title: "Erros críticos",
    description: "Impedem a importação",
    icon: CircleX,
    summary:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    iconColor: "text-rose-500",
    badge: "border-transparent bg-rose-600 text-white",
  },
  warning: {
    label: "Alerta",
    title: "Alertas",
    description: "Requerem atenção",
    icon: TriangleAlert,
    summary:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    iconColor: "text-amber-500",
    badge: "border-transparent bg-amber-600 text-white",
  },
  info: {
    label: "Informação",
    title: "Informações",
    description: "Para conhecimento",
    icon: CircleAlert,
    summary:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
    iconColor: "text-blue-500",
    badge: "border-transparent bg-blue-600 text-white",
  },
};

type Severity = keyof typeof severityStyles;

const issues: {
  id: string;
  severity: Severity;
  title: string;
  category: string;
  stage: string;
  action: string;
  route: string;
}[] = [
  {
    id: "return-coefficient",
    severity: "error",
    title: "Coeficiente de retorno ausente em Dados Hidráulicos",
    category: "Dados Obrigatórios · Validação de parâmetros",
    stage: "Dados Hidráulicos",
    action: "Preencher o coeficiente de retorno na tela de Dados Hidráulicos",
    route: "hydraulics",
  },
  {
    id: "downstream",
    severity: "error",
    title: "Trecho T-23 sem jusante definido",
    category: "Topologia · Validação topológica",
    stage: "Dimensionamento",
    action: "Verificar e corrigir a conexão do trecho T-23",
    route: "sizing",
  },
  {
    id: "flow",
    severity: "warning",
    title: "Qf não calculada para 4 trechos",
    category: "Inconsistências Lógicas · Cálculo hidráulico",
    stage: "Dimensionamento",
    action: "Recalcular os trechos pendentes",
    route: "sizing",
  },
  {
    id: "diameter",
    severity: "error",
    title: "Diâmetro ausente no trecho T-08",
    category: "Dados Obrigatórios · Validação de parâmetros",
    stage: "Dimensionamento",
    action: "Definir o diâmetro do trecho T-08",
    route: "sizing",
  },
  {
    id: "paving",
    severity: "info",
    title: "Pavimentação não informada para 2 trechos",
    category: "Dados Complementares · Pavimentação",
    stage: "Pavimentação",
    action: "Revisar os dados de pavimentação dos trechos",
    route: "paving",
  },
];

const filters = [
  { value: "all", label: "Todas" },
  { value: "error", label: "Erros" },
  { value: "warning", label: "Alertas" },
  { value: "info", label: "Informações" },
] as const;

export function ValidationContent({
  projectId,
}: Readonly<{ projectId: string }>) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6">
      <h1 className="mb-3 text-3xl font-bold text-foreground">Validação</h1>

      <section
        aria-labelledby="validation-summary"
        className="rounded-lg border border-border/80 bg-card/40 p-5"
      >
        <h2 id="validation-summary" className="text-base font-semibold">
          Resumo de Validação
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Resolva as pendências antes de exportar o projeto
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {(["error", "warning", "info"] as const).map((severity) => {
            const style = severityStyles[severity];
            const Icon = style.icon;
            return (
              <div
                key={severity}
                className={`flex min-w-0 items-center justify-between gap-3 rounded-md border p-3 ${style.summary}`}
              >
                <dt className="min-w-0">
                  <Icon
                    aria-hidden="true"
                    className={`mb-2 size-6 ${style.iconColor}`}
                  />
                  <span className="block text-sm font-medium">
                    {style.title}
                  </span>
                  <span className="block text-xs">{style.description}</span>
                </dt>
                <dd className="shrink-0 text-5xl font-semibold tabular-nums">
                  {issues.filter((issue) => issue.severity === severity).length}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <Tabs.Root defaultValue="all" className="space-y-5">
        <Tabs.List
          aria-label="Filtrar ocorrências de validação"
          className="grid grid-cols-2 gap-1 rounded-md bg-muted/60 p-1 sm:grid-cols-4"
        >
          {filters.map((filter) => (
            <Tabs.Trigger
              key={filter.value}
              value={filter.value}
              className="min-h-8 rounded-sm px-2 py-1.5 text-xs font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              {filter.label} (
              {
                issues.filter(
                  (issue) =>
                    filter.value === "all" || issue.severity === filter.value,
                ).length
              }
              )
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {filters.map((filter) => (
          <Tabs.Content
            key={filter.value}
            value={filter.value}
            className="space-y-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {issues
              .filter(
                (issue) =>
                  filter.value === "all" || issue.severity === filter.value,
              )
              .map((issue) => {
                const style = severityStyles[issue.severity];
                const Icon = style.icon;
                return (
                  <article
                    key={issue.id}
                    className="flex items-start gap-4 rounded-lg border border-border/80 bg-card/40 p-5"
                  >
                    <Icon
                      aria-hidden="true"
                      className={`mt-0.5 size-5 shrink-0 ${style.iconColor}`}
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium">{issue.title}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {issue.category}
                          </p>
                        </div>
                        <Badge
                          className={`shrink-0 rounded-full px-2 py-0 text-xs ${style.badge}`}
                        >
                          {style.label}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs leading-5">
                        <p>
                          <span className="text-muted-foreground">
                            Etapa Relacionada:{" "}
                          </span>
                          {issue.stage}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Ação sugerida:{" "}
                          </span>
                          {issue.action}
                        </p>
                      </div>
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="h-7 rounded-sm px-2 text-xs"
                      >
                        <Link
                          href={`/project/${projectId}/${issue.route}`}
                          aria-label={`Ir para correção: ${issue.title}`}
                        >
                          Ir para correção <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
