"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, FilterX, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { projectQueryKeys } from "@/api/client/query-keys";
import { getErrorMessage, parseClientJson } from "@/api/client/response";
import {
  type ProjectAuditItem,
  projectAuditPageSchema,
} from "@/api/contracts/design";
import { useUnsavedChanges } from "@/components/project/unsaved-changes-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auditDestination } from "@/lib/audit-destination";
import { AuditLoading } from "./audit-loading";

const operations = {
  CREATE: "Criação",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
  IMPORT: "Importação",
  CALCULATE: "Cálculo",
  VALIDATE: "Validação",
  DECIDE: "Decisão",
  EXPORT: "Exportação",
} as const;
const areas = {
  GENERAL_DATA: "Dados gerais",
  HYDRAULICS: "Hidráulica",
  TOPOLOGY: "Topologia",
  SURVEY: "Levantamento",
  PAVING: "Pavimentação",
  FLOWS: "Vazões",
  VALIDATION: "Validação",
  RESULTS: "Resultados",
  EXPORT: "Exportação",
} as const;
const entityTypes = {
  PROJECT: "Projeto",
  NODE: "Nó",
  SEGMENT: "Trecho",
  SINGULAR_CONTRIBUTION: "Contribuição singular",
  WAIVER: "Aprovação de exceção",
  NONCONFORMITY: "Não conformidade",
  PARAMETERS: "Parâmetros",
  DESIGN_SNAPSHOT: "Registro de dimensionamento",
  EXPORT: "Documento exportado",
} as const;
const fieldLabels: Record<string, string> = {
  angle: "Ângulo",
  name: "Nome",
  code: "Código",
  contractor: "Contratante",
  technicalManager: "Responsável técnico",
  location: "Localidade",
  status: "Status",
  terrainElevation: "Cota do terreno",
  invertElevation: "Cota de fundo",
  upstreamInvert: "Cota de montante",
  downstreamInvert: "Cota de jusante",
  upstreamNodeId: "Nó de montante",
  downstreamNodeId: "Nó de jusante",
  hasDropTube: "Tubo de queda",
  length: "Comprimento",
  slope: "Declividade",
  elementType: "Tipo de elemento",
  receivesDryWeatherFlow: "Recebe vazão de tempo seco",
  pavementType: "Tipo de pavimento",
  surfaceMaterial: "Material da superfície",
  surfaceCondition: "Condição da superfície",
  pavementNotes: "Observações da pavimentação",
  fixedDiameterMm: "Diâmetro fixado",
  material: "Material da tubulação",
  initialLps: "Vazão inicial",
  finalLps: "Vazão final",
  initialPopulation: "População inicial",
  finalPopulation: "População final",
  returnCoefficient: "Coeficiente de retorno",
  perCapitaFlow: "Contribuição per capita",
  infiltrationRate: "Taxa de infiltração",
  peakDailyFactor: "Coeficiente do dia de maior consumo",
  peakHourlyFactor: "Coeficiente da hora de maior consumo",
  manningCoefficient: "Coeficiente de Manning",
  defaultNetworkMaterial: "Material padrão da rede",
  materialSwitch: "Troca de material",
  revision: "Revisão",
  type: "Tipo",
  format: "Formato",
  sizeBytes: "Tamanho do arquivo",
  trigger: "Origem do registro",
  rulesetVersionId: "Versão das regras",
  contentSha256: "Hash do conteúdo",
  nodeCount: "Quantidade de nós",
  segmentCount: "Quantidade de trechos",
  ruleCode: "Regra",
  parameter: "Parâmetro",
  value: "Valor",
  downgradeTo: "Severidade aprovada",
};
const summaryLabels: Record<string, string> = {
  "Project created": "Projeto criado",
  "Project data updated": "Dados gerais do projeto atualizados",
  "Hydraulic parameters updated": "Parâmetros hidráulicos atualizados",
  "DXF imported": "DXF importado",
  "Node created": "Nó criado",
  "Node updated": "Nó atualizado",
  "Node deleted": "Nó excluído",
  "Node survey data updated": "Dados de levantamento do nó atualizados",
  "Segment created": "Trecho criado",
  "Segment updated": "Trecho atualizado",
  "Segment deleted": "Trecho excluído",
  "Segment survey data updated": "Dados de levantamento do trecho atualizados",
  "Segment pavement data updated":
    "Dados de pavimentação do trecho atualizados",
  "Singular contribution created": "Contribuição singular criada",
  "Singular contribution updated": "Contribuição singular atualizada",
  "Singular contribution deleted": "Contribuição singular excluída",
  "Waiver created": "Aprovação de exceção criada",
  "Waiver deleted": "Aprovação de exceção excluída",
  "Nonconformity decision recorded":
    "Decisão sobre não conformidade registrada",
  "Project validation updated": "Situação da validação atualizada",
  "Design snapshot created": "Registro de dimensionamento criado",
  "Document exported": "Documento exportado",
};

type Option = "all" | string;

function dateBoundary(date: string, nextDay = false) {
  if (!date) return undefined;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day + (nextDay ? 1 : 0)).toISOString();
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "")
    return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function AuditChanges({ item }: { item: ProjectAuditItem }) {
  if (item.changes === null) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        Comparação não disponível para este registro anterior à auditoria
        estruturada.
      </p>
    );
  }
  if (item.changes.length === 0) return null;
  return (
    <details className="mt-3 rounded-md border bg-muted/20 px-3 py-2 text-xs">
      <summary className="cursor-pointer font-medium">
        {item.changes.length}{" "}
        {item.changes.length === 1 ? "campo alterado" : "campos alterados"}
      </summary>
      <dl className="mt-3 grid gap-3">
        {item.changes.map((change) => (
          <div
            key={change.field}
            className="grid gap-1 sm:grid-cols-[minmax(8rem,0.7fr)_1fr_auto_1fr] sm:items-center"
          >
            <dt className="font-medium">
              {fieldLabels[change.field] ?? change.field}
            </dt>
            <dd className="break-words rounded bg-background px-2 py-1 text-muted-foreground">
              {formatValue(change.before)}
            </dd>
            <ArrowRight
              aria-hidden="true"
              className="hidden size-3 text-muted-foreground sm:block"
            />
            <dd className="break-words rounded bg-background px-2 py-1">
              {formatValue(change.after)}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function AuditEvent({
  projectId,
  item,
}: {
  projectId: string;
  item: ProjectAuditItem;
}) {
  const router = useRouter();
  const { requestNavigation } = useUnsavedChanges();
  const destination = auditDestination(projectId, item);
  return (
    <li className="relative border-l-2 border-border pb-7 pl-5 last:border-transparent last:pb-0">
      <span
        aria-hidden="true"
        className="absolute -left-[5px] top-2 size-2 rounded-full bg-primary"
      />
      <article className="rounded-lg border border-border/80 bg-card/60 p-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  item.operation === "DELETE" ? "destructive" : "secondary"
                }
              >
                {operations[item.operation]}
              </Badge>
              <Badge variant="outline">{areas[item.area]}</Badge>
            </div>
            <h3 className="mt-2 text-sm font-semibold">
              {summaryLabels[item.summary] ?? item.summary}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.entityLabel ??
                (item.entityType
                  ? entityTypes[item.entityType]
                  : "Projeto")}{" "}
              · {item.actorLabel}
            </p>
          </div>
          <time
            dateTime={item.occurredAt}
            className="shrink-0 text-xs tabular-nums text-muted-foreground"
          >
            {new Date(item.occurredAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </time>
        </div>
        <AuditChanges item={item} />
        <div className="mt-3 flex items-center justify-end">
          {destination ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                requestNavigation(() => router.push(destination.href))
              }
            >
              {destination.label}
              <ExternalLink aria-hidden="true" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Elemento excluído — destino indisponível
            </span>
          )}
        </div>
      </article>
    </li>
  );
}

export function ProjectAudit({ projectId }: { projectId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isUpdatingUrl, startTransition] = useTransition();
  const [query, setQuery] = useState(() => searchParams.get("query") ?? "");
  const [from, setFrom] = useState(() => searchParams.get("from") ?? "");
  const [to, setTo] = useState(() => searchParams.get("to") ?? "");
  const [operation, setOperation] = useState<Option>(
    () => searchParams.get("operations") ?? "all",
  );
  const [area, setArea] = useState<Option>(
    () => searchParams.get("areas") ?? "all",
  );
  const [entityType, setEntityType] = useState<Option>(
    () => searchParams.get("entityTypes") ?? "all",
  );
  const [actorId, setActorId] = useState<Option>(
    () => searchParams.get("actorId") ?? "all",
  );
  const deferredQuery = useDeferredValue(query.trim());

  const apiFilters = useMemo(() => {
    const params = new URLSearchParams();
    if (deferredQuery) params.set("query", deferredQuery);
    const fromInstant = dateBoundary(from);
    const toInstant = dateBoundary(to, true);
    if (fromInstant) params.set("from", fromInstant);
    if (toInstant) params.set("to", toInstant);
    if (operation !== "all") params.set("operations", operation);
    if (area !== "all") params.set("areas", area);
    if (entityType !== "all") params.set("entityTypes", entityType);
    if (actorId !== "all") params.set("actorId", actorId);
    params.set("size", "20");
    return params.toString();
  }, [actorId, area, deferredQuery, entityType, from, operation, to]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredQuery) params.set("query", deferredQuery);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (operation !== "all") params.set("operations", operation);
    if (area !== "all") params.set("areas", area);
    if (entityType !== "all") params.set("entityTypes", entityType);
    if (actorId !== "all") params.set("actorId", actorId);
    const next = params.toString();
    startTransition(() =>
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false }),
    );
  }, [
    actorId,
    area,
    deferredQuery,
    entityType,
    from,
    operation,
    pathname,
    router,
    to,
  ]);

  const audit = useInfiniteQuery({
    queryKey: projectQueryKeys.audit(projectId, apiFilters),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam, signal }) => {
      const params = new URLSearchParams(apiFilters);
      if (pageParam) params.set("cursor", pageParam);
      return parseClientJson(
        await fetch(`/api/projects/${projectId}/audit?${params}`, { signal }),
        projectAuditPageSchema,
        "Não foi possível carregar a auditoria.",
      );
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: false,
  });
  const items = audit.data?.pages.flatMap((page) => page.items) ?? [];
  const actors = useMemo(() => {
    const values = new Map<string, string>();
    for (const item of items) values.set(item.userId, item.actorLabel);
    if (actorId !== "all" && !values.has(actorId)) values.set(actorId, actorId);
    return [...values.entries()];
  }, [actorId, items]);
  const groups = useMemo(() => {
    const result = new Map<string, ProjectAuditItem[]>();
    for (const item of items) {
      const key = item.occurredAt.slice(0, 10);
      result.set(key, [...(result.get(key) ?? []), item]);
    }
    return [...result.entries()];
  }, [items]);
  const hasFilters = Boolean(
    query ||
      from ||
      to ||
      operation !== "all" ||
      area !== "all" ||
      entityType !== "all" ||
      actorId !== "all",
  );
  const clearFilters = () => {
    setQuery("");
    setFrom("");
    setTo("");
    setOperation("all");
    setArea("all");
    setEntityType("all");
    setActorId("all");
  };

  if (audit.isPending) return <AuditLoading />;
  if (audit.isError)
    return (
      <ErrorState
        title="Não foi possível carregar a auditoria"
        description={getErrorMessage(audit.error)}
        retrying={audit.isFetching}
        onRetry={() => void audit.refetch()}
      />
    );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Auditoria de alterações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Histórico persistido do projeto, com responsável, contexto e valores
          alterados.
        </p>
      </header>
      <section
        aria-label="Filtros da auditoria"
        className="rounded-lg border border-border/80 bg-card/40 p-4"
      >
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <label htmlFor="audit-query" className="relative xl:col-span-2">
            <span className="sr-only">Pesquisar na auditoria</span>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-2.5 size-4 text-muted-foreground"
            />
            <Input
              id="audit-query"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar resumo, elemento ou alteração"
            />
          </label>
          <label
            htmlFor="audit-from"
            className="grid gap-1 text-xs text-muted-foreground"
          >
            De
            <Input
              id="audit-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label
            htmlFor="audit-to"
            className="grid gap-1 text-xs text-muted-foreground"
          >
            Até
            <Input
              id="audit-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger className="w-full" aria-label="Filtrar por operação">
              <SelectValue placeholder="Operação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as operações</SelectItem>
              {Object.entries(operations).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="w-full" aria-label="Filtrar por área">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {Object.entries(areas).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger
              className="w-full"
              aria-label="Filtrar por tipo de elemento"
            >
              <SelectValue placeholder="Elemento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os elementos</SelectItem>
              {Object.entries(entityTypes).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actorId} onValueChange={setActorId}>
            <SelectTrigger
              className="w-full"
              aria-label="Filtrar por responsável"
            >
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {actors.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 flex min-h-8 items-center justify-between gap-3">
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {isUpdatingUrl || audit.isFetching
              ? "Atualizando resultados..."
              : `${items.length} ${items.length === 1 ? "registro carregado" : "registros carregados"}`}
          </p>
          {hasFilters ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={clearFilters}
            >
              <FilterX aria-hidden="true" />
              Limpar filtros
            </Button>
          ) : null}
        </div>
      </section>
      {groups.length ? (
        <div className="space-y-7">
          {groups.map(([date, events]) => (
            <section key={date} aria-labelledby={`audit-date-${date}`}>
              <h2
                id={`audit-date-${date}`}
                className="mb-3 text-sm font-semibold capitalize"
              >
                {new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <ol className="ml-2">
                {events.map((item) => (
                  <AuditEvent key={item.id} projectId={projectId} item={item} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <Feedback
          title="Nenhuma alteração encontrada"
          description="Ajuste os filtros ou aguarde uma nova alteração persistida no projeto."
          actions={
            hasFilters
              ? [{ label: "Limpar filtros", onClick: clearFilters }]
              : undefined
          }
        />
      )}
      {audit.hasNextPage ? (
        <Button
          className="self-center"
          variant="outline"
          disabled={audit.isFetchingNextPage}
          onClick={() => void audit.fetchNextPage()}
        >
          {audit.isFetchingNextPage
            ? "Carregando..."
            : "Carregar alterações anteriores"}
        </Button>
      ) : null}
    </div>
  );
}
