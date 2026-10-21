"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { projectQueryKeys } from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
import {
  type NetworkDesign,
  type Nonconformity,
  networkDesignSchema,
  type SegmentDesign,
} from "@/api/contracts/design";
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

function SegmentDetails({ segment }: { segment: SegmentDesign }) {
  return (
    <details
      id={`result-${segment.segmentId}`}
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

export function DesignResults({ design }: { design: NetworkDesign }) {
  const counts = Object.keys(designStatusLabels).map((status) => ({
    status: status as SegmentDesign["status"],
    count: design.segments.filter((segment) => segment.status === status)
      .length,
  }));
  return (
    <div className="space-y-6">
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
      <p className="text-sm text-muted-foreground">
        Regras aplicadas: {design.rulesetVersionId}. Os resultados representam
        os dados salvos no momento deste cálculo.
      </p>
      {design.justifications.map((text) => (
        <p key={text} className="text-sm">
          {text}
        </p>
      ))}
      {design.nonconformities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ocorrências do projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <Findings items={design.nonconformities} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Dimensionamento por trecho</CardTitle>
          <CardDescription>
            Vazões em L/s, diâmetro em mm, declividade em m/m, velocidade em m/s
            e Y/D adimensional. Valores iniciais e finais são apresentados
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
              {design.segments.map((segment) => (
                <TableRow key={segment.segmentId}>
                  <TableCell>
                    <a
                      href={`#result-${segment.segmentId}`}
                      className="font-medium text-primary underline"
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
                  <TableCell>{designStatusLabels[segment.status]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <section aria-label="Detalhes do cálculo" className="space-y-3">
        <h2 className="text-xl font-semibold">
          Detalhes e ocorrências por trecho
        </h2>
        {design.segments.map((segment) => (
          <SegmentDetails key={segment.segmentId} segment={segment} />
        ))}
      </section>
    </div>
  );
}

export function DesignPanel({
  projectId,
  disabled = false,
}: {
  projectId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { requestNavigation } = useUnsavedChanges();
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
      <Card>
        <CardHeader>
          <CardTitle>Dimensionamento hidráulico</CardTitle>
          <CardDescription>
            O CDRE calcula com os parâmetros e dados de campo salvos. Após
            editar a rede ou a hidráulica, execute novamente o cálculo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
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
        <DesignResults design={design.data} />
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
