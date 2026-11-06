"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChartNoAxesCombined, Download, FileText, Table2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { downloadFile } from "@/api/client/download";
import { projectQueryKeys } from "@/api/client/query-keys";
import { ClientApiError, parseClientJson } from "@/api/client/response";
import type { ValidationItem } from "@/api/contracts/design";
import {
  designSnapshotDetailSchema,
  designSnapshotSchema,
  type ExportDocument,
  exportBlockedItemsSchema,
  projectExportSchema,
} from "@/api/contracts/resources";
import { ValidationFindings } from "@/components/project/project-validation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Feedback, RequestError } from "@/components/ui/feedback";
import { rulesetLabel } from "@/lib/memorial-presentation";
import { designStatusLabels } from "@/lib/project-feedback";

const documents = [
  {
    id: "memorial",
    title: "Memorial de cálculo",
    description: "Documento técnico com todas as memórias de cálculo",
    icon: FileText,
    format: "pdf",
  },
  {
    id: "spreadsheet",
    title: "Planilhas de dimensionamento",
    description: "Tabelas com dados de todos os trechos",
    icon: Table2,
    format: "xlsx",
  },
  {
    id: "technical-report",
    title: "Relatório técnico",
    description: "Documento resumido com principais resultados",
    icon: FileText,
    format: "pdf",
  },
  {
    id: "longitudinal-profiles",
    title: "Gráfico e diagramas",
    description: "Perfis longitudinais e diagramas de vazão",
    icon: ChartNoAxesCombined,
    format: "pdf",
  },
] as const;

const formats = [
  { id: "pdf", label: "PDF" },
  { id: "xlsx", label: "XLSX - Microsoft Excel (apenas planilhas)" },
] as const;

const panelClassName = "rounded-lg border border-border/80 bg-card/40 p-5";
const dateTime = (value: string) => new Date(value).toLocaleString("pt-BR");

function SnapshotDetail({
  projectId,
  snapshotId,
}: {
  projectId: string;
  snapshotId: string;
}) {
  const detail = useQuery({
    queryKey: [...projectQueryKeys.snapshots(projectId), snapshotId],
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(
          `/api/projects/${projectId}/design-snapshots/${snapshotId}`,
          { signal },
        ),
        designSnapshotDetailSchema,
        "Não foi possível carregar o registro.",
      ),
    retry: false,
  });
  if (detail.isPending)
    return (
      <p role="status" className="text-xs">
        Carregando registro de dimensionamento...
      </p>
    );
  if (detail.isError)
    return (
      <RequestError
        title="Não foi possível carregar o registro"
        error={detail.error}
        onRetry={() => void detail.refetch()}
        retrying={detail.isFetching}
      />
    );
  const outcomes = Object.entries(
    detail.data.segments.reduce<Record<string, number>>((acc, segment) => {
      acc[segment.outcome] = (acc[segment.outcome] ?? 0) + 1;
      return acc;
    }, {}),
  );
  return (
    <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">Projeto / revisão</dt>
        <dd>
          {detail.data.identification.name} ·{" "}
          {detail.data.revision ?? "sem revisão"}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Trechos por situação</dt>
        <dd>
          {outcomes
            .map(
              ([outcome, count]) =>
                `${designStatusLabels[outcome] ?? "Situação não identificada"}: ${count}`,
            )
            .join(" · ")}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Entrada registrada</dt>
        <dd>
          {detail.data.inputs
            ? `${detail.data.inputs.nodes.length} nós, ${detail.data.inputs.segments.length} trechos, ${detail.data.inputs.contributions.length} contribuições`
            : "Não registrada (registro anterior à versão 34)"}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="text-muted-foreground">SHA-256</dt>
        <dd className="break-all font-mono">{detail.data.contentSha256}</dd>
      </div>
    </dl>
  );
}

function ExportHistory({ projectId }: { projectId: string }) {
  const [openSnapshot, setOpenSnapshot] = useState<string>();
  const exports = useQuery({
    queryKey: projectQueryKeys.exports(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/exports`, { signal }),
        z.array(projectExportSchema),
        "Não foi possível carregar o histórico de exportações.",
      ),
    retry: false,
  });
  const snapshots = useQuery({
    queryKey: projectQueryKeys.snapshots(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/design-snapshots`, { signal }),
        z.array(designSnapshotSchema),
        "Não foi possível carregar os registros de dimensionamento.",
      ),
    retry: false,
  });
  return (
    <>
      <section aria-labelledby="export-history" className={panelClassName}>
        <h2 id="export-history" className="text-base font-semibold">
          Histórico de exportações
        </h2>
        {exports.isPending && (
          <p role="status" className="mt-3 text-sm">
            Carregando exportações...
          </p>
        )}
        {exports.isError && (
          <RequestError
            title="Não foi possível carregar o histórico de exportações"
            error={exports.error}
            onRetry={() => void exports.refetch()}
            retrying={exports.isFetching}
          />
        )}
        <ul className="flex min-w-0 flex-col gap-2 mt-4 text-sm">
          {exports.data?.map((item) => (
            <li key={item.id} className="rounded-md border px-3 py-2">
              <p className="font-medium">{item.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {item.format} · {dateTime(item.exportedAt)} ·{" "}
                {(item.sizeBytes / 1024).toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })}{" "}
                KB · revisão {item.revision ?? "—"}
              </p>
            </li>
          ))}
          {exports.data?.length === 0 && (
            <li className="text-muted-foreground">
              <Feedback
                title="Nenhum documento exportado"
                description="Selecione os documentos e formatos desejados para iniciar a exportação."
                actions={[
                  { label: "Selecionar documentos", href: "#export-documents" },
                ]}
              />
            </li>
          )}
        </ul>
      </section>
      <section aria-labelledby="export-snapshots" className={panelClassName}>
        <h2 id="export-snapshots" className="text-base font-semibold">
          Registros de dimensionamento
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada validação ou exportação guarda o memorial e os dados de entrada
          usados, com hash de conferência.
        </p>
        {snapshots.isPending && (
          <p role="status" className="mt-3 text-sm">
            Carregando registros de dimensionamento...
          </p>
        )}
        {snapshots.isError && (
          <RequestError
            title="Não foi possível carregar os registros de dimensionamento"
            error={snapshots.error}
            onRetry={() => void snapshots.refetch()}
            retrying={snapshots.isFetching}
          />
        )}
        <ul className="flex min-w-0 flex-col gap-2 mt-4 text-sm">
          {snapshots.data?.map((snapshot) => (
            <li key={snapshot.id} className="rounded-md border px-3 py-2">
              <button
                type="button"
                className="w-full text-left"
                aria-expanded={openSnapshot === snapshot.id}
                onClick={() =>
                  setOpenSnapshot(
                    openSnapshot === snapshot.id ? undefined : snapshot.id,
                  )
                }
              >
                <span className="font-medium">
                  {snapshot.trigger === "EXPORT" ? "Exportação" : "Validação"} ·{" "}
                  {dateTime(snapshot.createdAt)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {rulesetLabel(snapshot.rulesetVersionId)} · revisão{" "}
                  {snapshot.revision ?? "—"} · {snapshot.exportIds.length}{" "}
                  documento(s)
                </span>
              </button>
              {openSnapshot === snapshot.id && (
                <SnapshotDetail
                  projectId={projectId}
                  snapshotId={snapshot.id}
                />
              )}
            </li>
          ))}
          {snapshots.data?.length === 0 && (
            <li className="text-muted-foreground">
              <Feedback
                title="Nenhum dimensionamento registrado"
                description="Valide o projeto e resolva as pendências para gerar o primeiro registro."
                actions={[
                  {
                    label: "Ir para validação",
                    href: `/project/${projectId}/validation`,
                  },
                ]}
              />
            </li>
          )}
        </ul>
      </section>
    </>
  );
}

export function ExportContent({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<ExportDocument>>(
    () => new Set(documents.map((document) => document.id)),
  );
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(
    () => new Set(formats.map((format) => format.id)),
  );
  const [blocked, setBlocked] = useState<ValidationItem[]>();
  const [saved, setSaved] = useState<string[]>([]);
  const toExport = documents.filter(
    (document) =>
      selected.has(document.id) && selectedFormats.has(document.format),
  );
  const run = useMutation({
    mutationFn: async () => {
      const names: string[] = [];
      for (const document of toExport) {
        names.push(
          await downloadFile(
            await fetch(`/api/projects/${projectId}/exports/${document.id}`, {
              method: "POST",
            }),
            `${document.id}.${document.format}`,
            `Não foi possível exportar ${document.title}.`,
          ),
        );
        setSaved([...names]);
      }
      return names;
    },
    onMutate: () => {
      setBlocked(undefined);
      setSaved([]);
    },
    onSuccess: setSaved,
    onError: (error) => {
      if (error instanceof ClientApiError && error.code === "EXPORT_BLOCKED") {
        const items = exportBlockedItemsSchema.safeParse(error.items);
        setBlocked(items.success ? items.data : []);
      }
    },
    onSettled: () =>
      Promise.all(
        [
          projectQueryKeys.exports(projectId),
          projectQueryKeys.snapshots(projectId),
          projectQueryKeys.overview(projectId),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
  const dxf = useMutation({
    mutationFn: async () =>
      downloadFile(
        await fetch(`/api/projects/${projectId}/export-dxf`),
        `${projectId}.dxf`,
        "Não foi possível baixar o DXF original.",
      ),
  });
  const toggle = <T,>(set: Set<T>, value: T, checked: boolean) => {
    const next = new Set(set);
    if (checked) next.add(value);
    else next.delete(value);
    return next;
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">
        Exportação
      </h1>

      <Feedback
        reveal={Boolean(blocked)}
        tone={blocked ? "warning" : "info"}
        title={
          blocked
            ? "Exportação bloqueada pela validação"
            : "Exportação sujeita à validação"
        }
        description={
          blocked
            ? "Corrija as pendências e valide novamente antes de gerar os documentos."
            : "Os documentos só são gerados quando o projeto está apto a concluir. Cada exportação valida o projeto novamente e fica registrada no histórico."
        }
        actions={[
          {
            label: "Ir para validação",
            href: `/project/${projectId}/validation`,
          },
        ]}
      />

      {blocked && blocked.length > 0 && (
        <ValidationFindings projectId={projectId} items={blocked} />
      )}

      <section
        id="export-selection"
        aria-labelledby="export-documents"
        className={panelClassName}
      >
        <h2 id="export-documents" className="text-base font-semibold">
          Documentos
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione os documentos que serão gerados
        </p>
        <fieldset
          disabled={run.isPending}
          aria-label="Documentos para exportação"
          className="flex min-w-0 flex-col gap-3 mt-4"
        >
          {documents.map(({ id, title, description, icon: Icon, format }) => (
            <label
              key={id}
              htmlFor={`export-${id}`}
              className="flex min-h-16 cursor-pointer items-center gap-3 rounded-md border border-border/80 px-3 py-3 transition-colors hover:bg-muted/30"
            >
              <Checkbox
                id={`export-${id}`}
                name="documents"
                value={id}
                checked={selected.has(id)}
                onCheckedChange={(checked) =>
                  setSelected(toggle(selected, id, checked === true))
                }
                aria-labelledby={`export-${id}-title`}
                aria-describedby={`export-${id}-description`}
              />
              <Icon
                aria-hidden="true"
                className="size-6 shrink-0 text-blue-500"
              />
              <span className="min-w-0">
                <span
                  id={`export-${id}-title`}
                  className="block text-sm font-medium"
                >
                  {title} ({format.toUpperCase()})
                </span>
                <span
                  id={`export-${id}-description`}
                  className="mt-1 block text-xs leading-5 text-muted-foreground"
                >
                  {description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      <section aria-labelledby="export-formats" className={panelClassName}>
        <h2 id="export-formats" className="text-base font-semibold">
          Formatos
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Documentos de um formato desmarcado não são gerados
        </p>
        <fieldset
          disabled={run.isPending}
          aria-label="Formatos de exportação"
          className="flex min-w-0 flex-col gap-3 mt-4"
        >
          {formats.map(({ id, label }) => (
            <label
              key={id}
              htmlFor={`export-format-${id}`}
              className="flex w-fit cursor-pointer items-center gap-2 text-sm leading-5"
            >
              <Checkbox
                id={`export-format-${id}`}
                name="formats"
                value={id}
                checked={selectedFormats.has(id)}
                onCheckedChange={(checked) =>
                  setSelectedFormats(
                    toggle(selectedFormats, id, checked === true),
                  )
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
      </section>

      <Button
        type="button"
        size="lg"
        disabled={toExport.length === 0 || run.isPending}
        className="min-h-11 w-full whitespace-normal py-2"
        onClick={() => run.mutate()}
      >
        <Download aria-hidden="true" className="size-4 shrink-0" />
        {run.isPending
          ? "Gerando documentos..."
          : "Exportar documentos selecionados"}
      </Button>
      {toExport.length === 0 && (
        <Feedback
          tone="warning"
          title="Selecione documentos e formatos compatíveis"
          description="Marque pelo menos um documento e seu formato para liberar a exportação."
          actions={[{ label: "Revisar seleção", href: "#export-selection" }]}
        />
      )}
      {run.isError && !blocked && (
        <RequestError
          reveal
          title={
            saved.length
              ? "A exportação foi concluída parcialmente"
              : "Não foi possível exportar os documentos"
          }
          error={run.error}
          actions={[
            { label: "Revisar seleção", href: "#export-selection" },
            {
              label: "Ir para validação",
              href: `/project/${projectId}/validation`,
            },
          ]}
        />
      )}
      {saved.length > 0 && (
        <Feedback
          tone="success"
          title={
            run.isPending
              ? "Documentos disponíveis para download"
              : "Documentos gerados"
          }
          description={`O download foi iniciado para: ${saved.join(", ")}. Confira os arquivos na pasta de downloads do navegador.`}
          actions={[
            { label: "Ver histórico de exportações", href: "#export-history" },
            {
              label: "Voltar à visão geral",
              href: `/project/${projectId}/overview`,
            },
          ]}
        />
      )}

      <section aria-labelledby="export-dxf" className={panelClassName}>
        <h2 id="export-dxf" className="text-base font-semibold">
          Desenho original
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Baixe o arquivo DXF importado, sem alterações do dimensionamento.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={dxf.isPending}
          onClick={() => dxf.mutate()}
        >
          <Download aria-hidden="true" className="size-4" />
          {dxf.isPending ? "Preparando download..." : "Baixar DXF original"}
        </Button>
        {dxf.isError && (
          <RequestError
            title="Não foi possível baixar o DXF original"
            error={dxf.error}
            onRetry={() => dxf.mutate()}
            retrying={dxf.isPending}
          />
        )}
      </section>

      {dxf.isSuccess && (
        <Feedback
          tone="success"
          title="Download do DXF iniciado"
          description="Confira o arquivo original na pasta de downloads do navegador."
          actions={[
            {
              label: "Voltar ao dimensionamento",
              href: `/project/${projectId}/sizing`,
            },
          ]}
        />
      )}
      <ExportHistory projectId={projectId} />
    </div>
  );
}
