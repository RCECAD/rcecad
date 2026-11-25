"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Cpu, PencilLine, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  invalidateProjectDependents,
  projectQueryKeys,
} from "@/api/client/query-keys";
import { getErrorMessage, parseClientJson } from "@/api/client/response";
import {
  type ProjectFlows,
  projectFlowsSchema,
  type SegmentFlow,
  type SingularContribution,
} from "@/api/contracts/resources";
import {
  contributionsQueryOptions,
  SingularContributionsEditor,
} from "@/components/project/singular-contributions-editor";
import { useOptionalUnsavedChanges } from "@/components/project/unsaved-changes-provider";
import { Badge } from "@/components/ui/badge";
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
import { TablePageSkeleton } from "@/components/ui/loading-skeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Horizon = "initial" | "final";
type Draft = Record<Horizon, string>;

const HORIZONS: { key: Horizon; label: string; short: string }[] = [
  { key: "initial", label: "inicial", short: "Qi" },
  { key: "final", label: "final", short: "Qf" },
];
// Display and comparison precision: below this the designer cannot tell values apart.
const DECIMALS = 3;

const lpsFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: DECIMALS,
});
const round = (value: number) => Number(value.toFixed(DECIMALS));

function informed(flow: SegmentFlow, horizon: Horizon) {
  return horizon === "initial"
    ? flow.informedInitialLps
    : flow.informedFinalLps;
}
function calculated(flow: SegmentFlow, horizon: Horizon) {
  return horizon === "initial"
    ? flow.calculatedInitialLps
    : flow.calculatedFinalLps;
}
function effective(flow: SegmentFlow, horizon: Horizon) {
  return horizon === "initial" ? flow.initialLps : flow.finalLps;
}
function savedDraft(flow: SegmentFlow): Draft {
  return {
    initial: String(round(flow.initialLps)),
    final: String(round(flow.finalLps)),
  };
}

/** Typing the value the system would use anyway keeps the segment calculated. */
export function toInformedLps(
  draft: string,
  flow: SegmentFlow,
  horizon: Horizon,
): number | null | "invalid" {
  if (draft.trim() === "") return null;
  const value = Number(draft);
  if (!Number.isFinite(value) || value < 0) return "invalid";
  if (
    informed(flow, horizon) === null &&
    round(value) === round(effective(flow, horizon))
  )
    return null;
  return value;
}

export function SegmentFlowsEditor({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const queryKey = projectQueryKeys.flows(projectId);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const flows = useQuery({
    queryKey,
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/flows`, { signal }),
        projectFlowsSchema,
        "Não foi possível calcular as vazões.",
      ),
    retry: false,
  });
  const contributions = useQuery(contributionsQueryOptions(projectId));
  const contributionCount = contributions.data?.length ?? 0;
  const [isContributionsOpen, setContributionsOpen] = useState(false);
  // Validation correction links point at #contribution-<id>, which is hidden while collapsed.
  useEffect(() => {
    const reveal = () => {
      if (window.location.hash.startsWith("#contribution-"))
        setContributionsOpen(true);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  const segments = flows.data?.segments ?? [];
  const dirty = segments.filter(
    (flow) =>
      drafts[flow.segmentId] &&
      JSON.stringify(drafts[flow.segmentId]) !==
        JSON.stringify(savedDraft(flow)),
  );
  const hasChanges = dirty.length > 0;
  const { setHasUnsavedChanges } = useOptionalUnsavedChanges() ?? {};
  useEffect(() => {
    setHasUnsavedChanges?.(hasChanges);
    return () => setHasUnsavedChanges?.(false);
  }, [hasChanges, setHasUnsavedChanges]);

  const save = useMutation({
    mutationFn: async (
      pending: {
        flow: SegmentFlow;
        initialLps: number | null;
        finalLps: number | null;
      }[],
    ) => {
      const failures: Record<string, string> = {};
      let latest: ProjectFlows | null = null;
      for (const { flow, initialLps, finalLps } of pending) {
        try {
          latest = await parseClientJson(
            await fetch(
              `/api/projects/${projectId}/flows/segments/${flow.segmentId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initialLps, finalLps }),
              },
            ),
            projectFlowsSchema,
            "Não foi possível salvar a vazão.",
          );
        } catch (error) {
          failures[flow.segmentId] = getErrorMessage(error);
        }
      }
      return {
        latest,
        failures,
        saved: pending.length - Object.keys(failures).length,
      };
    },
    onSuccess: async ({ latest, failures, saved }) => {
      setErrors(failures);
      setDrafts((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => failures[id]),
        ),
      );
      if (!saved) return;
      await invalidateProjectDependents(queryClient, projectId);
      if (latest) queryClient.setQueryData(queryKey, latest);
      toast.success(
        `${saved} ${saved === 1 ? "trecho atualizado" : "trechos atualizados"}.`,
        { description: "Recalcule o dimensionamento para aplicar as vazões." },
      );
    },
  });
  const busy = save.isPending;

  function update(flow: SegmentFlow, horizon: Horizon, value: string) {
    setDrafts((current) => ({
      ...current,
      [flow.segmentId]: {
        ...(current[flow.segmentId] ?? savedDraft(flow)),
        [horizon]: value,
      },
    }));
    setErrors(({ [flow.segmentId]: _, ...rest }) => rest);
  }

  function submit(targets: SegmentFlow[], restore = false) {
    const invalid: Record<string, string> = {};
    const pending = targets.flatMap((flow) => {
      if (restore) return [{ flow, initialLps: null, finalLps: null }];
      const draft = drafts[flow.segmentId] ?? savedDraft(flow);
      const initialLps = toInformedLps(draft.initial, flow, "initial");
      const finalLps = toInformedLps(draft.final, flow, "final");
      if (initialLps === "invalid" || finalLps === "invalid") {
        invalid[flow.segmentId] = "Informe vazões iguais ou maiores que zero.";
        return [];
      }
      return [{ flow, initialLps, finalLps }];
    });
    setErrors(invalid);
    if (pending.length && !Object.keys(invalid).length) save.mutate(pending);
  }

  if (flows.isPending)
    return <TablePageSkeleton label="Calculando vazões por trecho" />;
  if (flows.isError)
    return (
      <ErrorState
        title="Não foi possível calcular as vazões"
        description={getErrorMessage(flows.error)}
        retrying={flows.isFetching}
        onRetry={() => void flows.refetch()}
      />
    );

  const { availability, minimumDesignDischargeLps: floor } = flows.data;
  return (
    <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
      <CardHeader>
        <CardTitle>Vazões por trecho</CardTitle>
        <CardDescription>
          Calculadas pelo sistema com os parâmetros, a rede e as contribuições
          concentradas. Para hospital, indústria ou escola, cadastre uma
          contribuição concentrada; edite a vazão do trecho só quando souber o
          total por medição ou estudo, pois ela fica fixa e segue para jusante.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        {availability === "NO_PARAMETERS" && (
          <Feedback
            tone="warning"
            title="Informe os parâmetros hidráulicos"
            description="População, consumo, coeficientes e infiltração são necessários para calcular as vazões."
            actions={[
              {
                label: "Ir para hidráulica",
                href: `/project/${projectId}/hydraulics`,
              },
            ]}
          />
        )}
        {availability === "NO_NETWORK" && (
          <Feedback
            tone="warning"
            title="Cadastre a rede"
            description="As vazões são acumuladas trecho a trecho, de montante para jusante."
            actions={[
              {
                label: "Cadastrar rede",
                href: `/project/${projectId}/sizing#network-topology`,
              },
            ]}
          />
        )}
        {availability === "AVAILABLE" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {busy
                  ? "Salvando vazões..."
                  : `${dirty.length} ${dirty.length === 1 ? "trecho alterado" : "trechos alterados"}`}
              </p>
              <Button
                onClick={() => submit(dirty)}
                disabled={busy || !hasChanges}
              >
                <Save className="size-4" />
                {busy ? "Salvando..." : "Salvar vazões"}
              </Button>
            </div>
            <div className="max-h-[36rem] overflow-auto rounded-md border border-border/80">
              <Table className="min-w-[760px]">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Trecho</TableHead>
                    <TableHead>Qi (L/s)</TableHead>
                    <TableHead>Qf (L/s)</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="w-0">
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((flow) => (
                    <FlowRow
                      key={flow.segmentId}
                      flow={flow}
                      floor={floor}
                      contributions={(contributions.data ?? []).filter(
                        (item) => item.segmentId === flow.segmentId,
                      )}
                      draft={drafts[flow.segmentId] ?? savedDraft(flow)}
                      isDirty={dirty.includes(flow)}
                      error={errors[flow.segmentId]}
                      disabled={busy}
                      onChange={(horizon, value) =>
                        update(flow, horizon, value)
                      }
                      onRestore={() => submit([flow], true)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        {save.isError && (
          <RequestError
            title="Não foi possível salvar as vazões"
            error={save.error}
          />
        )}
        <details
          open={isContributionsOpen}
          onToggle={(event) => setContributionsOpen(event.currentTarget.open)}
          className="group rounded-lg border border-border/80"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <ChevronRight
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
            />
            <span className="font-medium">Contribuições concentradas</span>
            <span className="ml-auto text-muted-foreground">
              {contributionCount === 0
                ? "Nenhuma cadastrada"
                : `${contributionCount} ${contributionCount === 1 ? "cadastrada" : "cadastradas"}`}
            </span>
          </summary>
          <div className="border-t border-border/80 p-3">
            <SingularContributionsEditor projectId={projectId} />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

type FlowRowProps = {
  flow: SegmentFlow;
  floor: number;
  contributions: SingularContribution[];
  draft: Draft;
  isDirty: boolean;
  error?: string;
  disabled: boolean;
  onChange: (horizon: Horizon, value: string) => void;
  onRestore: () => void;
};

function FlowRow({
  flow,
  floor,
  contributions,
  draft,
  isDirty,
  error,
  disabled,
  onChange,
  onRestore,
}: FlowRowProps) {
  const isInformed =
    flow.informedInitialLps !== null || flow.informedFinalLps !== null;
  const errorId = `flow-${flow.segmentId}-error`;
  return (
    <TableRow id={`flow-${flow.segmentId}`} className="scroll-mt-24">
      <TableCell className="align-top">
        <span className="font-medium">{flow.code}</span>
        {contributions.map((item) => (
          <a
            key={item.id}
            href={`#contribution-${item.id}`}
            className="mt-1 block max-w-48 truncate text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {`+${lpsFormat.format(item.initialLps)} / ${lpsFormat.format(item.finalLps)} L/s ${item.name}`}
          </a>
        ))}
      </TableCell>
      {HORIZONS.map(({ key, label, short }) => {
        const own = informed(flow, key);
        const total = effective(flow, key);
        const fromUpstream =
          own === null && round(total) !== round(calculated(flow, key));
        return (
          <TableCell key={key} className="min-w-44 align-top">
            <Input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              aria-label={`Vazão ${label} (${short}) do trecho ${flow.code}, em L/s`}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              value={draft[key]}
              disabled={disabled}
              onChange={(event) => onChange(key, event.target.value)}
              className={
                own === null
                  ? "border-dashed bg-muted/40 tabular-nums text-muted-foreground focus-visible:text-foreground"
                  : "border-amber-400 tabular-nums dark:border-amber-600"
              }
            />
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {own !== null && (
                <p>Calculado: {lpsFormat.format(calculated(flow, key))}</p>
              )}
              {fromUpstream && <p>Inclui vazão informada a montante</p>}
              {total < floor && (
                <p>Dimensionado com o mínimo de {lpsFormat.format(floor)}</p>
              )}
            </div>
          </TableCell>
        );
      })}
      <TableCell className="align-top">
        {isDirty ? (
          <Badge
            variant="outline"
            className="border-amber-300 text-amber-800 dark:text-amber-300"
          >
            Não salvo
          </Badge>
        ) : isInformed ? (
          <Badge
            variant="outline"
            className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <PencilLine aria-hidden="true" />
            Informado
          </Badge>
        ) : (
          <Badge variant="secondary">
            <Cpu aria-hidden="true" />
            Sistema
          </Badge>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1 max-w-52 whitespace-normal text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </TableCell>
      <TableCell className="align-top">
        {isInformed && (
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={onRestore}
          >
            <RotateCcw className="size-4" />
            Restaurar calculado
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
