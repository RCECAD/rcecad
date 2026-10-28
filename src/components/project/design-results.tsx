"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, GitBranch, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { projectQueryKeys } from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
import {
  isCalculated,
  type NetworkDesign,
  networkDesignSchema,
  type SegmentDesign,
} from "@/api/contracts/design";
import {
  type CalculationMemorial,
  calculationMemorialSchema,
  designSnapshotDetailSchema,
  designSnapshotSchema,
  type ExecutiveSummary,
  executiveSummarySchema,
} from "@/api/contracts/resources";
import {
  type ProjectDetailResponse,
  projectDetailResponseSchema,
} from "@/api/contracts/spring";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { memorialToDesign } from "./memorial-to-design";
import { MemorialTrace } from "./memorial-trace";
import { LongitudinalProfile, NetworkPlan } from "./network-drawing";
import {
  AdoptedParameters,
  designStatusLabels,
  Findings,
  format,
  quantityValue,
  SegmentDetails,
} from "./segment-details";
import { useUnsavedChanges } from "./unsaved-changes-provider";

export { designStatusLabels, quantityValue } from "./segment-details";

const tableColumns = [
  "Trecho",
  "Q ini / fim (L/s)",
  "DN (mm)",
  "Material",
  "Declividade (m/m)",
  "V ini / fim (m/s)",
  "Y/D ini / fim",
  "τ (Pa)",
  "Degrau (m)",
  "Situação",
];
const pair = (
  segment: SegmentDesign,
  initial: string,
  final: string,
  digits = 4,
) =>
  `${format(quantityValue(segment, initial), digits)} / ${format(quantityValue(segment, final), digits)}`;

function situation(segment: SegmentDesign) {
  const critical =
    !isCalculated(segment) ||
    segment.nonconformities.some((n) => n.severity === "CRITICAL");
  const warning =
    isCalculated(segment) &&
    segment.nonconformities.some((n) => n.severity === "WARNING");
  return {
    className: critical
      ? "border-rose-300 bg-rose-50 text-rose-700"
      : warning
        ? "border-amber-300 bg-amber-50 text-amber-700"
        : "border-teal-300 bg-teal-50 text-teal-700",
    text:
      segment.status === "designed" && warning
        ? "Em atenção"
        : designStatusLabels[segment.status],
  };
}

export function DesignResults({
  design,
  tabbed = false,
  summary,
  memorial,
  network,
}: {
  design: NetworkDesign;
  tabbed?: boolean;
  summary?: ExecutiveSummary;
  memorial?: CalculationMemorial;
  network?: ProjectDetailResponse;
}) {
  const project = summary?.project ?? memorial?.identification;
  const [tab, setTab] = useState("summary");
  const [page, setPage] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<string>();
  const visible = (value: string) => !tabbed || tab === value;
  const attention = design.segments.filter(
    (s) =>
      isCalculated(s) &&
      s.nonconformities.some((n) => n.severity === "WARNING") &&
      !s.nonconformities.some((n) => n.severity === "CRITICAL"),
  ).length;
  const noncompliant = design.segments.filter(
    (s) =>
      !isCalculated(s) ||
      s.nonconformities.some((n) => n.severity === "CRITICAL"),
  ).length;
  const compliant = design.segments.length - attention - noncompliant;
  const counts = Object.keys(designStatusLabels).map((status) => ({
    status: status as SegmentDesign["status"],
    count: design.segments.filter((segment) => segment.status === status)
      .length,
  }));
  const tabs = [
    ["summary", "Resumo Executivo"],
    ["table", "Resultados por Trecho"],
    ["memory", "Memória de Cálculo"],
    ["findings", "Não conformidades"],
    ...(network ? [["drawing", "Planta e Perfil"]] : []),
  ];
  return (
    <div className="space-y-6">
      {tabbed && (
        <div
          role="tablist"
          aria-label="Resultados do projeto"
          className="grid grid-cols-2 gap-1 rounded-md bg-card p-1.5 sm:grid-cols-5"
        >
          {tabs.map(([value, text]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              className={`rounded px-3 py-1.5 text-sm font-medium ${tab === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setTab(value)}
            >
              {text}
            </button>
          ))}
        </div>
      )}
      {tabbed && visible("summary") && (
        <>
          <section className="rounded-lg border border-border/80 bg-card/40 px-6 py-4">
            <h2 className="mb-3 text-base font-semibold">
              Identificação do Projeto
            </h2>
            <dl className="grid gap-x-4 gap-y-4 sm:grid-cols-3">
              {[
                ["Nome do projeto", project?.name],
                ["Localidade", project?.location],
                ["Responsável Técnico", project?.technicalManager],
                ["Contratante", project?.contractor],
                ["Revisão", project?.revision],
              ].map(([text, value]) => (
                <div key={text}>
                  <dt className="text-xs text-muted-foreground">{text}</dt>
                  <dd className="mt-1 break-words text-sm">
                    {value || "Não informado"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-lg border border-border/80 bg-card/40 px-6 py-4">
            <h2 className="mb-3 text-base font-semibold">
              Parâmetros Globais Adotados
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Regra de cálculo: {design.rulesetVersionId}
              {summary &&
                ` · ${summary.network.segmentCount} trechos, ${summary.network.nodeCount} nós, ${format(summary.network.totalLengthM, 2)} m de rede`}
            </p>
            <AdoptedParameters items={design.adoptedParameters} />
          </section>
          <section className="rounded-lg border border-border/80 bg-card/40 px-6 py-4">
            <h2 className="mb-3 text-base font-semibold">
              Estatísticas do projeto
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  text: "Total de trechos",
                  count: design.segments.length,
                  Icon: GitBranch,
                  color: "border-slate-300 text-slate-700",
                },
                {
                  text: "Conformes",
                  count: compliant,
                  Icon: CircleCheck,
                  color: "border-teal-300 bg-teal-50 text-teal-700",
                },
                {
                  text: "Em atenção",
                  count: attention,
                  Icon: TriangleAlert,
                  color: "border-amber-300 bg-amber-50 text-amber-700",
                },
                {
                  text: "Não conformes",
                  count: noncompliant,
                  Icon: CircleX,
                  color: "border-rose-300 bg-rose-50 text-rose-700",
                },
              ].map(({ text, count, Icon, color }) => (
                <fieldset
                  key={text}
                  aria-label={text}
                  className={`flex items-center justify-between gap-2 rounded-lg border p-3 ${color}`}
                >
                  <div>
                    <Icon className="mb-2 size-6" aria-hidden="true" />
                    <p className="text-xs">{text}</p>
                  </div>
                  <p className="text-5xl font-semibold">{count}</p>
                </fieldset>
              ))}
            </div>
          </section>
          <div
            role="status"
            className={`rounded-lg border p-4 text-sm ${noncompliant > 0 ? "border-rose-300 bg-rose-50 text-rose-700" : attention > 0 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-teal-300 bg-teal-50 text-teal-700"}`}
          >
            {noncompliant > 0
              ? "Projeto com pendências de dimensionamento."
              : attention > 0
                ? "Projeto dimensionado com alertas. Consulte as não conformidades e execute a validação."
                : "Todos os trechos foram dimensionados. Execute a validação para confirmar as pendências do projeto."}
          </div>
        </>
      )}
      {!tabbed && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {counts.map(({ status, count }) => (
            <Card key={status}>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">
                  {designStatusLabels[status]}
                </p>
                <p className="text-3xl font-semibold">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {tabbed && visible("memory") && memorial && (
        <MemorialTrace memorial={memorial} />
      )}
      {visible("memory") && (
        <>
          <p className="text-sm text-muted-foreground">
            Regras aplicadas: {design.rulesetVersionId}. Os resultados
            representam os dados salvos no momento deste cálculo.
          </p>
          {design.justifications.map((text) => (
            <p key={text} className="text-sm">
              {text}
            </p>
          ))}
        </>
      )}
      {visible("findings") && design.nonconformities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ocorrências do projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <Findings items={design.nonconformities} />
          </CardContent>
        </Card>
      )}
      {tabbed && visible("drawing") && network && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planta da rede</CardTitle>
              <CardDescription>
                Coordenadas do DXF; cores pela situação de cada trecho.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkPlan network={network} design={design} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Perfil longitudinal</CardTitle>
              <CardDescription>
                Terreno, cota de fundo e geratriz superior calculadas, de
                montante para jusante.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LongitudinalProfile network={network} design={design} />
            </CardContent>
          </Card>
        </div>
      )}
      {visible("table") && (
        <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
          <CardHeader>
            <CardTitle>Dimensionamento por trecho</CardTitle>
            <CardDescription>
              Valores no início e no fim de plano (ini / fim). DN com * foi
              imposto pelo projetista. τ é a tensão trativa usada no critério de
              autolimpeza. Clique no trecho para ver o memorial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {tableColumns.map((text) => (
                    <TableHead key={text}>{text}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tabbed
                  ? design.segments.slice(page * 5, page * 5 + 5)
                  : design.segments
                ).map((segment) => {
                  const choice = isCalculated(segment) ? segment.choice : null;
                  const state = situation(segment);
                  return (
                    <TableRow key={segment.segmentId}>
                      <TableCell>
                        <a
                          href={`#result-${segment.segmentId}`}
                          className="font-medium text-primary underline"
                          onClick={() => {
                            if (tabbed) {
                              setTab("memory");
                              setSelectedSegment(segment.segmentId);
                            }
                          }}
                        >
                          {segment.segmentCode}
                        </a>
                      </TableCell>
                      <TableCell>
                        {pair(segment, "initialDischarge", "finalDischarge")}
                      </TableCell>
                      <TableCell>
                        {choice
                          ? `${choice.diameterMm}${choice.diameterImposed ? "*" : ""}`
                          : "—"}
                      </TableCell>
                      <TableCell>{choice?.material ?? "—"}</TableCell>
                      <TableCell>{format(choice?.slope, 5)}</TableCell>
                      <TableCell>
                        {pair(segment, "initialVelocity", "finalVelocity", 2)}
                      </TableCell>
                      <TableCell>
                        {pair(
                          segment,
                          "initialDepthRatio",
                          "finalDepthRatio",
                          2,
                        )}
                      </TableCell>
                      <TableCell>
                        {format(quantityValue(segment, "tractiveTension"), 2)}
                      </TableCell>
                      <TableCell>{format(choice?.upstreamDropM, 3)}</TableCell>
                      <TableCell>
                        <span
                          className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${state.className}`}
                        >
                          {state.text}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {tabbed && (
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  {Math.min(page * 5 + 5, design.segments.length)} de{" "}
                  {design.segments.length} trechos
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={(page + 1) * 5 >= design.segments.length}
                    onClick={() => setPage(page + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {(visible("memory") || visible("findings")) && (
        <section aria-label="Detalhes do cálculo" className="space-y-3">
          <h2 className="text-xl font-semibold">
            Detalhes e ocorrências por trecho
          </h2>
          {design.segments
            .filter(
              (segment) =>
                !tabbed ||
                tab !== "findings" ||
                !isCalculated(segment) ||
                segment.nonconformities.length > 0,
            )
            .map((segment) => (
              <SegmentDetails
                key={segment.segmentId}
                segment={segment}
                memorial={memorial}
                expanded={
                  selectedSegment === segment.segmentId ? true : undefined
                }
              />
            ))}
          {tabbed &&
            tab === "findings" &&
            design.nonconformities.length === 0 &&
            design.segments.every(
              (s) => isCalculated(s) && s.nonconformities.length === 0,
            ) && (
              <p className="text-sm text-muted-foreground">
                Nenhuma não conformidade encontrada.
              </p>
            )}
        </section>
      )}
    </div>
  );
}

function useJson<T>(
  key: readonly unknown[],
  url: string,
  schema: z.ZodType<T>,
  message: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: key,
    queryFn: async ({ signal }) =>
      parseClientJson(await fetch(url, { signal }), schema, message),
    enabled,
    retry: false,
  });
}

export function DesignPanel({
  projectId,
  disabled = false,
  tabbed = false,
}: {
  projectId: string;
  disabled?: boolean;
  tabbed?: boolean;
}) {
  const router = useRouter();
  const { requestNavigation } = useUnsavedChanges();
  const base = `/api/projects/${projectId}`;
  const design = useJson(
    projectQueryKeys.calculations(projectId),
    `${base}/design`,
    networkDesignSchema,
    "Não foi possível dimensionar a rede.",
    false,
  );
  const reportsEnabled = tabbed && Boolean(design.data) && !design.isFetching;
  const summary = useJson(
    projectQueryKeys.executiveSummary(projectId),
    `${base}/executive-summary`,
    executiveSummarySchema,
    "Não foi possível carregar o resumo executivo.",
    reportsEnabled,
  );
  const memorial = useJson(
    projectQueryKeys.memorial(projectId),
    `${base}/calculation-memorial`,
    calculationMemorialSchema,
    "Não foi possível carregar o memorial de cálculo.",
    reportsEnabled,
  );
  const network = useJson(
    projectQueryKeys.network(projectId),
    `${base}/network`,
    projectDetailResponseSchema,
    "Não foi possível carregar a rede.",
    tabbed,
  );
  // The latest validation/export snapshot lets Results open without recalculating.
  const snapshots = useJson(
    projectQueryKeys.snapshots(projectId),
    `${base}/design-snapshots`,
    z.array(designSnapshotSchema),
    "Não foi possível carregar os registros.",
    tabbed,
  );
  const latest = snapshots.data?.[0];
  const snapshot = useJson(
    [...projectQueryKeys.snapshots(projectId), latest?.id],
    `${base}/design-snapshots/${latest?.id}`,
    designSnapshotDetailSchema,
    "Não foi possível carregar o último registro.",
    Boolean(latest) && !design.data,
  );
  const saved =
    !design.data && snapshot.data
      ? memorialToDesign(snapshot.data, projectId)
      : undefined;
  const shown = design.data ?? saved;
  return (
    <section aria-label="Cálculo CDRE" className="space-y-5">
      <Card
        className={
          tabbed ? "gap-0 border-0 bg-transparent p-0 shadow-none ring-0" : ""
        }
      >
        <CardHeader className={tabbed ? "hidden" : ""}>
          <CardTitle>Dimensionamento hidráulico</CardTitle>
          <CardDescription>
            O CDRE calcula com os parâmetros e dados de campo salvos. Após
            editar a rede ou a hidráulica, execute novamente o cálculo.
          </CardDescription>
        </CardHeader>
        <CardContent
          className={`flex flex-wrap items-center gap-3 ${tabbed ? "justify-end px-1" : ""}`}
        >
          <Button
            disabled={disabled || design.isFetching}
            onClick={() => {
              void design.refetch().then((result) => {
                if (tabbed && result.isSuccess) {
                  void summary.refetch();
                  void memorial.refetch();
                }
              });
            }}
          >
            {design.isFetching ? "Calculando..." : "Calcular dimensionamento"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              requestNavigation(() =>
                router.push(`/project/${projectId}/validation`),
              )
            }
          >
            Validar projeto
          </Button>
          {disabled && (
            <p role="status" className="text-sm text-muted-foreground">
              Salve ou descarte as alterações da rede antes de calcular.
            </p>
          )}
        </CardContent>
      </Card>
      {design.isError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive p-4 space-y-2"
        >
          <p className="font-medium">O dimensionamento não foi concluído</p>
          <p className="text-sm">{design.error.message}</p>
          <p className="text-sm">
            Use a validação para consultar os dados faltantes e os trechos que
            precisam de atenção.
          </p>
        </div>
      )}
      {saved && latest && !design.isFetching && (
        <p
          role="status"
          className={`rounded-lg border p-3 text-sm ${network.data?.designOutdated ? "border-amber-300 bg-amber-50 text-amber-800" : "border-border"}`}
        >
          Exibindo o registro salvo na{" "}
          {latest.trigger === "EXPORT" ? "exportação" : "validação"} de{" "}
          {new Date(latest.createdAt).toLocaleString("pt-BR")}.{" "}
          {network.data?.designOutdated
            ? "Os dados do projeto mudaram depois desse registro: calcule novamente."
            : "Calcule novamente para conferir com os dados atuais."}
        </p>
      )}
      {shown && !design.isError && !design.isFetching && (
        <DesignResults
          key={design.dataUpdatedAt || latest?.id}
          design={shown}
          tabbed={tabbed}
          summary={design.data ? summary.data : undefined}
          memorial={design.data ? memorial.data : snapshot.data}
          network={network.data}
        />
      )}
      {!shown && !design.isFetching && !design.isError && (
        <p className="text-sm text-muted-foreground">
          Nenhum cálculo executado nesta sessão. Os resultados anteriores são
          descartados quando os dados do projeto mudam.
        </p>
      )}
      {design.isFetching && (
        <p role="status" className="text-sm">
          Calculando os trechos de montante para jusante...
        </p>
      )}
    </section>
  );
}
