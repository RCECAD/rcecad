"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { projectQueryKeys } from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
import { projectOverviewSchema } from "@/api/contracts/design";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { PageLoading } from "@/components/ui/page-state";
import { projectStatuses } from "@/schemas/general-data";
import { ValidationFindings } from "./project-validation";

const actions: Record<string, string> = {
  PROJECT_CREATED: "Projeto criado",
  PROJECT_UPDATED: "Dados gerais atualizados",
  DXF_IMPORTED: "DXF importado",
  PARAMETERS_UPDATED: "Parâmetros atualizados",
  NETWORK_EDITED: "Rede atualizada",
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
  if (overview.isPending) return <PageLoading label="Carregando visão geral" />;
  if (overview.isError)
    return (
      <ErrorState
        title="Não foi possível carregar a visão geral"
        description={overview.error.message}
        onRetry={() => void overview.refetch()}
      />
    );
  const data = overview.data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{data.name}</h1>
        <Button
          variant="outline"
          disabled={overview.isFetching}
          onClick={() => void overview.refetch()}
        >
          Atualizar visão geral
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Visão geral do projeto</CardTitle>
          <CardDescription>
            Status:{" "}
            {
              projectStatuses.find((status) => status.value === data.status)
                ?.label
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{data.pendingItems.count} pendência(s) de dados obrigatórios.</p>
          <p className="text-sm text-muted-foreground">
            A ausência de dados pendentes não confirma o dimensionamento.
            Execute o cálculo e a validação para verificar as regras aplicadas.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/project/${projectId}/sizing`}>
                Abrir dimensionamento
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/project/${projectId}/validation`}>
                Abrir validação
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <ValidationFindings
        projectId={projectId}
        items={data.pendingItems.items}
      />
      <Card>
        <CardHeader>
          <CardTitle>Últimas ações</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActions.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma ação registrada.</p>
          ) : (
            <ol className="space-y-3">
              {data.recentActions.map((action) => (
                <li key={action.id} className="border-b pb-3 text-sm">
                  <p className="font-medium">
                    {actions[action.type] ?? action.type}
                  </p>
                  {action.detail && <p>{action.detail}</p>}
                  <time
                    dateTime={action.occurredAt}
                    className="text-muted-foreground"
                  >
                    {new Date(action.occurredAt).toLocaleString("pt-BR")}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
