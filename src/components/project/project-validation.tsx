"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
      {items.map((item) => (
        <li
          key={JSON.stringify(item)}
          className="rounded-lg border p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground">
            {severityLabels[item.severity]}
            {item.target.code && ` · ${item.target.code}`}
          </p>
          <h3 className="font-medium">{item.title}</h3>
          <p className="text-sm">{item.message}</p>
          <p className="text-sm text-muted-foreground">
            Ação sugerida: {item.suggestedAction}
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={correctionPath(projectId, item)}>Ir para correção</Link>
          </Button>
        </li>
      ))}
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Validação</h1>
      <Card>
        <CardHeader>
          <CardTitle>Validação do projeto</CardTitle>
          <CardDescription>
            Confira os dados obrigatórios e as ocorrências reais do
            dimensionamento. A validação atualiza o status do projeto conforme o
            resultado.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["critical", "Erros críticos"],
                ["alert", "Alertas"],
                ["info", "Informações"],
              ] as const
            ).map(([key, label]) => (
              <Card key={key}>
                <CardContent className="pt-5">
                  <p>{label}</p>
                  <p className="text-3xl font-semibold">
                    {validation.data.summary[key]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <fieldset
            aria-label="Filtrar ocorrências de validação"
            className="flex flex-wrap gap-2"
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
                variant={filter === value ? "default" : "outline"}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
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
