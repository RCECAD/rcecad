"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, GitBranch, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { projectQueryKeys } from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
import {
  type NetworkDesign,
  type Nonconformity,
  networkDesignSchema,
  type SegmentDesign,
} from "@/api/contracts/design";
import {
  type ProjectParameters,
  type ProjectResponse,
  projectDetailResponseSchema,
  projectParametersSchema,
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
import { useUnsavedChanges } from "./unsaved-changes-provider";

export const designStatusLabels = {
  designed: "Dimensionado",
  conflicted: "Conflito de regras",
  infeasible: "Inviável",
  notEvaluated: "Bloqueado a montante",
} as const;
export function quantityValue(
  segment: SegmentDesign,
  key: string,
): number | undefined {
  return segment.status === "designed"
    ? segment.quantities.find((quantity) => quantity.key === key)?.value
    : undefined;
}
const format = (value: number | undefined, digits = 4) =>
  value === undefined
    ? "—"
    : value.toLocaleString("pt-BR", { maximumFractionDigits: digits });
const severityLabels = {
  CRITICAL: "Crítica",
  WARNING: "Alerta",
  INFO: "Informação",
};
const quantityLabels: Record<string, string> = {
  initialDischarge: "Vazão inicial (Qi)",
  finalDischarge: "Vazão final (Qf)",
  initialVelocity: "Velocidade inicial",
  finalVelocity: "Velocidade final",
  initialDepthRatio: "Lâmina inicial (Y/D)",
  finalDepthRatio: "Lâmina final (Y/D)",
  initialTractiveTension: "Tensão trativa inicial",
  finalTractiveTension: "Tensão trativa final",
  manningN: "Manning",
  upstreamCover: "Recobrimento de montante",
  downstreamCover: "Recobrimento de jusante",
};

function Findings({ items }: { items: Nonconformity[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={JSON.stringify(item)}
          className="rounded-md border p-3 text-sm"
        >
          <p className="font-medium">
            {severityLabels[item.severity]} · {item.ruleCode}
          </p>
          <p>{item.description}</p>
          <p className="text-muted-foreground">Fonte: {item.sourceId}</p>
          {item.observedValue !== null && (
            <p>Valor observado: {item.observedValue}</p>
          )}
          {item.expectedLimit !== null && (
            <p>Limite esperado: {item.expectedLimit}</p>
          )}
          {item.waiverJustification && (
            <p>Justificativa: {item.waiverJustification}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function SegmentDetails({
  segment,
  expanded,
}: {
  segment: SegmentDesign;
  expanded?: boolean;
}) {
  return (
    <details
      id={`result-${segment.segmentId}`}
      open={expanded}
      className="rounded-lg border p-4 scroll-mt-6"
    >
      <summary className="cursor-pointer font-medium">
        {segment.segmentCode} · {designStatusLabels[segment.status]}
      </summary>
      <div className="mt-4 space-y-4">
        {segment.justifications.map((text) => (
          <p key={text} className="text-sm">
            {text}
          </p>
        ))}
        {segment.status === "designed" && (
          <>
            <p className="text-sm">
              DN {segment.choice.diameterMm} mm · {segment.choice.material} ·
              declividade {format(segment.choice.slope, 6)} m/m · cota de
              montante {format(segment.choice.upstreamInvertM)} m
            </p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
              {segment.quantities.map((quantity) => (
                <div key={quantity.key}>
                  <dt className="text-muted-foreground">
                    {quantityLabels[quantity.key] ?? quantity.key}
                  </dt>
                  <dd>
                    {format(quantity.value, 6)} {quantity.unit}
                  </dd>
                </div>
              ))}
            </dl>
            {segment.nonconformities.length > 0 ? (
              <Findings items={segment.nonconformities} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma ocorrência normativa neste trecho.
              </p>
            )}
          </>
        )}
        {segment.status === "conflicted" && (
          <ul className="space-y-2 text-sm">
            {segment.conflicts.map((conflict) => (
              <li key={conflict.subject}>
                <strong>{conflict.subject}</strong>: {conflict.reason}
                <p>Fontes: {conflict.conflictingSources.join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
        {segment.status === "notEvaluated" && (
          <>
            <p>{segment.reason}</p>
            <p className="text-sm">
              Resolva os trechos a montante:{" "}
              {segment.blockedBy.map((id, index) => (
                <a
                  key={id}
                  className="mr-2 text-primary underline"
                  href={`#result-${id}`}
                >
                  {segment.blockedByCodes[index] ?? id}
                </a>
              ))}
            </p>
          </>
        )}
        {segment.status === "infeasible" && (
          <div className="space-y-4">
            <p>Nenhum candidato foi aceito. Confira as tentativas:</p>
            {segment.attempts.map((attempt) => (
              <details
                key={`${attempt.choice.diameterMm}-${attempt.choice.slope}`}
                className="rounded-md border p-3"
              >
                <summary className="cursor-pointer text-sm">
                  DN {attempt.choice.diameterMm} mm ·{" "}
                  {format(attempt.choice.slope, 6)} m/m
                </summary>
                <div className="mt-3 space-y-3">
                  <Findings items={attempt.blocking} />
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    {attempt.quantities.map((quantity) => (
                      <div key={quantity.key}>
                        <dt>{quantityLabels[quantity.key] ?? quantity.key}</dt>
                        <dd>
                          {format(quantity.value, 6)} {quantity.unit}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export function DesignResults({
  design,
  tabbed = false,
  project,
  parameters,
}: {
  design: NetworkDesign;
  tabbed?: boolean;
  project?: ProjectResponse;
  parameters?: ProjectParameters | null;
}) {
  const [tab, setTab] = useState("summary");
  const [page, setPage] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<string>();
  const visible = (value: string) => !tabbed || tab === value;
  const attention = design.segments.filter(
    (s) =>
      s.status === "designed" &&
      s.nonconformities.some((n) => n.severity === "WARNING") &&
      !s.nonconformities.some((n) => n.severity === "CRITICAL"),
  ).length;
  const noncompliant = design.segments.filter(
    (s) =>
      s.status !== "designed" ||
      s.nonconformities.some((n) => n.severity === "CRITICAL"),
  ).length;
  const compliant = design.segments.length - attention - noncompliant;
  const counts = Object.keys(designStatusLabels).map((status) => ({
    status: status as SegmentDesign["status"],
    count: design.segments.filter((segment) => segment.status === status)
      .length,
  }));
  return (
    <div className="space-y-6">
      {tabbed && (
        <div
          role="tablist"
          aria-label="Resultados do projeto"
          className="grid grid-cols-2 gap-1 rounded-md bg-card p-1.5 sm:grid-cols-4"
        >
          {[
            ["summary", "Resumo Executivo"],
            ["table", "Resultados por Trecho"],
            ["memory", "Memória de Cálculo"],
            ["findings", "Não conformidades"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              className={`rounded px-3 py-1.5 text-sm font-medium ${tab === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setTab(value)}
            >
              {label}
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
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
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
            <dl className="grid gap-x-4 gap-y-4 sm:grid-cols-3">
              {[
                [
                  "Coeficiente de retorno",
                  format(parameters?.returnCoefficient),
                ],
                [
                  "Fator de pico diário (K1)",
                  format(parameters?.peakDailyFactor),
                ],
                [
                  "Fator de pico horário (K2)",
                  format(parameters?.peakHourlyFactor),
                ],
                [
                  "Consumo per capita",
                  parameters
                    ? `${format(parameters.perCapitaFlow)} L/hab.dia`
                    : "—",
                ],
                [
                  "Taxa de infiltração",
                  parameters?.infiltrationRate != null
                    ? `${format(parameters.infiltrationRate)} L/s por km`
                    : "Resolvida pelo material",
                ],
                ["Regra de cálculo", design.rulesetVersionId],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-lg border border-border/80 bg-card/40 px-6 py-4">
            <h2 className="mb-3 text-base font-semibold">
              Estatísticas do projeto
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Total de trechos",
                  count: design.segments.length,
                  Icon: GitBranch,
                  color: "border-slate-300 text-slate-700",
                },
                {
                  label: "Conformes",
                  count: compliant,
                  Icon: CircleCheck,
                  color: "border-teal-300 bg-teal-50 text-teal-700",
                },
                {
                  label: "Em atenção",
                  count: attention,
                  Icon: TriangleAlert,
                  color: "border-amber-300 bg-amber-50 text-amber-700",
                },
                {
                  label: "Não conformes",
                  count: noncompliant,
                  Icon: CircleX,
                  color: "border-rose-300 bg-rose-50 text-rose-700",
                },
              ].map(({ label, count, Icon, color }) => (
                <fieldset
                  key={label}
                  aria-label={label}
                  className={`flex items-center justify-between gap-2 rounded-lg border p-3 ${color}`}
                >
                  <div>
                    <Icon className="mb-2 size-6" aria-hidden="true" />
                    <p className="text-xs">{label}</p>
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
      {visible("table") && (
        <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
          <CardHeader>
            <CardTitle>Dimensionamento por trecho</CardTitle>
            <CardDescription>
              Vazões em L/s, diâmetro em mm, declividade em m/m, velocidade em
              m/s e Y/D adimensional. Valores iniciais e finais são apresentados
              separadamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    "Trecho",
                    "Qi",
                    "Qf",
                    "DN",
                    "Declividade",
                    "V inicial",
                    "V final",
                    "Y/D inicial",
                    "Y/D final",
                    "Situação",
                  ].map((label) => (
                    <TableHead key={label}>{label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tabbed
                  ? design.segments.slice(page * 5, page * 5 + 5)
                  : design.segments
                ).map((segment) => (
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
                      {format(quantityValue(segment, "initialDischarge"))}
                    </TableCell>
                    <TableCell>
                      {format(quantityValue(segment, "finalDischarge"))}
                    </TableCell>
                    <TableCell>
                      {segment.status === "designed"
                        ? segment.choice.diameterMm
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {segment.status === "designed"
                        ? format(segment.choice.slope, 6)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {format(quantityValue(segment, "initialVelocity"))}
                    </TableCell>
                    <TableCell>
                      {format(quantityValue(segment, "finalVelocity"))}
                    </TableCell>
                    <TableCell>
                      {format(quantityValue(segment, "initialDepthRatio"))}
                    </TableCell>
                    <TableCell>
                      {format(quantityValue(segment, "finalDepthRatio"))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${segment.status !== "designed" ? "border-rose-300 bg-rose-50 text-rose-700" : segment.nonconformities.some((n) => n.severity === "WARNING") ? "border-amber-300 bg-amber-50 text-amber-700" : "border-teal-300 bg-teal-50 text-teal-700"}`}
                      >
                        {segment.status === "designed" &&
                        segment.nonconformities.some(
                          (n) => n.severity === "WARNING",
                        )
                          ? "Em atenção"
                          : designStatusLabels[segment.status]}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
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
                segment.status !== "designed" ||
                segment.nonconformities.length > 0,
            )
            .map((segment) => (
              <SegmentDetails
                key={segment.segmentId}
                segment={segment}
                expanded={
                  selectedSegment === segment.segmentId ? true : undefined
                }
              />
            ))}
          {tabbed &&
            tab === "findings" &&
            design.nonconformities.length === 0 &&
            design.segments.every(
              (s) => s.status === "designed" && s.nonconformities.length === 0,
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
  const network = useQuery({
    queryKey: projectQueryKeys.network(projectId),
    queryFn: async () =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/network`),
        projectDetailResponseSchema,
        "Não foi possível carregar a identificação.",
      ),
    enabled: tabbed,
    retry: false,
  });
  const parameters = useQuery({
    queryKey: projectQueryKeys.parameters(projectId),
    queryFn: async () =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/hydraulics`),
        projectParametersSchema.nullable(),
        "Não foi possível carregar os parâmetros.",
      ),
    enabled: tabbed,
    retry: false,
  });
  const design = useQuery({
    queryKey: projectQueryKeys.calculations(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/design`, { signal }),
        networkDesignSchema,
        "Não foi possível dimensionar a rede.",
      ),
    enabled: false,
    retry: false,
  });
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
          className={`flex flex-wrap items-center gap-3 ${tabbed ? "justify-end px-0" : ""}`}
        >
          <Button
            disabled={disabled || design.isFetching}
            onClick={() => void design.refetch()}
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
      {design.data && !design.isError && !design.isFetching && (
        <DesignResults
          key={design.dataUpdatedAt}
          design={design.data}
          tabbed={tabbed}
          project={network.data?.project}
          parameters={parameters.data}
        />
      )}
      {!design.data && !design.isFetching && !design.isError && (
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
