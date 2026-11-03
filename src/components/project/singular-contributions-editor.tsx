"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  invalidateProjectDependents,
  projectQueryKeys,
} from "@/api/client/query-keys";
import {
  expectNoContent,
  getErrorMessage,
  parseClientJson,
} from "@/api/client/response";
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
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ErrorState } from "@/components/ui/error-state";
import { Feedback, RequestError } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/page-state";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      toast.success("Contribuição salva.", {
        description:
          "Recalcule o dimensionamento para considerar as novas vazões.",
      });
      await afterChange();
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) =>
      expectNoContent(
        await fetch(`${base}/${id}`, { method: "DELETE" }),
        "Não foi possível excluir a contribuição.",
      ),
    onSuccess: async () => {
      toast.success("Contribuição excluída.");
      await afterChange();
    },
  });

  if (network.isPending || contributions.isPending)
    return <PageLoading label="Carregando contribuições" />;
  if (network.isError || contributions.isError)
    return (
      <ErrorState
        title="Não foi possível carregar as contribuições"
        description={getErrorMessage(network.error ?? contributions.error)}
        retrying={network.isFetching || contributions.isFetching}
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
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setDraft({ ...draft, [key]: event.target.value }),
  });

  return (
    <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
      <CardHeader>
        <CardTitle>Contribuições singulares</CardTitle>
        <CardDescription>
          Vazões concentradas em L/s (indústrias, comércios, instituições). Um
          destino em nó entra no trecho que sai dele; as vazões acumulam para
          jusante sem coeficientes de pico.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        {network.data.segments.length === 0 && (
          <Feedback
            tone="warning"
            title="Cadastre a rede antes de adicionar contribuições"
            description="A contribuição precisa estar associada a um nó ou trecho da rede."
            actions={[
              {
                label: "Cadastrar rede",
                href: `/project/${projectId}/sizing#network-topology`,
              },
            ]}
          />
        )}
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
                  <ConfirmButton
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Excluir ${item.name}`}
                    disabled={remove.isPending}
                    title={`Excluir a contribuição ${item.name}?`}
                    description="Esta contribuição deixará de compor as vazões do projeto. Recalcule o dimensionamento após a exclusão."
                    confirmLabel="Excluir contribuição"
                    onConfirm={() => remove.mutate(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </ConfirmButton>
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
          disabled={network.data.segments.length === 0 || save.isPending}
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
          <Select
            value={draft.type}
            onValueChange={(type) =>
              setDraft({ ...draft, type: type as Draft["type"] })
            }
            disabled={save.isPending}
          >
            <SelectTrigger aria-label="Tipo da contribuição" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contributionTypeSchema.options.map((type) => (
                <SelectItem key={type} value={type}>
                  {typeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={draft.target || "unset"}
            onValueChange={(target) =>
              setDraft({ ...draft, target: target === "unset" ? "" : target })
            }
            disabled={save.isPending}
          >
            <SelectTrigger
              aria-label="Destino da contribuição"
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">Destino...</SelectItem>
              <SelectGroup>
                <SelectLabel>Trechos</SelectLabel>
                {network.data.segments.map((segment) => (
                  <SelectItem key={segment.id} value={`segment:${segment.id}`}>
                    {segment.code}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Nós</SelectLabel>
                {network.data.nodes.map((node) => (
                  <SelectItem key={node.id} value={`node:${node.id}`}>
                    {node.code}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
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
              {save.isPending
                ? "Salvando..."
                : editing
                  ? "Salvar contribuição"
                  : "Adicionar contribuição"}
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
        {invalid && (
          <Feedback
            tone="error"
            title="Revise os dados da contribuição"
            description={invalid}
          />
        )}
        {(save.isError || remove.isError) && (
          <RequestError
            title="Não foi possível atualizar as contribuições"
            error={save.error ?? remove.error}
          />
        )}
        {save.isSuccess && !editing && !draft.name && (
          <Feedback
            tone="success"
            title="Contribuição salva"
            description="Execute novamente o dimensionamento para atualizar as vazões."
            actions={[
              {
                label: "Ir para dimensionamento",
                href: `/project/${projectId}/sizing`,
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}
