"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  Feedback,
  FeedbackActions,
  RequestError,
} from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NonconformityDetails } from "./nonconformity-details";

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
  if (history.isPending)
    return (
      <p role="status" className="text-xs">
        Carregando histórico de decisões...
      </p>
    );
  if (history.isError)
    return (
      <RequestError
        title="Não foi possível carregar o histórico"
        error={history.error}
        onRetry={() => void history.refetch()}
        retrying={history.isFetching}
      />
    );
  return (
    <ol className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
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
      toast.success("Decisão registrada.");
      await queryClient.invalidateQueries({
        queryKey: projectQueryKeys.nonconformities(projectId),
      });
    },
  });
  const canAccept = item.status === "OPEN" && item.severity !== "CRITICAL";
  return (
    <li className="flex min-w-0 flex-col gap-2 rounded-lg border p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {item.segmentCode
            ? `Trecho ${item.segmentCode}`
            : "Ocorrência do projeto"}
        </p>
        <span className="rounded-full border px-2 py-0.5 text-xs">
          {statusLabels[item.status]}
        </span>
      </div>
      <NonconformityDetails item={item} />
      {item.justification && (
        <p className="text-xs">Justificativa: {item.justification}</p>
      )}
      {canAccept && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label={`Justificativa para aceitar esta ocorrência${item.segmentCode ? ` no trecho ${item.segmentCode}` : ""}`}
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
      {item.status !== "RESOLVED" && (
        <FeedbackActions
          actions={[
            {
              label: "Revisar dados do projeto",
              href: `/project/${projectId}/${item.segmentId ? `sizing#segment-${item.segmentId}` : "hydraulics"}`,
            },
          ]}
        />
      )}
      {showHistory && (
        <DecisionHistory projectId={projectId} nonconformityId={item.id} />
      )}
      {decide.isError && (
        <RequestError
          title="Não foi possível registrar a decisão"
          error={decide.error}
        />
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
      toast.success("Aprovação de exceção registrada.", {
        description: "Valide o projeto novamente para conferir o resultado.",
      });
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
    onSuccess: async () => {
      toast.success("Aprovação removida.");
      await afterChange();
    },
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
      <CardContent className="flex min-w-0 flex-col gap-4">
        {waivers.isError && (
          <RequestError
            title="Não foi possível carregar as aprovações"
            error={waivers.error}
            onRetry={() => void waivers.refetch()}
            retrying={waivers.isFetching}
          />
        )}
        <ul className="flex min-w-0 flex-col gap-2">
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
              <ConfirmButton
                size="icon-sm"
                variant="ghost"
                aria-label={`Remover aprovação do trecho ${waiver.segmentCode}`}
                disabled={remove.isPending}
                title="Remover esta aprovação?"
                description="A regra ou o parâmetro voltará a ser avaliado sem esta exceção. Valide o projeto novamente após a remoção."
                confirmLabel="Remover aprovação"
                onConfirm={() => remove.mutate(waiver.id)}
              >
                <Trash2 className="size-4" />
              </ConfirmButton>
            </li>
          ))}
          {waivers.data?.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Nenhuma aprovação registrada.
            </li>
          )}
        </ul>
        {network.isError && (
          <RequestError
            title="Não foi possível carregar os trechos"
            error={network.error}
            onRetry={() => void network.refetch()}
            retrying={network.isFetching}
          />
        )}
        {profile.isError && (
          <RequestError
            title="Não foi possível carregar as fontes normativas"
            error={profile.error}
            onRetry={() => void profile.refetch()}
            retrying={profile.isFetching}
          />
        )}
        {network.data?.segments.length === 0 && (
          <Feedback
            title="Nenhum trecho disponível para aprovação"
            description="Cadastre a rede antes de registrar exceções."
            actions={[
              {
                label: "Cadastrar rede",
                href: `/project/${projectId}/sizing#network-topology`,
              },
            ]}
          />
        )}
        <fieldset
          disabled={
            create.isPending ||
            network.isPending ||
            network.isError ||
            network.data?.segments.length === 0
          }
          aria-label="Nova aprovação"
          className="grid gap-3 rounded-md border p-4 md:grid-cols-3"
        >
          <Select
            value={draft.type}
            onValueChange={(value) =>
              set({ type: value as WaiverDraft["type"] })
            }
          >
            <SelectTrigger aria-label="Tipo de aprovação" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RULE">Rebaixar regra</SelectItem>
              <SelectItem value="PARAMETER">Fixar parâmetro</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={draft.segmentId || "unset"}
            onValueChange={(value) =>
              set({ segmentId: value === "unset" ? "" : value })
            }
          >
            <SelectTrigger aria-label="Trecho da aprovação" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">Trecho...</SelectItem>
              {network.data?.segments.map((segment) => (
                <SelectItem key={segment.id} value={segment.id}>
                  {segment.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {draft.type === "RULE" ? (
            <>
              <Select
                value={draft.sourceId || "unset"}
                onValueChange={(value) =>
                  set({ sourceId: value === "unset" ? "" : value })
                }
              >
                <SelectTrigger aria-label="Fonte normativa" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Fonte...</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label="Código da regra"
                placeholder="Código da regra"
                maxLength={100}
                value={draft.ruleCode}
                onChange={(event) => set({ ruleCode: event.target.value })}
              />
              <Select
                value={draft.downgradeTo}
                onValueChange={(value) =>
                  set({ downgradeTo: value as WaiverDraft["downgradeTo"] })
                }
              >
                <SelectTrigger aria-label="Nova severidade" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WARNING">Alerta</SelectItem>
                  <SelectItem value="INFO">Informação</SelectItem>
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <Select
                value={draft.parameter}
                onValueChange={(value) =>
                  set({ parameter: value as WaiverDraft["parameter"] })
                }
              >
                <SelectTrigger aria-label="Parâmetro fixado" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIAMETER">Diâmetro (mm)</SelectItem>
                  <SelectItem value="SLOPE">Declividade (m/m)</SelectItem>
                </SelectContent>
              </Select>
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
              {create.isPending ? "Registrando..." : "Registrar aprovação"}
            </Button>
          </div>
        </fieldset>
        {invalid && (
          <Feedback
            tone="error"
            title="Revise os dados da aprovação"
            description={invalid}
          />
        )}
        {(create.isError || remove.isError) && (
          <RequestError
            title="Não foi possível atualizar as aprovações"
            error={create.error ?? remove.error}
          />
        )}
        {create.isSuccess && !draft.segmentId && (
          <Feedback
            tone="success"
            title="Aprovação registrada"
            description="Valide novamente para aplicar a exceção e conferir as pendências."
            actions={[
              { label: "Voltar à validação", href: "#project-validation" },
            ]}
          />
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
    <div className="flex min-w-0 flex-col gap-6">
      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
        <CardHeader>
          <CardTitle>Não conformidades registradas</CardTitle>
          <CardDescription>
            Ocorrências registradas a cada validação. Alertas e informações
            podem ser aceitos com justificativa; críticas exigem aprovação de
            exceção.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4">
          <Select
            value={status || "all"}
            onValueChange={(value) =>
              setStatus(value === "all" ? "" : (value as typeof status))
            }
          >
            <SelectTrigger
              aria-label="Filtrar por situação"
              className="w-full max-w-56"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Abertas</SelectItem>
              <SelectItem value="ACCEPTED">Aceitas</SelectItem>
              <SelectItem value="RESOLVED">Resolvidas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
          {tracked.isPending && (
            <p role="status" className="text-sm">
              Carregando não conformidades...
            </p>
          )}
          {tracked.isError && (
            <RequestError
              title="Não foi possível carregar as não conformidades"
              error={tracked.error}
              onRetry={() => void tracked.refetch()}
              retrying={tracked.isFetching}
            />
          )}
          <ul className="flex min-w-0 flex-col gap-3">
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
            <Feedback
              title="Nenhuma não conformidade nesta situação"
              description="Execute a validação para registrar as ocorrências atuais ou consulte as outras situações."
              actions={[
                ...(status
                  ? [{ label: "Mostrar todas", onClick: () => setStatus("") }]
                  : []),
                { label: "Voltar à validação", href: "#project-validation" },
              ]}
            />
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
