"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleX, Info, TriangleAlert } from "lucide-react";
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
import {
  Feedback,
  FeedbackActions,
  RequestError,
} from "@/components/ui/feedback";
import {
  ResultPanelSkeleton,
  StatCardsSkeleton,
} from "@/components/ui/loading-skeletons";
import {
  correctionPath,
  type GuidanceFacts,
  validationGuidance,
} from "@/lib/project-feedback";
import { NonconformityPanel } from "./nonconformity-panel";

const severityStyle = {
  CRITICAL: {
    label: "Erro crítico",
    Icon: CircleX,
    color: "text-rose-600 dark:text-rose-400",
    stripe: "border-l-rose-500",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  },
  ALERT: {
    label: "Alerta",
    Icon: TriangleAlert,
    color: "text-amber-600 dark:text-amber-400",
    stripe: "border-l-amber-500",
    badge:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  },
  INFO: {
    label: "Informação",
    Icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    stripe: "border-l-blue-500",
    badge:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  },
};
const stepLabels: Record<ValidationItem["step"], string> = {
  HYDRAULICS: "Dados hidráulicos",
  DESIGN: "Dimensionamento",
  NETWORK: "Rede do projeto",
  CONTRIBUTIONS: "Contribuições",
};
const targetLabels = { SEGMENT: "Trecho", NODE: "Nó" } as const;

export { correctionPath } from "@/lib/project-feedback";

function correctionLabel(item: ValidationItem) {
  const { type, code } = item.target;
  return type === "PROJECT" || !code
    ? "Ir para correção"
    : `Corrigir ${targetLabels[type].toLowerCase()} ${code}`;
}

function FindingFacts({ facts }: { facts: GuidanceFacts }) {
  if (!facts.observed && !facts.limit) return null;
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-md border border-border/80 bg-muted/30 p-3 text-sm sm:grid-cols-3">
      {facts.parameter && (
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Grandeza</dt>
          <dd className="font-medium">{facts.parameter}</dd>
        </div>
      )}
      {facts.observed && (
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Valor calculado</dt>
          <dd className="font-medium tabular-nums">{facts.observed}</dd>
        </div>
      )}
      {facts.limit && (
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">Limite aceito</dt>
          <dd className="font-medium tabular-nums">{facts.limit}</dd>
        </div>
      )}
      {facts.references.length > 0 && (
        <div className="min-w-0 sm:col-span-3">
          <dt className="sr-only">Referência normativa</dt>
          <dd className="text-xs text-muted-foreground">
            {facts.references.join(" · ")}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function ValidationFindings({
  projectId,
  items,
}: {
  projectId: string;
  items: ValidationItem[];
}) {
  return (
    <ul className="flex min-w-0 flex-col gap-3">
      {items.map((item) => {
        const { Icon, color, stripe, badge, label } =
          severityStyle[item.severity];
        const guidance = validationGuidance(item);
        const { type, code } = item.target;
        return (
          <li
            key={JSON.stringify(item)}
            className={`flex min-w-0 flex-col gap-3 rounded-lg border border-l-4 border-border/80 bg-card/40 p-4 sm:p-5 ${stripe}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                <Icon
                  aria-hidden="true"
                  className={`mt-0.5 size-5 shrink-0 ${color}`}
                />
                <h3 className="text-sm font-semibold leading-6">
                  {guidance.title}
                </h3>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${badge}`}
              >
                {label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {type !== "PROJECT" && code && (
                <span className="rounded-md border border-border bg-background px-2 py-0.5 font-medium text-foreground">
                  {`${targetLabels[type]} ${code}`}
                </span>
              )}
              <span>Etapa: {stepLabels[item.step]}</span>
            </div>
            <p className="text-sm">{guidance.description}</p>
            {guidance.facts && <FindingFacts facts={guidance.facts} />}
            <p className="text-sm">
              <span className="font-medium">Como corrigir: </span>
              {guidance.action}
            </p>
            <FeedbackActions
              actions={[
                {
                  label: correctionLabel(item),
                  href: correctionPath(projectId, item),
                },
              ]}
            />
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
        queryClient.invalidateQueries({
          queryKey: projectQueryKeys.nonconformities(projectId),
        }),
      ]);
      router.refresh();
    }
  }
  return (
    <div id="project-validation" className="flex w-full min-w-0 flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Validação</h1>
      <Card className="gap-4 rounded-lg border border-border/80 bg-card/40 py-5 shadow-none ring-0">
        <CardHeader>
          <CardTitle>Resumo de validação</CardTitle>
          <CardDescription>
            Resolva as pendências antes de concluir o projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4">
          {validation.isFetching ? (
            <StatCardsSkeleton />
          ) : validation.data && !validation.isError ? (
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
                    <div className="flex min-w-0 flex-col gap-1">
                      <Icon className="mb-2 size-7" aria-hidden="true" />
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs">{detail}</p>
                    </div>
                    <p className="text-6xl font-semibold tracking-tight">
                      {validation.data.summary[key]}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
              <Info aria-hidden="true" className="size-10 text-primary" />
              <div className="max-w-xl space-y-1">
                <p className="font-medium">Confira se o projeto está pronto</p>
                <p className="text-sm text-muted-foreground">
                  A validação verifica os dados obrigatórios, o dimensionamento
                  e as regras do projeto. O resumo será exibido aqui quando a
                  análise terminar.
                </p>
              </div>
            </div>
          )}

          <Button
            className="self-start"
            disabled={validation.isFetching}
            onClick={() => void validate()}
          >
            {validation.isFetching ? "Validando..." : "Validar projeto"}
          </Button>
        </CardContent>
      </Card>
      {validation.isFetching && (
        <ResultPanelSkeleton
          label="Verificando dados e regras do dimensionamento"
          rows={6}
        />
      )}
      {validation.isError && (
        <RequestError
          title="Não foi possível validar o projeto"
          error={validation.error}
          onRetry={() => void validate()}
          retrying={validation.isFetching}
          actions={[
            {
              label: "Revisar dimensionamento",
              href: `/project/${projectId}/sizing`,
            },
          ]}
        />
      )}
      {validation.data && !validation.isFetching && !validation.isError && (
        <>
          <Feedback
            tone={validation.data.readyToConclude ? "success" : "warning"}
            title={
              validation.data.readyToConclude
                ? "Projeto apto a concluir"
                : "Projeto com pendências"
            }
            description={
              validation.data.readyToConclude
                ? "Todos os trechos foram dimensionados e não há pendências críticas. Você já pode exportar os documentos."
                : "Revise os itens abaixo e use os botões de correção para completar os dados. Depois, valide novamente."
            }
            actions={
              validation.data.readyToConclude
                ? [
                    {
                      label: "Exportar documentos",
                      href: `/project/${projectId}/export`,
                    },
                  ]
                : [
                    {
                      label: "Revisar dimensionamento",
                      href: `/project/${projectId}/sizing`,
                    },
                  ]
            }
          />
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
            <Feedback
              title="Nenhuma ocorrência neste filtro"
              description="Selecione outro filtro para consultar as demais ocorrências."
              actions={
                filter !== "ALL"
                  ? [
                      {
                        label: "Mostrar todas",
                        onClick: () => setFilter("ALL"),
                      },
                    ]
                  : undefined
              }
            />
          )}
        </>
      )}
      <NonconformityPanel projectId={projectId} />
    </div>
  );
}
