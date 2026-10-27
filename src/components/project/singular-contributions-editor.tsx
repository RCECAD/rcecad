"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { z } from "zod";
import {
  invalidateProjectDependents,
  projectQueryKeys,
} from "@/api/client/query-keys";
import { expectNoContent, parseClientJson } from "@/api/client/response";
import {
  contributionTypeSchema,
  type SingularContribution,
  type SingularContributionRequest,
  singularContributionRequestSchema,
  singularContributionSchema,
} from "@/api/contracts/resources";
import { projectDetailResponseSchema } from "@/api/contracts/spring";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/page-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const typeLabels: Record<SingularContribution["type"], string> = {
  INDUSTRIAL: "Industrial",
  COMMERCIAL: "Comercial",
  INSTITUTIONAL: "Institucional",
  OTHER: "Outra",
};
const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

type Draft = {
  name: string;
  type: SingularContribution["type"];
  target: string;
  initialLps: string;
  finalLps: string;
};
const emptyDraft: Draft = {
  name: "",
  type: "OTHER",
  target: "",
  initialLps: "0",
  finalLps: "0",
};

function toDraft(item: SingularContribution): Draft {
  return {
    name: item.name,
    type: item.type,
    target: item.nodeId ? `node:${item.nodeId}` : `segment:${item.segmentId}`,
    initialLps: String(item.initialLps),
    finalLps: String(item.finalLps),
  };
}

const flow = (value: string) => (value === "" ? Number.NaN : Number(value));

export function toContributionRequest(draft: Draft) {
  const [kind, id] = draft.target.split(":");
  return singularContributionRequestSchema.safeParse({
    name: draft.name,
    type: draft.type,
    nodeId: kind === "node" ? id : null,
    segmentId: kind === "segment" ? id : null,
    initialLps: flow(draft.initialLps),
    finalLps: flow(draft.finalLps),
  });
}

export function SingularContributionsEditor({
  projectId,
}: {
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string>();
  const base = `/api/projects/${projectId}/singular-contributions`;
  const network = useQuery({
    queryKey: projectQueryKeys.network(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/network`, { signal }),
        projectDetailResponseSchema,
        "Não foi possível carregar a rede.",
      ),
    retry: false,
  });
  const contributions = useQuery({
    queryKey: projectQueryKeys.contributions(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(base, { signal }),
        z.array(singularContributionSchema),
        "Não foi possível carregar as contribuições.",
      ),
    retry: false,
  });
  const afterChange = async () => {
    await queryClient.invalidateQueries({
      queryKey: projectQueryKeys.contributions(projectId),
    });
    await invalidateProjectDependents(queryClient, projectId);
  };
  const save = useMutation({
    mutationFn: async (input: SingularContributionRequest) =>
      parseClientJson(
        await fetch(editing ? `${base}/${editing}` : base, {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
        singularContributionSchema,
        "Não foi possível salvar a contribuição.",
      ),
    onSuccess: async () => {
      setDraft(emptyDraft);
      setEditing(null);
      await afterChange();
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) =>
      expectNoContent(
        await fetch(`${base}/${id}`, { method: "DELETE" }),
        "Não foi possível excluir a contribuição.",
      ),
    onSuccess: afterChange,
  });

  if (network.isPending || contributions.isPending)
    return <PageLoading label="Carregando contribuições" />;
  if (network.isError || contributions.isError)
    return (
      <ErrorState
        title="Não foi possível carregar as contribuições"
        description={(network.error ?? contributions.error)?.message ?? ""}
        onRetry={() => {
          void network.refetch();
          void contributions.refetch();
        }}
      />
    );

  const submit = () => {
    const parsed = toContributionRequest(draft);
    if (!parsed.success) {
      setInvalid(
        "Informe nome, um nó ou trecho de destino e vazões iguais ou maiores que zero.",
      );
      return;
    }
    setInvalid(undefined);
    save.mutate(parsed.data);
  };
  const field = (key: keyof Draft) => ({
    value: draft[key],
    disabled: save.isPending,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft({ ...draft, [key]: event.target.value }),
  });

  return (
    <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
      <CardHeader>
        <CardTitle>Contribuições Singulares</CardTitle>
        <CardDescription>
          Vazões concentradas em L/s (indústrias, comércios, instituições). Um
          destino em nó entra no trecho que sai dele; as vazões acumulam para
          jusante sem coeficientes de pico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Nome",
                "Tipo",
                "Destino",
                "Inicial (L/s)",
                "Final (L/s)",
                "Ações",
              ].map((label) => (
                <TableHead key={label}>{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributions.data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{typeLabels[item.type]}</TableCell>
                <TableCell>
                  {item.nodeId ? "Nó" : "Trecho"} {item.targetCode}
                </TableCell>
                <TableCell>{item.initialLps.toLocaleString("pt-BR")}</TableCell>
                <TableCell>{item.finalLps.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Editar ${item.name}`}
                    onClick={() => {
                      setEditing(item.id);
                      setDraft(toDraft(item));
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Excluir ${item.name}`}
                    disabled={remove.isPending}
                    onClick={() => {
                      if (
                        window.confirm(`Excluir a contribuição ${item.name}?`)
                      )
                        remove.mutate(item.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {contributions.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Nenhuma contribuição singular cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <fieldset
          aria-label={editing ? "Editar contribuição" : "Nova contribuição"}
          className="grid gap-3 rounded-md border p-4 md:grid-cols-6"
        >
          <Input
            aria-label="Nome da contribuição"
            placeholder="Nome"
            maxLength={120}
            className="md:col-span-2"
            {...field("name")}
          />
          <select
            aria-label="Tipo da contribuição"
            className={selectClass}
            {...field("type")}
          >
            {contributionTypeSchema.options.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>
          <select
            aria-label="Destino da contribuição"
            className={selectClass}
            {...field("target")}
          >
            <option value="">Destino...</option>
            <optgroup label="Trechos">
              {network.data.segments.map((segment) => (
                <option key={segment.id} value={`segment:${segment.id}`}>
                  {segment.code}
                </option>
              ))}
            </optgroup>
            <optgroup label="Nós">
              {network.data.nodes.map((node) => (
                <option key={node.id} value={`node:${node.id}`}>
                  {node.code}
                </option>
              ))}
            </optgroup>
          </select>
          <Input
            type="number"
            min="0"
            step="any"
            aria-label="Vazão inicial (L/s)"
            {...field("initialLps")}
          />
          <Input
            type="number"
            min="0"
            step="any"
            aria-label="Vazão final (L/s)"
            {...field("finalLps")}
          />
          <div className="flex gap-2 md:col-span-6">
            <Button onClick={submit} disabled={save.isPending}>
              <Plus className="size-4" />
              {editing ? "Salvar contribuição" : "Adicionar contribuição"}
            </Button>
            {editing && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setDraft(emptyDraft);
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </fieldset>
        {(invalid || save.isError || remove.isError) && (
          <p role="alert" className="text-sm text-destructive">
            {invalid ?? save.error?.message ?? remove.error?.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
