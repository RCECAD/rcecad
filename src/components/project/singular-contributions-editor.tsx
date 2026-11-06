"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useOptionalUnsavedChanges } from "@/components/project/unsaved-changes-provider";
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
type Row = { key: string; label: string; id?: string; draft: Draft };
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
const flow = (value: string) =>
  value.trim() === "" ? Number.NaN : Number(value);
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
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [extraRows, setExtraRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [message, setMessage] = useState("");
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
  const items = contributions.data ?? [];
  const rows: Row[] = (network.data?.segments ?? []).flatMap((segment) => {
    const existing = items.filter((item) => item.segmentId === segment.id);
    return existing.length
      ? existing.map((item) => ({
          key: item.id,
          id: item.id,
          label: segment.code,
          draft: toDraft(item),
        }))
      : [
          {
            key: `segment:${segment.id}`,
            label: segment.code,
            draft: {
              ...emptyDraft,
              name: `Contribuição ${segment.code}`,
              target: `segment:${segment.id}`,
            },
          },
        ];
  });
  const included = new Set(rows.map((row) => row.id));
  rows.push(
    ...items
      .filter((item) => !included.has(item.id))
      .map((item) => ({
        key: item.id,
        id: item.id,
        label: `${item.nodeId ? "Nó" : "Trecho"} ${item.targetCode}`,
        draft: toDraft(item),
      })),
    ...extraRows,
  );
  const dirtyRows = rows.filter(
    (row) =>
      drafts[row.key] &&
      JSON.stringify(drafts[row.key]) !== JSON.stringify(row.draft),
  );
  const { setHasUnsavedChanges } = useOptionalUnsavedChanges() ?? {};
  const hasChanges = dirtyRows.length > 0;
  useEffect(() => {
    setHasUnsavedChanges?.(hasChanges);
    return () => setHasUnsavedChanges?.(false);
  }, [hasChanges, setHasUnsavedChanges]);

  const save = useMutation({
    mutationFn: async (
      pending: { row: Row; input: SingularContributionRequest }[],
    ) => {
      await queryClient.cancelQueries({
        queryKey: projectQueryKeys.contributions(projectId),
      });
      const failures: Record<string, string> = {};
      let completed = 0;
      setProgress({ completed, total: pending.length });
      for (const { row, input } of pending) {
        try {
          const saved = await parseClientJson(
            await fetch(row.id ? `${base}/${row.id}` : base, {
              method: row.id ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            }),
            singularContributionSchema,
            "Não foi possível salvar a contribuição.",
          );
          queryClient.setQueryData<SingularContribution[]>(
            projectQueryKeys.contributions(projectId),
            (current = []) =>
              row.id
                ? current.map((item) => (item.id === saved.id ? saved : item))
                : [...current, saved],
          );
          setDrafts((current) => {
            const next = { ...current };
            delete next[row.key];
            return next;
          });
          setExtraRows((current) =>
            current.filter((item) => item.key !== row.key),
          );
          completed++;
        } catch (error) {
          failures[row.key] = getErrorMessage(error);
        }
        setProgress({
          completed: Object.keys(failures).length + completed,
          total: pending.length,
        });
      }
      setErrors(failures);
      const failed = Object.keys(failures).length;
      setMessage(
        `${completed} ${completed === 1 ? "contribuição salva" : "contribuições salvas"}.${failed ? ` ${failed} não foram salvas. Revise as linhas e tente novamente.` : " Recalcule o dimensionamento para atualizar as vazões."}`,
      );
      if (completed) {
        toast.success(
          `${completed} ${completed === 1 ? "contribuição salva" : "contribuições salvas"}.`,
        );
        await invalidateProjectDependents(queryClient, projectId);
      }
      if (failed)
        setPage(
          Math.floor(rows.findIndex((row) => failures[row.key]) / pageSize),
        );
    },
    onSettled: () => setProgress(null),
  });
  const remove = useMutation({
    mutationFn: async (row: Row) => {
      await expectNoContent(
        await fetch(`${base}/${row.id}`, { method: "DELETE" }),
        "Não foi possível excluir a contribuição.",
      );
      return row;
    },
    onSuccess: async (row) => {
      queryClient.setQueryData<SingularContribution[]>(
        projectQueryKeys.contributions(projectId),
        (current = []) => current.filter((item) => item.id !== row.id),
      );
      clearRow(row.key);
      toast.success("Contribuição excluída.");
      await invalidateProjectDependents(queryClient, projectId);
    },
  });
  const busy = save.isPending || remove.isPending;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = rows.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );
  function clearRow(key: string) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setExtraRows((current) => current.filter((row) => row.key !== key));
  }
  function update(row: Row, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [row.key]: { ...(current[row.key] ?? row.draft), ...patch },
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[row.key];
      return next;
    });
    setMessage("");
  }
  function submit() {
    const invalid: Record<string, string> = {};
    const pending: { row: Row; input: SingularContributionRequest }[] = [];
    for (const row of dirtyRows) {
      const parsed = toContributionRequest(drafts[row.key]);
      if (parsed.success) pending.push({ row, input: parsed.data });
      else
        invalid[row.key] =
          "Informe nome, destino e vazões iguais ou maiores que zero.";
    }
    setErrors(invalid);
    setMessage("");
    if (Object.keys(invalid).length) {
      setPage(Math.floor(rows.findIndex((row) => invalid[row.key]) / pageSize));
      return;
    }
    if (pending.length) save.mutate(pending);
  }
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

  return (
    <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
      <CardHeader>
        <CardTitle>Contribuições singulares</CardTitle>
        <CardDescription>
          Preencha as vazões concentradas em L/s diretamente nos trechos.
          Trechos sem contribuição podem ficar como estão. As vazões acumulam
          para jusante sem coeficientes de pico.
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {progress
              ? `Salvando ${progress.completed} de ${progress.total}...`
              : `${dirtyRows.length} ${dirtyRows.length === 1 ? "linha alterada" : "linhas alteradas"} em todas as páginas`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy || !network.data.segments.length}
              onClick={() => {
                const key = `new:${crypto.randomUUID()}`;
                setExtraRows((current) => [
                  ...current,
                  { key, label: "Nova contribuição", draft: emptyDraft },
                ]);
                setPage(Math.floor(rows.length / pageSize));
              }}
            >
              <Plus className="size-4" />
              Adicionar contribuição
            </Button>
            <Button onClick={submit} disabled={busy || !hasChanges}>
              <Save className="size-4" />
              {save.isPending ? "Salvando..." : "Salvar todos"}
            </Button>
          </div>
        </div>
        <Table className="min-w-[1060px]">
          <TableHeader>
            <TableRow>
              {[
                "Trecho / nó",
                "Nome",
                "Tipo",
                "Destino",
                "Inicial (L/s)",
                "Final (L/s)",
                "Situação",
                "Ações",
              ].map((label) => (
                <TableHead key={label}>{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => {
              const draft = drafts[row.key] ?? row.draft;
              const dirty = dirtyRows.some((item) => item.key === row.key);
              const error = errors[row.key];
              const errorId = `contribution-${row.key}-error`;
              return (
                <TableRow key={row.key} data-invalid={Boolean(error)}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="min-w-52">
                    <Input
                      aria-label={`Nome da contribuição ${row.label}`}
                      value={draft.name}
                      maxLength={120}
                      disabled={busy}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? errorId : undefined}
                      onChange={(event) =>
                        update(row, { name: event.target.value })
                      }
                    />
                    {error && (
                      <p
                        id={errorId}
                        role="alert"
                        className="mt-1 max-w-60 whitespace-normal text-sm text-destructive"
                      >
                        {error}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={draft.type}
                      disabled={busy}
                      onValueChange={(type) =>
                        update(row, { type: type as Draft["type"] })
                      }
                    >
                      <SelectTrigger
                        aria-label={`Tipo da contribuição ${row.label}`}
                        className="w-full min-w-32"
                      >
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
                  </TableCell>
                  <TableCell>
                    <Select
                      value={draft.target || "unset"}
                      disabled={busy}
                      onValueChange={(target) =>
                        update(row, {
                          target: target === "unset" ? "" : target,
                        })
                      }
                    >
                      <SelectTrigger
                        aria-label={`Destino da contribuição ${row.label}`}
                        className="w-full min-w-36"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Destino...</SelectItem>
                        <SelectGroup>
                          <SelectLabel>Trechos</SelectLabel>
                          {network.data.segments.map((segment) => (
                            <SelectItem
                              key={segment.id}
                              value={`segment:${segment.id}`}
                            >
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
                  </TableCell>
                  {(["initialLps", "finalLps"] as const).map((key) => (
                    <TableCell key={key}>
                      <Input
                        className="min-w-28"
                        type="number"
                        min="0"
                        step="any"
                        aria-label={`Vazão ${key === "initialLps" ? "inicial" : "final"} (L/s) ${row.label}`}
                        value={draft[key]}
                        disabled={busy}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? errorId : undefined}
                        onChange={(event) =>
                          update(row, { [key]: event.target.value })
                        }
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <span
                      className={
                        dirty
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-muted-foreground"
                      }
                    >
                      {error
                        ? "Revisar"
                        : dirty
                          ? "Não salvo"
                          : row.id
                            ? "Salvo"
                            : "Sem contribuição"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.id ? (
                      <ConfirmButton
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Excluir ${row.draft.name}`}
                        disabled={busy}
                        title={`Excluir a contribuição ${row.draft.name}?`}
                        description="Esta contribuição deixará de compor as vazões do projeto. Recalcule o dimensionamento após a exclusão."
                        confirmLabel="Excluir contribuição"
                        onConfirm={() => remove.mutate(row)}
                      >
                        <Trash2 className="size-4" />
                      </ConfirmButton>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={
                          busy ||
                          (!dirty &&
                            !extraRows.some((item) => item.key === row.key))
                        }
                        onClick={() => clearRow(row.key)}
                      >
                        {row.key.startsWith("new:") ? "Remover" : "Limpar"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  Nenhum trecho cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            {rows.length
              ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, rows.length)} de ${rows.length} linhas`
              : "0 linhas"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span>Linhas por página</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(0);
              }}
            >
              <SelectTrigger aria-label="Linhas por página">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Página anterior"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span aria-live="polite">
              Página {currentPage + 1} de {pageCount}
            </span>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Próxima página"
              disabled={currentPage + 1 >= pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        {Object.keys(errors).length > 0 && (
          <Feedback
            tone="error"
            title="Revise as linhas indicadas"
            description="As alterações foram mantidas. Corrija os dados e clique em Salvar todos."
          />
        )}
        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
        {(save.isError || remove.isError) && (
          <RequestError
            title="Não foi possível atualizar as contribuições"
            error={save.error ?? remove.error}
          />
        )}
      </CardContent>
    </Card>
  );
}
