"use client";

import { useQuery } from "@tanstack/react-query";
import { projectQueryKeys } from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
import { projectOverviewSchema } from "@/api/contracts/design";
import { projectDetailResponseSchema } from "@/api/contracts/spring";
import { OverviewContent } from "@/app/(protected)/project/[projectId]/overview/components/overview-content";
import { ErrorState } from "@/components/ui/error-state";
import { PageLoading } from "@/components/ui/page-state";
import { projectStatuses } from "@/schemas/general-data";
import { correctionPath } from "./project-validation";

const actions: Record<string, string> = {
  PROJECT_CREATED: "Projeto criado",
  PROJECT_UPDATED: "Dados gerais atualizados",
  DXF_IMPORTED: "DXF importado",
  PARAMETERS_UPDATED: "Parâmetros atualizados",
  NETWORK_EDITED: "Rede atualizada",
};
const pendingLabels: Record<string, string> = {
  "Missing design parameters": "Informar dados hidráulicos",
  "Missing pipe material": "Informar material da rede",
  "Missing infiltration rate": "Informar taxa de infiltração",
  "Missing network segments": "Importar a rede do projeto",
  "Missing ground elevation": "Informar cota de terreno",
  "Missing dry-weather discharge answer": "Informar contribuição de tempo seco",
  "Unknown segment endpoint": "Revisar ligação do trecho",
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
        description={
          (overview.error ?? network.error)?.message ??
          "Não foi possível carregar os dados do projeto."
        }
        onRetry={() => {
          void overview.refetch();
          void network.refetch();
        }}
      />
    );
  const data = overview.data;
  const project = network.data.project;
  const generalComplete = Boolean(
    project.name &&
      project.contractor &&
      project.technicalManager &&
      project.location,
  );
  const hydraulicComplete = !data.pendingItems.items.some(
    (item) => item.step === "HYDRAULICS",
  );
  const date = (value: string) => new Date(value).toLocaleString("pt-BR");
  return (
    <OverviewContent
      projectId={projectId}
      projectDetails={[
        {
          label: "Responsável Técnico",
          value: project.technicalManager ?? "Não informado",
        },
        { label: "Criado em", value: date(project.createdAt) },
        { label: "Última atualização", value: date(project.updatedAt) },
        { label: "Contratante", value: project.contractor ?? "Não informado" },
        { label: "Revisão", value: project.revision ?? "Não informada" },
      ]}
      stages={[
        {
          title: "Rede do projeto",
          description: `${network.data.segments.length} trechos`,
          complete: network.data.segments.length > 0,
        },
        {
          title: "Dados Gerais",
          description: generalComplete ? "Preenchidos" : "Informações parciais",
          complete: generalComplete,
        },
        {
          title: "Dados Hidráulicos",
          description: hydraulicComplete ? "Configurados" : "Incompletos",
          complete: hydraulicComplete,
        },
        {
          title: "Exportação",
          description:
            data.status === "exported" ? "Exportado" : "Nunca exportado",
          complete: data.status === "exported",
        },
      ]}
      alerts={data.pendingItems.items.map((item) => ({
        title: `${pendingLabels[item.title] ?? item.title}${item.target.code ? ` · ${item.target.code}` : ""}`,
        href: correctionPath(projectId, item),
      }))}
      recentActions={data.recentActions.map((action) => ({
        id: action.id,
        title: actions[action.type] ?? action.type,
        detail: action.detail,
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
