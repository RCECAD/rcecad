"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  invalidateProjectDependents,
  projectQueryKeys,
} from "@/api/client/query-keys";
import { getErrorMessage, parseClientJson } from "@/api/client/response";
import {
  type NodeFieldData,
  nodeFieldDataSchema,
  type SegmentFieldData,
  segmentFieldDataSchema,
} from "@/api/contracts/design";
import {
  hydraulicNodeResponseSchema,
  type ProjectDetailResponse,
  projectDetailResponseSchema,
  segmentResponseSchema,
} from "@/api/contracts/spring";
import { useUnsavedChanges } from "@/components/project/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Feedback, RequestError } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/page-state";
import {
  Select,
  SelectContent,
  SelectItem,
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
import { portugueseValidation } from "@/lib/form-validation";

type Mode = "survey" | "paving";
type Segment = z.infer<typeof segmentResponseSchema>;
type Node = z.infer<typeof hydraulicNodeResponseSchema>;
type DirtyChange = (key: string, dirty: boolean) => void;
type RowSave = {
  validate: () => Promise<boolean>;
  save: () => Promise<unknown>;
};
type RegisterRow = (key: string, row: RowSave | null) => void;
type RowKind = "node" | "segment";

function useBatchRow(key: string, row: RowSave, registerRow: RegisterRow) {
  useEffect(() => {
    registerRow(key, row);
    return () => registerRow(key, null);
  }, [key, row, registerRow]);
}

function RowStatus({ dirty, saving }: { dirty: boolean; saving: boolean }) {
  return (
    <span
      className={`inline-block w-24 whitespace-nowrap ${dirty ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}
    >
      {saving ? "Salvando..." : dirty ? "Não salvo" : "Salvo"}
    </span>
  );
}

function BatchSaveControls({
  kind,
  count,
  busy,
  progress,
  message,
  onSave,
  allPages = false,
}: {
  kind: RowKind;
  count: number;
  busy: boolean;
  progress?: { completed: number; total: number };
  message?: string;
  onSave: () => void;
  allPages?: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div
        className="space-y-1 text-sm text-muted-foreground"
        aria-live="polite"
      >
        <p>
          {progress
            ? `Salvando ${progress.completed} de ${progress.total} linhas...`
            : `${count} ${count === 1 ? "linha alterada" : "linhas alteradas"}${allPages ? " em todas as páginas" : ""}`}
        </p>
        {message && <p>{message}</p>}
      </div>
      <Button
        type="button"
        disabled={busy || count === 0}
        aria-label={
          kind === "node" ? "Salvar todos os nós" : "Salvar todos os trechos"
        }
        onClick={onSave}
      >
        <Save aria-hidden="true" className="size-4" />
        {progress ? "Salvando..." : "Salvar todos"}
      </Button>
    </div>
  );
}

const nullableText = (value: string) => (value === "" ? null : value);
const nullableNumber = (value: unknown) =>
  value === "" || value === null ? null : Number(value);

function useRowDirty(key: string, dirty: boolean, onDirty: DirtyChange) {
  useEffect(() => {
    onDirty(key, dirty);
  }, [key, dirty, onDirty]);
  useEffect(() => () => onDirty(key, false), [key, onDirty]);
}

function NodeRow({
  node,
  projectId,
  onDirty,
  registerRow,
  batchSaving,
}: {
  node: Node;
  projectId: string;
  onDirty: DirtyChange;
  registerRow: RegisterRow;
  batchSaving: boolean;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    reset,
    trigger,
    getValues,
    formState: { isDirty, errors },
  } = useForm<NodeFieldData>({
    resolver: zodResolver(nodeFieldDataSchema, portugueseValidation),
    defaultValues: { terrainElevation: node.terrainElevation },
  });
  useEffect(() => {
    reset({ terrainElevation: node.terrainElevation });
  }, [node.terrainElevation, reset]);
  useRowDirty(`node-${node.id}`, isDirty, onDirty);
  const save = useMutation({
    mutationFn: async (values: NodeFieldData) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/nodes/${node.id}/field-data`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }),
        hydraulicNodeResponseSchema,
        "Não foi possível salvar a cota.",
      ),
    onSuccess: (saved) => {
      reset({ terrainElevation: saved.terrainElevation });
      queryClient.setQueryData<ProjectDetailResponse>(
        projectQueryKeys.network(projectId),
        (current) =>
          current && {
            ...current,
            nodes: current.nodes.map((item) =>
              item.id === saved.id ? saved : item,
            ),
          },
      );
    },
  });
  useBatchRow(
    `node-${node.id}`,
    {
      validate: () => trigger(undefined, { shouldFocus: true }),
      save: () => save.mutateAsync(getValues()),
    },
    registerRow,
  );
  return (
    <TableRow
      id={`node-${node.id}`}
      className="scroll-mt-6 target:bg-primary/5"
    >
      <TableCell className="font-medium">{node.code}</TableCell>
      <TableCell>
        {node.invertElevation.toLocaleString("pt-BR", {
          maximumFractionDigits: 4,
        })}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="any"
          aria-label={`Cota de terreno ${node.code}`}
          aria-invalid={Boolean(errors.terrainElevation)}
          disabled={batchSaving}
          {...register("terrainElevation", { setValueAs: nullableNumber })}
        />
      </TableCell>
      <TableCell>
        <RowStatus dirty={isDirty} saving={save.isPending} />
        {errors.terrainElevation && (
          <p role="alert" className="text-sm text-destructive">
            Informe uma cota numérica válida.
          </p>
        )}
        {save.isError && (
          <RequestError title="Não foi possível salvar" error={save.error} />
        )}
      </TableCell>
    </TableRow>
  );
}

function SegmentRow({
  segment,
  projectId,
  mode,
  onDirty,
  nodeCodes,
  registerRow,
  batchSaving,
  hidden = false,
}: {
  segment: Segment;
  projectId: string;
  mode: Mode;
  onDirty: DirtyChange;
  nodeCodes: Map<string, string>;
  registerRow: RegisterRow;
  batchSaving: boolean;
  hidden?: boolean;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  // PUT replaces the whole field-data block. Preserve fields edited in other tabs.
  const initial = useMemo(
    () => segmentFieldDataSchema.parse(segment),
    [segment],
  );
  const {
    control,
    register,
    reset,
    handleSubmit,
    trigger,
    getValues,
    formState: { isDirty, errors },
  } = useForm<SegmentFieldData>({
    resolver: zodResolver(segmentFieldDataSchema, portugueseValidation),
    defaultValues: initial,
  });
  useEffect(() => {
    reset(initial);
  }, [initial, reset]);
  useRowDirty(`segment-${segment.id}`, isDirty, onDirty);
  const save = useMutation({
    mutationFn: async ({
      values,
    }: {
      values: SegmentFieldData;
      batch?: boolean;
    }) =>
      parseClientJson(
        await fetch(
          `/api/projects/${projectId}/segments/${segment.id}/field-data`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          },
        ),
        segmentResponseSchema,
        "Não foi possível salvar o trecho.",
      ),
    onSuccess: async (saved, { batch }) => {
      reset(segmentFieldDataSchema.parse(saved));
      queryClient.setQueryData<ProjectDetailResponse>(
        projectQueryKeys.network(projectId),
        (current) =>
          current && {
            ...current,
            segments: current.segments.map((item) =>
              item.id === saved.id ? saved : item,
            ),
          },
      );
      if (!batch) {
        toast.success(`Dados do trecho ${segment.code} salvos.`, {
          description:
            "Recalcule o dimensionamento para atualizar os resultados.",
        });
        await invalidateProjectDependents(queryClient, projectId);
        router.refresh();
      }
    },
  });
  useBatchRow(
    `segment-${segment.id}`,
    {
      validate: () => trigger(undefined, { shouldFocus: true }),
      save: () => save.mutateAsync({ values: getValues(), batch: true }),
    },
    registerRow,
  );
  const disabled = batchSaving || save.isPending;
  return (
    <TableRow
      id={`segment-${segment.id}`}
      hidden={hidden}
      className="scroll-mt-6 target:bg-primary/5"
    >
      <TableCell className="font-medium">
        {segment.code}
        <span className="block text-xs text-muted-foreground">
          {nodeCodes.get(segment.upstreamNodeId)} →{" "}
          {nodeCodes.get(segment.downstreamNodeId)}
        </span>
      </TableCell>
      {mode === "survey" && (
        <>
          <TableCell>
            {segment.length.toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
            })}
          </TableCell>
          <TableCell>
            <Controller
              control={control}
              name="elementType"
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  value={field.value ?? "unset"}
                  onValueChange={(value) =>
                    field.onChange(value === "unset" ? null : value)
                  }
                  disabled={disabled}
                >
                  <SelectTrigger
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-label={`Tipo de elemento ${segment.code}`}
                    aria-invalid={fieldState.invalid}
                    className="w-full min-w-40"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Não informado</SelectItem>
                    <SelectItem value="COLLECTOR">Coletor</SelectItem>
                    <SelectItem value="TRUNK_COLLECTOR">
                      Coletor tronco
                    </SelectItem>
                    <SelectItem value="INTERCEPTOR">Interceptor</SelectItem>
                    <SelectItem value="OUTFALL">Emissário</SelectItem>
                    <SelectItem value="BUILDING_CONNECTION">
                      Ramal predial
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </TableCell>
          <TableCell>
            <Controller
              control={control}
              name="receivesDryWeatherFlow"
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  value={field.value === null ? "unset" : String(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value === "unset" ? null : value === "true")
                  }
                  disabled={disabled}
                >
                  <SelectTrigger
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-label={`Contribuição de tempo seco ${segment.code}`}
                    aria-invalid={fieldState.invalid}
                    className="w-full min-w-40"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Não respondido</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </TableCell>
        </>
      )}
      {mode === "survey" && (
        <>
          <TableCell>
            <Input
              type="number"
              step="1"
              min="1"
              placeholder="Automático"
              aria-label={`DN imposto ${segment.code}`}
              disabled={disabled}
              {...register("fixedDiameterMm", { setValueAs: nullableNumber })}
            />
          </TableCell>
          <TableCell>
            <Input
              maxLength={100}
              placeholder="Material do projeto"
              aria-label={`Material ${segment.code}`}
              disabled={disabled}
              {...register("material", {
                setValueAs: (value: string | null) => value?.trim() || null,
              })}
            />
          </TableCell>
        </>
      )}
      {mode === "paving" && (
        <>
          <TableCell>
            <Controller
              control={control}
              name="pavementType"
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  value={field.value ?? "unset"}
                  onValueChange={(value) =>
                    field.onChange(value === "unset" ? null : value)
                  }
                  disabled={disabled}
                >
                  <SelectTrigger
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-label={`Categoria de recobrimento ${segment.code}`}
                    aria-invalid={fieldState.invalid}
                    className="w-full min-w-40"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Não informada</SelectItem>
                    <SelectItem value="SIDEWALK">Passeio</SelectItem>
                    <SelectItem value="PAVED_STREET_WITH_CURB_AND_GUTTER">
                      Via pavimentada com meio-fio e sarjeta
                    </SelectItem>
                    <SelectItem value="UNPAVED_OR_UNDEFINED_GRADE">
                      Via de terra ou greide indefinido
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </TableCell>
          <TableCell>
            <Controller
              control={control}
              name="surfaceMaterial"
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  value={field.value ?? "unset"}
                  onValueChange={(value) =>
                    field.onChange(value === "unset" ? null : value)
                  }
                  disabled={disabled}
                >
                  <SelectTrigger
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-label={`Material superficial ${segment.code}`}
                    aria-invalid={fieldState.invalid}
                    className="w-full min-w-40"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Não informado</SelectItem>
                    <SelectItem value="ASPHALT">Asfalto</SelectItem>
                    <SelectItem value="PAVING_STONE">Paralelepípedo</SelectItem>
                    <SelectItem value="GRAVEL">Cascalho</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </TableCell>
          <TableCell>
            <Controller
              control={control}
              name="surfaceCondition"
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  value={field.value ?? "unset"}
                  onValueChange={(value) =>
                    field.onChange(value === "unset" ? null : value)
                  }
                  disabled={disabled}
                >
                  <SelectTrigger
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-label={`Condição superficial ${segment.code}`}
                    aria-invalid={fieldState.invalid}
                    className="w-full min-w-40"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Não informada</SelectItem>
                    <SelectItem value="GOOD">Boa</SelectItem>
                    <SelectItem value="FAIR">Regular</SelectItem>
                    <SelectItem value="POOR">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </TableCell>
          <TableCell>
            <Input
              aria-label={`Observações ${segment.code}`}
              maxLength={1000}
              disabled={disabled}
              {...register("pavementNotes", { setValueAs: nullableText })}
            />
          </TableCell>
        </>
      )}
      <TableCell>
        {mode === "survey" ? (
          <RowStatus dirty={isDirty} saving={save.isPending} />
        ) : (
          <Button
            size="sm"
            disabled={!isDirty || disabled}
            onClick={() =>
              void handleSubmit((values) => save.mutate({ values }))()
            }
          >
            <Save
              className="size-4"
              aria-label={save.isPending ? "Salvando trecho" : "Salvar trecho"}
            />
          </Button>
        )}
        {mode !== "survey" && (
          <span
            className={`ml-2 inline-block rounded-full border px-2 py-0.5 text-xs ${isDirty ? "border-amber-200 bg-amber-50 text-amber-700" : "border-teal-200 bg-teal-50 text-teal-700"}`}
          >
            {isDirty ? "Não salvo" : "Salvo"}
          </span>
        )}
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-sm text-destructive">
            Revise os campos. O DN imposto deve ser um inteiro positivo em mm.
          </p>
        )}
        {save.isError && (
          <RequestError
            title="Não foi possível salvar"
            error={save.error}
            onRetry={
              mode === "paving"
                ? () => void handleSubmit((values) => save.mutate({ values }))()
                : undefined
            }
            retrying={save.isPending}
          />
        )}
      </TableCell>
    </TableRow>
  );
}

export function NetworkFieldEditor({
  projectId,
  mode = "survey",
  onDirtyChange,
}: {
  projectId: string;
  mode?: Mode;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { setHasUnsavedChanges } = useUnsavedChanges();
  const queryClient = useQueryClient();
  const router = useRouter();
  const rows = useRef(new Map<string, RowSave>());
  const saving = useRef(false);
  const [batch, setBatch] = useState<{
    kind: RowKind;
    completed: number;
    total: number;
  } | null>(null);
  const [messages, setMessages] = useState<Partial<Record<RowKind, string>>>(
    {},
  );
  const registerRow = useCallback<RegisterRow>((key, row) => {
    if (row) rows.current.set(key, row);
    else rows.current.delete(key);
  }, []);
  const [dirtyRows, setDirtyRows] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const isDirty = Object.values(dirtyRows).some(Boolean) || batch !== null;
  const dirtyCount = (kind: RowKind) =>
    Object.entries(dirtyRows).filter(
      ([key, dirty]) => dirty && key.startsWith(`${kind}-`),
    ).length;
  async function saveAll(kind: RowKind) {
    if (saving.current) return;
    const pending = Object.entries(dirtyRows)
      .filter(([key, dirty]) => dirty && key.startsWith(`${kind}-`))
      .flatMap(([key]) => {
        const row = rows.current.get(key);
        return row ? [{ key, row }] : [];
      });
    if (!pending.length) return;
    saving.current = true;
    setBatch({ kind, completed: 0, total: pending.length });
    setMessages((current) => ({ ...current, [kind]: undefined }));
    let saved = 0;
    try {
      // Validate the whole selection before sending any changes.
      for (const { key, row } of pending) {
        if (!(await row.validate())) {
          if (mode === "paving") {
            setSearch("");
            const index =
              network.data?.segments.findIndex(
                (segment) => `segment-${segment.id}` === key,
              ) ?? -1;
            if (index >= 0) setPage(Math.floor(index / pageSize));
          }
          setMessages((current) => ({
            ...current,
            [kind]:
              "Revise os campos destacados antes de salvar. Nenhuma linha foi enviada.",
          }));
          return;
        }
      }
      for (const [index, { row }] of pending.entries()) {
        try {
          await row.save();
          saved++;
        } catch {
          // Each row keeps its error and unsaved values for the next attempt.
        }
        setBatch({ kind, completed: index + 1, total: pending.length });
      }
      const failed = pending.length - saved;
      const message = failed
        ? `${saved} de ${pending.length} linhas salvas. ${failed} não foram salvas; tente novamente. Os valores foram mantidos.`
        : `${saved} ${saved === 1 ? "linha salva" : "linhas salvas"}. Recalcule o dimensionamento para atualizar os resultados.`;
      setMessages((current) => ({ ...current, [kind]: message }));
      if (failed)
        toast.error("Algumas linhas não foram salvas.", {
          description: message,
        });
      else
        toast.success(
          kind === "node" ? "Cotas salvas." : "Dados dos trechos salvos.",
          { description: message },
        );
      if (saved > 0) {
        await invalidateProjectDependents(queryClient, projectId);
        router.refresh();
      }
    } finally {
      saving.current = false;
      setBatch(null);
    }
  }
  const onDirty = useCallback<DirtyChange>(
    (key, dirty) =>
      setDirtyRows((current) =>
        current[key] === dirty ? current : { ...current, [key]: dirty },
      ),
    [],
  );
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange, setHasUnsavedChanges]);
  useEffect(() => () => setHasUnsavedChanges(false), [setHasUnsavedChanges]);
  const network = useQuery({
    queryKey: projectQueryKeys.network(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/network`, { signal }),
        projectDetailResponseSchema,
        "Não foi possível carregar a rede.",
      ),
    retry: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (!network.data || isDirty) return;
    let timer: ReturnType<typeof setTimeout>;
    const revealTarget = () => {
      const target = window.location.hash.slice(1);
      if (!/^(node|segment)-/.test(target)) return;
      setSearch("");
      if (mode === "paving") {
        const index = network.data.segments.findIndex(
          (segment) => `segment-${segment.id}` === target,
        );
        if (index >= 0) setPage(Math.floor(index / pageSize));
      }
      timer = setTimeout(
        () =>
          document.getElementById(target)?.scrollIntoView({ block: "center" }),
        0,
      );
    };
    revealTarget();
    window.addEventListener("hashchange", revealTarget);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", revealTarget);
    };
  }, [network.data, mode, isDirty, pageSize]);
  if (network.isPending)
    return <PageLoading label="Carregando nós e trechos" />;
  if (network.isError)
    return (
      <ErrorState
        title="Não foi possível carregar a rede"
        description={getErrorMessage(network.error)}
        retrying={network.isFetching}
        onRetry={() => void network.refetch()}
      />
    );
  if (network.data.segments.length === 0)
    return (
      <Feedback
        title="Este projeto ainda não tem rede"
        description="Cadastre os nós e trechos na topologia para continuar. A importação de um DXF na página inicial cria um novo projeto."
        actions={[
          {
            label: "Cadastrar rede",
            href: `/project/${projectId}/sizing#network-topology`,
          },
          { label: "Ir para importação", href: "/home#import-project" },
        ]}
      />
    );
  const nodeCodes = new Map(
    network.data.nodes.map((node) => [node.id, node.code]),
  );
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const matches = (code: string) =>
    code.toLocaleLowerCase("pt-BR").includes(term);
  const filteredSegments = network.data.segments.filter((segment) =>
    matches(segment.code),
  );
  const pageCount = Math.max(1, Math.ceil(filteredSegments.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleSegments =
    mode === "survey"
      ? filteredSegments
      : filteredSegments.slice(
          currentPage * pageSize,
          (currentPage + 1) * pageSize,
        );
  const visibleSegmentIds = new Set(
    visibleSegments.map((segment) => segment.id),
  );
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {network.data.segments.length} trechos · {network.data.nodes.length}{" "}
          nós.{" "}
          {mode === "survey"
            ? "Use Salvar todos em cada tabela antes de calcular."
            : "Use Salvar todos para salvar as alterações de todas as páginas antes de calcular."}
        </p>
        <Button
          variant="outline"
          disabled={isDirty || network.isFetching}
          onClick={() => void network.refetch()}
        >
          Atualizar rede
        </Button>
      </div>
      {mode === "survey" && (
        <Input
          type="search"
          aria-label="Buscar nó ou trecho"
          placeholder="Buscar pelo código do nó ou trecho..."
          value={search}
          disabled={isDirty}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          className="max-w-md"
        />
      )}
      <p
        role="status"
        aria-hidden={!isDirty}
        className={`text-sm text-amber-700 dark:text-amber-300 ${isDirty ? "" : "invisible"}`}
      >
        Existem alterações não salvas. Use Salvar todos nas tabelas ou saia e
        descarte as alterações.
      </p>
      {mode === "survey" && (
        <Card>
          <CardHeader>
            <CardTitle>Cotas de terreno dos nós</CardTitle>
            <CardDescription>
              Informe as cotas do levantamento em metros. A cota importada é
              exibida apenas como referência; não substitui a cota do terreno.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nó</TableHead>
                  <TableHead>Cota importada (m)</TableHead>
                  <TableHead>Cota de terreno (m)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {network.data.nodes.filter((node) => matches(node.code))
                  .length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Feedback
                        title="Nenhum nó corresponde à busca"
                        actions={[
                          {
                            label: "Limpar busca",
                            onClick: () => setSearch(""),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                )}
                {network.data.nodes
                  .filter((node) => matches(node.code))
                  .map((node) => (
                    <NodeRow
                      key={node.id}
                      node={node}
                      projectId={projectId}
                      onDirty={onDirty}
                      registerRow={registerRow}
                      batchSaving={batch !== null}
                    />
                  ))}
              </TableBody>
            </Table>
            <BatchSaveControls
              kind="node"
              count={dirtyCount("node")}
              busy={batch !== null}
              progress={batch?.kind === "node" ? batch : undefined}
              message={messages.node}
              onSave={() => void saveAll("node")}
            />
          </CardContent>
        </Card>
      )}
      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
        <CardHeader>
          <CardTitle>
            {mode === "survey"
              ? "Dados de campo dos trechos"
              : "Dados de pavimentação por trecho"}
          </CardTitle>
          <CardDescription>
            {mode === "survey"
              ? "Responda se cada trecho recebe contribuição de tempo seco e identifique o tipo de elemento. DN imposto e material são opcionais: em branco, o dimensionamento escolhe o diâmetro e usa o material do projeto."
              : "A categoria de recobrimento é usada no cálculo. Material superficial e condição descrevem a pavimentação existente."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode !== "survey" && (
            <Input
              type="search"
              aria-label="Buscar nó ou trecho"
              placeholder="Buscar por trecho..."
              value={search}
              disabled={batch !== null}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              className="mb-4 max-w-96"
            />
          )}
          {mode === "paving" && (
            <div className="mb-4">
              <BatchSaveControls
                kind="segment"
                count={dirtyCount("segment")}
                busy={batch !== null}
                progress={batch?.kind === "segment" ? batch : undefined}
                message={messages.segment}
                onSave={() => void saveAll("segment")}
                allPages
              />
            </div>
          )}
          <Table
            className={
              mode === "paving" ? "min-w-[1280px] table-fixed" : undefined
            }
          >
            {mode === "paving" && (
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[27%]" />
                <col className="w-[15%]" />
                <col className="w-[14%]" />
                <col className="w-[19%]" />
                <col className="w-[12%]" />
              </colgroup>
            )}
            <TableHeader>
              <TableRow>
                <TableHead>Trecho</TableHead>
                {mode === "survey" && (
                  <>
                    <TableHead>Comprimento (m)</TableHead>
                    <TableHead>Tipo de elemento</TableHead>
                    <TableHead>Recebe contribuição de tempo seco?</TableHead>
                    <TableHead>DN imposto (mm)</TableHead>
                    <TableHead>Material</TableHead>
                  </>
                )}
                {mode === "paving" && (
                  <>
                    <TableHead>Categoria de recobrimento</TableHead>
                    <TableHead>Material superficial</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead>Observações</TableHead>
                  </>
                )}
                <TableHead>
                  {mode === "survey" ? "Status" : "Status / ação"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSegments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={mode === "survey" ? 7 : 6}>
                    <Feedback
                      title="Nenhum trecho corresponde à busca"
                      actions={[
                        {
                          label: "Limpar busca",
                          onClick: () => {
                            setSearch("");
                            setPage(0);
                          },
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              )}
              {/* Keep paginated forms mounted so drafts and batch saves span all pages. */}
              {(mode === "paving"
                ? network.data.segments
                : visibleSegments
              ).map((segment) => (
                <SegmentRow
                  key={segment.id}
                  segment={segment}
                  projectId={projectId}
                  mode={mode}
                  onDirty={onDirty}
                  nodeCodes={nodeCodes}
                  registerRow={registerRow}
                  batchSaving={batch !== null}
                  hidden={
                    mode === "paving" && !visibleSegmentIds.has(segment.id)
                  }
                />
              ))}
            </TableBody>
          </Table>
          {mode === "survey" && (
            <BatchSaveControls
              kind="segment"
              count={dirtyCount("segment")}
              busy={batch !== null}
              progress={batch?.kind === "segment" ? batch : undefined}
              message={messages.segment}
              onSave={() => void saveAll("segment")}
            />
          )}
          {mode !== "survey" && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                {filteredSegments.length
                  ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, filteredSegments.length)} de ${filteredSegments.length} linhas`
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
