"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
}: {
  node: Node;
  projectId: string;
  onDirty: DirtyChange;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    register,
    reset,
    handleSubmit,
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
    onSuccess: async (saved) => {
      reset({ terrainElevation: saved.terrainElevation });
      toast.success(`Cota do nó ${node.code} salva.`, {
        description:
          "Recalcule o dimensionamento para atualizar os resultados.",
      });
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
      await invalidateProjectDependents(queryClient, projectId);
      router.refresh();
    },
  });
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
          disabled={save.isPending}
          {...register("terrainElevation", { setValueAs: nullableNumber })}
        />
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          disabled={!isDirty || save.isPending}
          onClick={() => void handleSubmit((values) => save.mutate(values))()}
        >
          {save.isPending ? "Salvando..." : "Salvar cota"}
        </Button>
        {errors.terrainElevation && (
          <p role="alert" className="text-sm text-destructive">
            Informe uma cota numérica válida.
          </p>
        )}
        {save.isError && (
          <RequestError
            title="Não foi possível salvar"
            error={save.error}
            onRetry={() => void handleSubmit((values) => save.mutate(values))()}
            retrying={save.isPending}
          />
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
}: {
  segment: Segment;
  projectId: string;
  mode: Mode;
  onDirty: DirtyChange;
  nodeCodes: Map<string, string>;
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
    mutationFn: async (values: SegmentFieldData) =>
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
    onSuccess: async (saved) => {
      reset(segmentFieldDataSchema.parse(saved));
      toast.success(`Dados do trecho ${segment.code} salvos.`, {
        description:
          "Recalcule o dimensionamento para atualizar os resultados.",
      });
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
      await invalidateProjectDependents(queryClient, projectId);
      router.refresh();
    },
  });
  return (
    <TableRow
      id={`segment-${segment.id}`}
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
                  disabled={save.isPending}
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
                  disabled={save.isPending}
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
              disabled={save.isPending}
              {...register("fixedDiameterMm", { setValueAs: nullableNumber })}
            />
          </TableCell>
          <TableCell>
            <Input
              maxLength={100}
              placeholder="Material do projeto"
              aria-label={`Material ${segment.code}`}
              disabled={save.isPending}
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
                  disabled={save.isPending}
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
                  disabled={save.isPending}
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
                  disabled={save.isPending}
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
              disabled={save.isPending}
              {...register("pavementNotes", { setValueAs: nullableText })}
            />
          </TableCell>
        </>
      )}
      <TableCell>
        <Button
          size="sm"
          disabled={!isDirty || save.isPending}
          onClick={() => void handleSubmit((values) => save.mutate(values))()}
        >
          {mode === "survey" ? (
            save.isPending ? (
              "Salvando..."
            ) : (
              "Salvar trecho"
            )
          ) : (
            <Save
              className="size-4"
              aria-label={save.isPending ? "Salvando trecho" : "Salvar trecho"}
            />
          )}
        </Button>
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
            onRetry={() => void handleSubmit((values) => save.mutate(values))()}
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
  const [dirtyRows, setDirtyRows] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const isDirty = Object.values(dirtyRows).some(Boolean);
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
        if (index >= 0) setPage(Math.floor(index / 5));
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
  }, [network.data, mode, isDirty]);
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
  const visibleSegments =
    mode === "survey"
      ? filteredSegments
      : filteredSegments.slice(page * 5, page * 5 + 5);
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {network.data.segments.length} trechos · {network.data.nodes.length}{" "}
          nós. Salve cada linha alterada antes de calcular.
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
      {isDirty && (
        <p role="status" className="text-sm text-amber-700 dark:text-amber-300">
          Existem alterações não salvas. Salve as linhas alteradas ou saia e
          descarte as alterações.
        </p>
      )}
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
                  <TableHead>Ação</TableHead>
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
                    />
                  ))}
              </TableBody>
            </Table>
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
              disabled={isDirty}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              className="mb-4 max-w-96"
            />
          )}
          <Table>
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
                  {mode === "survey" ? "Ação" : "Status / ação"}
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
              {visibleSegments.map((segment) => (
                <SegmentRow
                  key={segment.id}
                  segment={segment}
                  projectId={projectId}
                  mode={mode}
                  onDirty={onDirty}
                  nodeCodes={nodeCodes}
                />
              ))}
            </TableBody>
          </Table>
          {mode !== "survey" && (
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {Math.min((page + 1) * 5, filteredSegments.length)} de{" "}
                {filteredSegments.length} trechos
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isDirty || page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    isDirty || (page + 1) * 5 >= filteredSegments.length
                  }
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
