"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import {
  invalidateProjectDependents,
  normativeProfileQueryKey,
  projectQueryKeys,
} from "@/api/client/query-keys";
import { expectNoContent, parseClientJson } from "@/api/client/response";
import {
  type NonconformityDecisionRequest,
  nonconformityDecisionSchema,
  type TrackedNonconformity,
  trackedNonconformitySchema,
  type WaiverRequest,
  waiverRequestSchema,
  waiverSchema,
} from "@/api/contracts/resources";
import {
  normativeProfileSchema,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Accepted by Spring for generic domain findings besides the profile standards.
const GENERIC_SOURCE = "cdre-engine:check-generico";
const statusLabels = {
  OPEN: "Aberta",
  ACCEPTED: "Aceita",
  RESOLVED: "Resolvida",
} as const;
const severityLabels = {
  CRITICAL: "Crítica",
  WARNING: "Alerta",
  INFO: "Informação",
} as const;
const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

function useProjectList<T>(
  projectId: string,
  key: readonly unknown[],
  path: string,
  schema: z.ZodType<T>,
  message: string,
) {
  return useQuery({
    queryKey: key,
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/${path}`, { signal }),
        schema,
        message,
      ),
    retry: false,
  });
}

function DecisionHistory({
  projectId,
  nonconformityId,
}: {
  projectId: string;
  nonconformityId: string;
}) {
  const history = useProjectList(
    projectId,
    [...projectQueryKeys.nonconformities(projectId), nonconformityId],
    `nonconformities/${nonconformityId}/history`,
    z.array(nonconformityDecisionSchema),
    "Não foi possível carregar o histórico.",
  );
  if (history.isPending) return <p className="text-xs">Carregando...</p>;
  if (history.isError)
    return <p className="text-xs text-destructive">{history.error.message}</p>;
  return (
    <ol className="space-y-1 text-xs text-muted-foreground">
      {history.data.map((entry) => (
        <li key={entry.id}>
          {new Date(entry.occurredAt).toLocaleString("pt-BR")} ·{" "}
          {statusLabels[entry.fromStatus]} → {statusLabels[entry.toStatus]}
          {entry.justification && ` · ${entry.justification}`}
        </li>
      ))}
    </ol>
  );
}

function NonconformityItem({
  projectId,
  item,
  onWaive,
}: {
  projectId: string;
  item: TrackedNonconformity;
  onWaive: (item: TrackedNonconformity) => void;
}) {
  const queryClient = useQueryClient();
  const [justification, setJustification] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const decide = useMutation({
    mutationFn: async (input: NonconformityDecisionRequest) =>
      parseClientJson(
        await fetch(
          `/api/projects/${projectId}/nonconformities/${item.id}/decision`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          },
        ),
        trackedNonconformitySchema,
        "Não foi possível registrar a decisão.",
      ),
    onSuccess: async () => {
      setJustification("");
      await queryClient.invalidateQueries({
        queryKey: projectQueryKeys.nonconformities(projectId),
      });
    },
  });
  const canAccept = item.status === "OPEN" && item.severity !== "CRITICAL";
  return (
    <li className="space-y-2 rounded-lg border p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium">
          {severityLabels[item.severity]} · {item.ruleCode}
          {item.segmentCode && ` · trecho ${item.segmentCode}`}
        </p>
        <span className="rounded-full border px-2 py-0.5 text-xs">
          {statusLabels[item.status]}
        </span>
      </div>
      <p>{item.description}</p>
      <p className="text-xs text-muted-foreground">
        Fonte: {item.sourceId}
        {item.observedValue && ` · observado ${item.observedValue}`}
        {item.expectedLimit && ` · limite ${item.expectedLimit}`}
      </p>
      {item.justification && (
        <p className="text-xs">Justificativa: {item.justification}</p>
      )}
      {item.waiverJustification && (
        <p className="text-xs">Exceção aprovada: {item.waiverJustification}</p>
      )}
      {canAccept && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label={`Justificativa para aceitar ${item.ruleCode}`}
            placeholder="Justificativa para aceitar"
            maxLength={2000}
            value={justification}
            onChange={(event) => setJustification(event.target.value)}
          />
          <Button
            size="sm"
            disabled={!justification.trim() || decide.isPending}
            onClick={() => decide.mutate({ status: "ACCEPTED", justification })}
          >
            Aceitar
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {item.status === "ACCEPTED" && (
          <Button
            size="sm"
            variant="outline"
            disabled={decide.isPending}
            onClick={() =>
              decide.mutate({ status: "OPEN", justification: null })
            }
          >
            Reabrir
          </Button>
        )}
        {item.segmentId && item.status !== "RESOLVED" && (
          <Button size="sm" variant="outline" onClick={() => onWaive(item)}>
            <ShieldCheck className="size-4" /> Aprovar exceção
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          aria-expanded={showHistory}
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="size-4" /> Histórico
        </Button>
      </div>
      {showHistory && (
        <DecisionHistory projectId={projectId} nonconformityId={item.id} />
      )}
      {decide.isError && (
        <p role="alert" className="text-xs text-destructive">
          {decide.error.message}
        </p>
      )}
    </li>
  );
}

export type WaiverDraft = {
  type: "RULE" | "PARAMETER";
  segmentId: string;
  sourceId: string;
  ruleCode: string;
  downgradeTo: "WARNING" | "INFO";
  parameter: "DIAMETER" | "SLOPE";
  value: string;
  justification: string;
};
export const emptyWaiver: WaiverDraft = {
  type: "RULE",
  segmentId: "",
  sourceId: "",
  ruleCode: "",
  downgradeTo: "WARNING",
  parameter: "DIAMETER",
  value: "",
  justification: "",
};

export function toWaiverRequest(draft: WaiverDraft) {
  const common = {
    segmentId: draft.segmentId,
    justification: draft.justification,
  };
  return waiverRequestSchema.safeParse(
    draft.type === "RULE"
      ? {
          ...common,
          type: "RULE",
          sourceId: draft.sourceId,
          ruleCode: draft.ruleCode,
          downgradeTo: draft.downgradeTo,
        }
      : {
          ...common,
          type: "PARAMETER",
          parameter: draft.parameter,
          value: draft.value === "" ? Number.NaN : Number(draft.value),
        },
  );
}

function WaiversCard({
  projectId,
  draft,
  setDraft,
}: {
  projectId: string;
  draft: WaiverDraft;
  setDraft: (draft: WaiverDraft) => void;
}) {
  const queryClient = useQueryClient();
  const [invalid, setInvalid] = useState<string>();
  const waivers = useProjectList(
    projectId,
    projectQueryKeys.waivers(projectId),
    "waivers",
    z.array(waiverSchema),
    "Não foi possível carregar as aprovações.",
  );
  const network = useProjectList(
    projectId,
    projectQueryKeys.network(projectId),
    "network",
    projectDetailResponseSchema,
    "Não foi possível carregar a rede.",
  );
  const profile = useQuery({
    queryKey: normativeProfileQueryKey,
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch("/api/normative-profile", { signal }),
        normativeProfileSchema,
        "Não foi possível carregar o perfil normativo.",
      ),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
  const afterChange = async () => {
    await queryClient.invalidateQueries({
      queryKey: projectQueryKeys.waivers(projectId),
    });
    await invalidateProjectDependents(queryClient, projectId);
  };
  const create = useMutation({
    mutationFn: async (input: WaiverRequest) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/waivers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
        waiverSchema,
        "Não foi possível registrar a aprovação.",
      ),
    onSuccess: async () => {
      setDraft(emptyWaiver);
      await afterChange();
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) =>
      expectNoContent(
        await fetch(`/api/projects/${projectId}/waivers/${id}`, {
          method: "DELETE",
        }),
        "Não foi possível remover a aprovação.",
      ),
    onSuccess: afterChange,
  });
  const set = (patch: Partial<WaiverDraft>) => setDraft({ ...draft, ...patch });
  const submit = () => {
    const parsed = toWaiverRequest(draft);
    if (!parsed.success) {
      setInvalid(
        "Informe o trecho, a justificativa e os campos da regra ou do parâmetro.",
      );
      return;
    }
    setInvalid(undefined);
    create.mutate(parsed.data);
  };
  const sources = [
    ...new Set(
      [
        draft.sourceId,
        ...(profile.data?.standards ?? []),
        GENERIC_SOURCE,
      ].filter(Boolean),
    ),
  ];
  return (
    <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
      <CardHeader>
        <CardTitle>Aprovações de exceção</CardTitle>
        <CardDescription>
          Aprovações imutáveis por trecho: rebaixam a severidade de uma regra ou
          fixam diâmetro/declividade. Para alterar, remova e registre de novo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {waivers.isError && (
          <p role="alert" className="text-sm text-destructive">
            {waivers.error.message}
          </p>
        )}
        <ul className="space-y-2">
          {waivers.data?.map((waiver) => (
            <li
              key={waiver.id}
              className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  Trecho {waiver.segmentCode} ·{" "}
                  {waiver.type === "RULE"
                    ? `${waiver.ruleCode} → ${waiver.downgradeTo ? severityLabels[waiver.downgradeTo] : ""}`
                    : `${waiver.parameter === "DIAMETER" ? "Diâmetro" : "Declividade"} = ${waiver.value?.toLocaleString("pt-BR")}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {waiver.justification} ·{" "}
                  {new Date(waiver.approvedAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Remover aprovação do trecho ${waiver.segmentCode}`}
                disabled={remove.isPending}
                onClick={() => {
                  if (window.confirm("Remover esta aprovação?"))
                    remove.mutate(waiver.id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
          {waivers.data?.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Nenhuma aprovação registrada.
            </li>
          )}
        </ul>
        <fieldset
          aria-label="Nova aprovação"
          className="grid gap-3 rounded-md border p-4 md:grid-cols-3"
        >
          <select
            aria-label="Tipo de aprovação"
            className={selectClass}
            value={draft.type}
            onChange={(event) =>
              set({ type: event.target.value as WaiverDraft["type"] })
            }
          >
            <option value="RULE">Rebaixar regra</option>
            <option value="PARAMETER">Fixar parâmetro</option>
          </select>
          <select
            aria-label="Trecho da aprovação"
            className={selectClass}
            value={draft.segmentId}
            onChange={(event) => set({ segmentId: event.target.value })}
          >
            <option value="">Trecho...</option>
            {network.data?.segments.map((segment) => (
              <option key={segment.id} value={segment.id}>
                {segment.code}
              </option>
            ))}
          </select>
          {draft.type === "RULE" ? (
            <>
              <select
                aria-label="Fonte normativa"
                className={selectClass}
                value={draft.sourceId}
                onChange={(event) => set({ sourceId: event.target.value })}
              >
                <option value="">Fonte...</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
              <Input
                aria-label="Código da regra"
                placeholder="Código da regra"
                maxLength={100}
                value={draft.ruleCode}
                onChange={(event) => set({ ruleCode: event.target.value })}
              />
              <select
                aria-label="Nova severidade"
                className={selectClass}
                value={draft.downgradeTo}
                onChange={(event) =>
                  set({
                    downgradeTo: event.target
                      .value as WaiverDraft["downgradeTo"],
                  })
                }
              >
                <option value="WARNING">Alerta</option>
                <option value="INFO">Informação</option>
              </select>
            </>
          ) : (
            <>
              <select
                aria-label="Parâmetro fixado"
                className={selectClass}
                value={draft.parameter}
                onChange={(event) =>
                  set({
                    parameter: event.target.value as WaiverDraft["parameter"],
                  })
                }
              >
                <option value="DIAMETER">Diâmetro (mm)</option>
                <option value="SLOPE">Declividade (m/m)</option>
              </select>
              <Input
                aria-label="Valor aprovado"
                type="number"
                min="0"
                step="any"
                value={draft.value}
                onChange={(event) => set({ value: event.target.value })}
              />
            </>
          )}
          <Textarea
            aria-label="Justificativa da aprovação"
            placeholder="Justificativa técnica"
            maxLength={2000}
            className="md:col-span-3"
            value={draft.justification}
            onChange={(event) => set({ justification: event.target.value })}
          />
          <div className="md:col-span-3">
            <Button onClick={submit} disabled={create.isPending}>
              Registrar aprovação
            </Button>
          </div>
        </fieldset>
        {(invalid || create.isError || remove.isError) && (
          <p role="alert" className="text-sm text-destructive">
            {invalid ?? create.error?.message ?? remove.error?.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function NonconformityPanel({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<"" | TrackedNonconformity["status"]>(
    "OPEN",
  );
  const [waiverDraft, setWaiverDraft] = useState<WaiverDraft>(emptyWaiver);
  const tracked = useProjectList(
    projectId,
    [...projectQueryKeys.nonconformities(projectId), "list", status],
    status ? `nonconformities?status=${status}` : "nonconformities",
    z.array(trackedNonconformitySchema),
    "Não foi possível carregar as não conformidades.",
  );
  return (
    <div className="space-y-6">
      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
        <CardHeader>
          <CardTitle>Não conformidades registradas</CardTitle>
          <CardDescription>
            Achados do motor guardados a cada validação. Alertas e informações
            podem ser aceitos com justificativa; críticas exigem aprovação de
            exceção.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            aria-label="Filtrar por situação"
            className={`${selectClass} max-w-56`}
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="OPEN">Abertas</option>
            <option value="ACCEPTED">Aceitas</option>
            <option value="RESOLVED">Resolvidas</option>
            <option value="">Todas</option>
          </select>
          {tracked.isPending && <p className="text-sm">Carregando...</p>}
          {tracked.isError && (
            <p role="alert" className="text-sm text-destructive">
              {tracked.error.message}
            </p>
          )}
          <ul className="space-y-3">
            {tracked.data?.map((item) => (
              <NonconformityItem
                key={item.id}
                projectId={projectId}
                item={item}
                onWaive={(finding) =>
                  setWaiverDraft({
                    ...emptyWaiver,
                    segmentId: finding.segmentId ?? "",
                    sourceId: finding.sourceId,
                    ruleCode: finding.ruleCode,
                  })
                }
              />
            ))}
          </ul>
          {tracked.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma não conformidade nesta situação. Execute a validação para
              registrar os achados atuais.
            </p>
          )}
        </CardContent>
      </Card>
      <WaiversCard
        projectId={projectId}
        draft={waiverDraft}
        setDraft={setWaiverDraft}
      />
    </div>
  );
}
