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
import { correctionPath, validationGuidance } from "@/lib/project-feedback";
import { NonconformityPanel } from "./nonconformity-panel";

const severityLabels = {
  CRITICAL: "Erro crítico",
  ALERT: "Alerta",
  INFO: "Informação",
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

export { correctionPath } from "@/lib/project-feedback";

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
        const { Icon, color, badge } = severityStyle[item.severity];
        const guidance = validationGuidance(item);
        return (
          <li
            key={JSON.stringify(item)}
            className="flex items-start gap-3 rounded-lg border border-border/80 bg-card/40 p-4 sm:gap-5 sm:p-6"
          >
            <Icon
              aria-hidden="true"
              className={`mt-1 size-6 shrink-0 ${color}`}
            />
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-sm font-medium">{guidance.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${badge}`}
                >
                  {severityLabels[item.severity]}
                </span>
              </div>
              {item.target.code && (
                <p className="text-xs font-semibold text-muted-foreground">
                  {item.target.code}
                </p>
              )}
              <p className="text-sm">{guidance.description}</p>
              <p className="text-xs text-muted-foreground">
                Etapa relacionada:{" "}
                {item.step === "HYDRAULICS"
                  ? "Dados hidráulicos"
                  : item.step === "DESIGN"
                    ? "Dimensionamento"
                    : item.step === "NETWORK"
                      ? "Rede do projeto"
                      : "Contribuições"}
              </p>
              <p className="text-sm text-muted-foreground">
                Ação sugerida: {guidance.action}
              </p>
              <FeedbackActions
                actions={[
                  {
                    label: "Ir para correção",
                    href: correctionPath(projectId, item),
                  },
                ]}
              />
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
        queryClient.invalidateQueries({
          queryKey: projectQueryKeys.nonconformities(projectId),
        }),
      ]);
      router.refresh();
    }
  }
  return (
    <div
      id="project-validation"
      className="flex min-w-0 flex-col gap-6 mx-auto max-w-[1088px]"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Validação</h1>
      <Card className="gap-4 rounded-lg border border-border/80 bg-card/40 py-5 shadow-none ring-0">
        <CardHeader>
          <CardTitle>Resumo de validação</CardTitle>
          <CardDescription>
            Resolva as pendências antes de concluir o projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4">
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
                    {validation.data?.summary[key] ?? "—"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

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
        <p role="status">Verificando dados e regras do dimensionamento...</p>
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
      {!validation.data && !validation.isFetching && !validation.isError && (
        <Feedback
          title="O projeto ainda não foi validado nesta sessão"
          description="Execute a validação para consultar as pendências atuais e saber se o projeto pode ser exportado."
          actions={[
            { label: "Iniciar validação", onClick: () => void validate() },
          ]}
        />
      )}
      <NonconformityPanel projectId={projectId} />
    </div>
  );
}
