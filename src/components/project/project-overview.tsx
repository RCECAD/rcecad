"use client";

import { useQuery } from "@tanstack/react-query";
import { projectQueryKeys } from "@/api/client/query-keys";
import { getErrorMessage, parseClientJson } from "@/api/client/response";
import { projectOverviewSchema } from "@/api/contracts/design";
import { projectDetailResponseSchema } from "@/api/contracts/spring";
import { OverviewContent } from "@/app/(protected)/project/[projectId]/overview/components/overview-content";
import { ErrorState } from "@/components/ui/error-state";
import { PageLoading } from "@/components/ui/page-state";
import {
  actionDetail,
  correctionPath,
  progressDescription,
  validationGuidance,
} from "@/lib/project-feedback";
import { projectStatuses } from "@/schemas/general-data";

const actions: Record<string, string> = {
  PROJECT_CREATED: "Projeto criado",
  PROJECT_UPDATED: "Dados gerais atualizados",
  DXF_IMPORTED: "DXF importado",
  PARAMETERS_UPDATED: "Parâmetros atualizados",
  NETWORK_EDITED: "Rede atualizada",
  RECALCULATED: "Dimensionamento recalculado",
  VALIDATED: "Projeto validado",
  EXPORTED: "Documento exportado",
  WAIVER_CREATED: "Aprovação de exceção registrada",
  WAIVER_DELETED: "Aprovação de exceção removida",
  NONCONFORMITY_DECIDED: "Decisão sobre não conformidade",
};
const stepTitles: Record<string, string> = {
  DXF_IMPORT: "Rede do projeto",
  GENERAL_DATA: "Dados gerais",
  HYDRAULICS: "Dados hidráulicos",
  EXPORT: "Exportação",
};
export function ProjectOverview({ projectId }: { projectId: string }) {
  const overview = useQuery({
    queryKey: projectQueryKeys.overview(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/overview`, { signal }),
        projectOverviewSchema,
        "Não foi possível carregar a visão geral.",
      ),
    retry: false,
  });
  const network = useQuery({
    queryKey: projectQueryKeys.network(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/network`, { signal }),
        projectDetailResponseSchema,
        "Não foi possível carregar os dados do projeto.",
      ),
    retry: false,
  });
  if (overview.isPending || network.isPending)
    return <PageLoading label="Carregando visão geral" />;
  if (overview.isError || network.isError)
    return (
      <ErrorState
        title="Não foi possível carregar a visão geral"
        retrying={overview.isFetching || network.isFetching}
        description={getErrorMessage(
          overview.error ?? network.error,
          "Não foi possível carregar os dados do projeto.",
        )}
        onRetry={() => {
          void overview.refetch();
          void network.refetch();
        }}
      />
    );
  const data = overview.data;
  const project = network.data.project;
  const date = (value: string) => new Date(value).toLocaleString("pt-BR");
  return (
    <OverviewContent
      projectId={projectId}
      projectDetails={[
        {
          label: "Responsável técnico",
          value: project.technicalManager ?? "Não informado",
        },
        { label: "Criado em", value: date(project.createdAt) },
        { label: "Última atualização", value: date(project.updatedAt) },
        { label: "Contratante", value: project.contractor ?? "Não informado" },
        { label: "Revisão", value: project.revision ?? "Não informada" },
      ]}
      stages={data.steps.map((step) => ({
        title: stepTitles[step.step] ?? "Etapa do projeto",
        description: progressDescription(step),
        href: `/project/${projectId}/${({ DXF_IMPORT: "sizing", GENERAL_DATA: "general-data", HYDRAULICS: "hydraulics", EXPORT: "export" } as Record<string, string>)[step.step] ?? "overview"}`,
        complete: step.state === "DONE",
      }))}
      progressPercent={data.progressPercent}
      notice={
        data.designOutdated
          ? `Os dados mudaram depois do último registro de dimensionamento${data.lastSnapshotAt ? ` (${date(data.lastSnapshotAt)})` : ""}. Valide novamente antes de exportar.`
          : undefined
      }
      historyHref={`/project/${projectId}/audit`}
      alerts={data.pendingItems.items.map((item) => ({
        title: `${validationGuidance(item).title}${item.target.code ? ` · ${item.target.code}` : ""}`,
        href: correctionPath(projectId, item),
      }))}
      recentActions={data.recentActions.map((action) => ({
        id: action.id,
        title: actions[action.type] ?? "Atividade do projeto",
        detail: actionDetail(action),
        time: date(action.occurredAt),
      }))}
      onRefresh={() => {
        void overview.refetch();
        void network.refetch();
      }}
      refreshing={overview.isFetching || network.isFetching}
      status={
        projectStatuses.find((status) => status.value === data.status)?.label ??
        data.status
      }
    />
  );
}
