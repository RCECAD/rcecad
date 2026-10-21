"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  invalidateProjectDependents,
  projectQueryKeys,
} from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
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

type Mode = "survey" | "paving" | "contributions";
type Segment = z.infer<typeof segmentResponseSchema>;
type Node = z.infer<typeof hydraulicNodeResponseSchema>;
type DirtyChange = (key: string, dirty: boolean) => void;
const selectClass =
  "h-9 w-full min-w-40 rounded-md border border-input bg-background px-2 text-sm";
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
    resolver: zodResolver(nodeFieldDataSchema),
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
    <TableRow id={`node-${node.id}`}>
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
          <p role="alert" className="text-sm text-destructive">
            {save.error.message}
          </p>
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
    register,
    reset,
    handleSubmit,
    formState: { isDirty, errors },
  } = useForm<SegmentFieldData>({
    resolver: zodResolver(segmentFieldDataSchema),
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
    <TableRow id={`segment-${segment.id}`}>
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
            <select
              aria-label={`Tipo de elemento ${segment.code}`}
              className={selectClass}
              disabled={save.isPending}
              {...register("elementType", { setValueAs: nullableText })}
            >
              <option value="">Não informado</option>
              <option value="COLLECTOR">Coletor</option>
              <option value="TRUNK_COLLECTOR">Coletor tronco</option>
              <option value="INTERCEPTOR">Interceptor</option>
              <option value="OUTFALL">Emissário</option>
              <option value="BUILDING_CONNECTION">Ramal predial</option>
            </select>
          </TableCell>
          <TableCell>
            <select
              aria-label={`Contribuição de tempo seco ${segment.code}`}
              className={selectClass}
              disabled={save.isPending}
              {...register("receivesDryWeatherFlow", {
                setValueAs: (value) =>
                  value === "" || value === null
                    ? null
                    : value === "true" || value === true,
              })}
            >
              <option value="">Não respondido</option>
              <option value="false">Não</option>
              <option value="true">Sim</option>
            </select>
          </TableCell>
        </>
      )}
      {mode === "contributions" && (
        <>
          <TableCell>
            <Input
              type="number"
              step="any"
              min="0"
              aria-label={`Contribuição inicial ${segment.code}`}
              disabled={save.isPending}
              {...register("initialSingularContributionLps", {
                setValueAs: (value) =>
                  value === "" ? Number.NaN : Number(value),
              })}
            />
          </TableCell>
          <TableCell>
            <Input
              type="number"
              step="any"
              min="0"
              aria-label={`Contribuição final ${segment.code}`}
              disabled={save.isPending}
              {...register("finalSingularContributionLps", {
                setValueAs: (value) =>
                  value === "" ? Number.NaN : Number(value),
              })}
            />
          </TableCell>
        </>
      )}
      {mode === "paving" && (
        <>
          <TableCell>
            <select
              aria-label={`Categoria de recobrimento ${segment.code}`}
              className={selectClass}
              disabled={save.isPending}
              {...register("pavementType", { setValueAs: nullableText })}
            >
              <option value="">Não informada</option>
              <option value="SIDEWALK">Passeio</option>
              <option value="PAVED_STREET_WITH_CURB_AND_GUTTER">
                Via pavimentada com meio-fio e sarjeta
              </option>
              <option value="UNPAVED_OR_UNDEFINED_GRADE">
                Via de terra ou greide indefinido
              </option>
            </select>
          </TableCell>
          <TableCell>
            <select
              aria-label={`Material superficial ${segment.code}`}
              className={selectClass}
              disabled={save.isPending}
              {...register("surfaceMaterial", { setValueAs: nullableText })}
            >
              <option value="">Não informado</option>
              <option value="ASPHALT">Asfalto</option>
              <option value="PAVING_STONE">Paralelepípedo</option>
              <option value="GRAVEL">Cascalho</option>
            </select>
          </TableCell>
          <TableCell>
            <select
              aria-label={`Condição superficial ${segment.code}`}
              className={selectClass}
              disabled={save.isPending}
              {...register("surfaceCondition", { setValueAs: nullableText })}
            >
              <option value="">Não informada</option>
              <option value="GOOD">Boa</option>
              <option value="FAIR">Regular</option>
              <option value="POOR">Ruim</option>
            </select>
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
          {save.isPending ? "Salvando..." : "Salvar trecho"}
        </Button>
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-sm text-destructive">
            Revise os campos. As contribuições devem ser números iguais ou
            maiores que zero.
          </p>
        )}
        {save.isError && (
          <p role="alert" className="text-sm text-destructive">
            {save.error.message}
          </p>
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
  if (network.isPending)
    return <PageLoading label="Carregando nós e trechos" />;
  if (network.isError)
    return (
      <ErrorState
        title="Não foi possível carregar a rede"
        description={network.error.message}
        onRetry={() => void network.refetch()}
      />
    );
  if (network.data.segments.length === 0)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Este projeto ainda não tem rede</CardTitle>
          <CardDescription>
            Importe um DXF na Home para criar um projeto com nós e trechos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/home">Ir para a Home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  const nodeCodes = new Map(
    network.data.nodes.map((node) => [node.id, node.code]),
  );
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const matches = (code: string) =>
    code.toLocaleLowerCase("pt-BR").includes(term);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
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
      <Input
        type="search"
        aria-label="Buscar nó ou trecho"
        placeholder="Buscar pelo código do nó ou trecho..."
        value={search}
        disabled={isDirty}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-md"
      />
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
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "survey"
              ? "Dados de campo dos trechos"
              : mode === "paving"
                ? "Pavimentação por trecho"
                : "Contribuições concentradas por trecho"}
          </CardTitle>
          <CardDescription>
            {mode === "survey"
              ? "Responda se cada trecho recebe contribuição de tempo seco e identifique o tipo de elemento."
              : mode === "paving"
                ? "A categoria de recobrimento é usada no cálculo. Material superficial e condição descrevem a pavimentação existente."
                : "Informe as contribuições iniciais e finais em L/s que entram em cada trecho. Estes são os valores utilizados no dimensionamento; zero significa ausência de contribuição concentrada."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trecho</TableHead>
                {mode === "survey" && (
                  <>
                    <TableHead>Comprimento (m)</TableHead>
                    <TableHead>Tipo de elemento</TableHead>
                    <TableHead>Recebe contribuição de tempo seco?</TableHead>
                  </>
                )}
                {mode === "contributions" && (
                  <>
                    <TableHead>Inicial (L/s)</TableHead>
                    <TableHead>Final (L/s)</TableHead>
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
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {network.data.segments
                .filter((segment) => matches(segment.code))
                .map((segment) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
