"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, CircleX, Info, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { projectQueryKeys } from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
import {
  projectValidationSchema,
  type ValidationItem,
} from "@/api/contracts/design";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const severityLabels = {
  CRITICAL: "Erro crítico",
  ALERT: "Alerta",
  INFO: "Informação",
};
const findingTitles: Record<string, string> = {
  "Design finding: MANNING_N_NOT_JUSTIFIED":
    "Coeficiente de Manning exige justificativa",
  "Design finding: DOMAIN_VALUE_MISMATCH":
    "Parâmetro fora do domínio normativo resolvido",
  "Missing design parameters": "Parâmetros hidráulicos não informados",
  "Missing pipe material": "Material da rede não informado",
  "Missing infiltration rate": "Taxa de infiltração não informada",
  "Missing ground elevation": "Cota de terreno não informada",
  "Missing dry-weather discharge answer":
    "Contribuição de tempo seco não informada",
  "Missing network segments": "Rede do projeto não cadastrada",
};
const severityStyle = {
  CRITICAL: {
    Icon: CircleX,
    color: "text-rose-600",
    badge: "bg-rose-600 text-white",
  },
  ALERT: {
    Icon: TriangleAlert,
    color: "text-amber-600",
    badge: "bg-amber-600 text-white",
  },
  INFO: { Icon: Info, color: "text-blue-600", badge: "bg-blue-600 text-white" },
};
export function correctionPath(projectId: string, item: ValidationItem) {
  const base = `/project/${projectId}`;
  if (item.step === "HYDRAULICS") return `${base}/hydraulics`;
  if (item.step === "DESIGN") return `${base}/sizing`;
  const anchor = item.target.id
    ? `#${item.target.type.toLowerCase()}-${item.target.id}`
    : "";
  return `${base}/sizing${anchor}`;
}

export function ValidationFindings({
  projectId,
  items,
}: {
  projectId: string;
  items: ValidationItem[];
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const { Icon, color, badge } = severityStyle[item.severity];
        return (
          <li
            key={JSON.stringify(item)}
            className="flex items-start gap-5 rounded-lg border border-border/80 bg-card/40 p-6"
          >
            <Icon
              aria-hidden="true"
              className={`mt-1 size-6 shrink-0 ${color}`}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium">
                  {findingTitles[item.title] ?? item.title}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${badge}`}
                >
                  {severityLabels[item.severity]}
                </span>
              </div>
              <p className="text-xs font-semibold text-muted-foreground">
                {severityLabels[item.severity]}
                {item.target.code && ` · ${item.target.code}`}
              </p>
              {findingTitles[item.title] ? (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">
                    Detalhes técnicos e fonte normativa
                  </summary>
                  <p className="mt-2">{item.message}</p>
                </details>
              ) : (
                <p className="text-sm">{item.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Etapa relacionada:{" "}
                {item.step === "HYDRAULICS"
                  ? "Dados Hidráulicos"
                  : item.step === "DESIGN"
                    ? "Dimensionamento"
                    : item.step === "NETWORK"
                      ? "Rede do projeto"
                      : "Contribuições"}
              </p>
              <p className="text-sm text-muted-foreground">
                Ação sugerida:{" "}
                {findingTitles[item.title]
                  ? "Revise os dados e a fonte normativa na etapa relacionada."
                  : item.suggestedAction}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={correctionPath(projectId, item)}>
                  Ir para correção <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ProjectValidation({ projectId }: { projectId: string }) {
  const [filter, setFilter] = useState("ALL");
  const router = useRouter();
  const queryClient = useQueryClient();
  const validation = useQuery({
    queryKey: projectQueryKeys.validation(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/validation`, { signal }),
        projectValidationSchema,
        "Não foi possível validar o projeto.",
      ),
    enabled: false,
    retry: false,
  });
  async function validate() {
    const result = await validation.refetch();
    if (result.isSuccess) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: projectQueryKeys.detail(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: projectQueryKeys.overview(projectId),
        }),
      ]);
      router.refresh();
    }
  }
  return (
    <div className="mx-auto max-w-[1088px] space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Validação</h1>
      <Card className="gap-4 rounded-lg border border-border/80 bg-card/40 py-5 shadow-none ring-0">
        <CardHeader>
          <CardTitle>Resumo de Validação</CardTitle>
          <CardDescription>
            Resolva as pendências antes de concluir o projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                [
                  "critical",
                  "Erros críticos",
                  CircleX,
                  "border-rose-300 bg-rose-50 text-rose-700",
                  "Impedem a conclusão",
                ],
                [
                  "alert",
                  "Alertas",
                  TriangleAlert,
                  "border-amber-300 bg-amber-50 text-amber-700",
                  "Requerem atenção",
                ],
                [
                  "info",
                  "Informações",
                  Info,
                  "border-blue-300 bg-blue-50 text-blue-700",
                  "Para conhecimento",
                ],
              ] as const
            ).map(([key, label, Icon, color, detail]) => (
              <Card
                key={key}
                className={`rounded-lg border py-3 shadow-none ring-0 ${color}`}
              >
                <CardContent className="flex items-center justify-between gap-3 px-3">
                  <div className="space-y-1">
                    <Icon className="mb-2 size-7" aria-hidden="true" />
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs">{detail}</p>
                  </div>
                  <p className="text-6xl font-semibold tracking-tight">
                    {validation.data?.summary[key] ?? "—"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            disabled={validation.isFetching}
            onClick={() => void validate()}
          >
            {validation.isFetching ? "Validando..." : "Validar projeto"}
          </Button>
        </CardContent>
      </Card>
      {validation.isFetching && (
        <p role="status">Verificando dados e regras do dimensionamento...</p>
      )}
      {validation.isError && (
        <p role="alert" className="text-destructive">
          {validation.error.message}
        </p>
      )}
      {validation.data && !validation.isFetching && !validation.isError && (
        <>
          <p role="status" className="rounded-lg border p-4 font-medium">
            {validation.data.readyToConclude
              ? "Projeto apto a concluir: todos os trechos foram dimensionados e não há pendências críticas."
              : "Projeto com pendências: revise os itens abaixo antes de concluir."}
          </p>
          <fieldset
            aria-label="Filtrar ocorrências de validação"
            className="grid grid-cols-2 gap-1 rounded-md bg-card p-1.5 sm:grid-cols-4"
          >
            {(
              [
                ["ALL", "Todas"],
                ["CRITICAL", "Erros"],
                ["ALERT", "Alertas"],
                ["INFO", "Informações"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                variant="ghost"
                className={
                  filter === value
                    ? "h-8 rounded bg-background text-foreground shadow-sm"
                    : "h-8 text-muted-foreground"
                }
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label} (
                {value === "ALL"
                  ? validation.data.items.length
                  : value === "CRITICAL"
                    ? validation.data.summary.critical
                    : value === "ALERT"
                      ? validation.data.summary.alert
                      : validation.data.summary.info}
                )
              </Button>
            ))}
          </fieldset>
          <ValidationFindings
            projectId={projectId}
            items={validation.data.items.filter(
              (item) => filter === "ALL" || item.severity === filter,
            )}
          />
          {validation.data.items.filter(
            (item) => filter === "ALL" || item.severity === filter,
          ).length === 0 && (
            <p className="text-muted-foreground">
              Nenhuma ocorrência neste filtro.
            </p>
          )}
        </>
      )}
      {!validation.data && !validation.isFetching && !validation.isError && (
        <p className="text-sm text-muted-foreground">
          Execute a validação para consultar as pendências atuais.
        </p>
      )}
    </div>
  );
}
