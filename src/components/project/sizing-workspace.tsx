"use client";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { projectQueryKeys } from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
import { isCalculated, type NetworkDesign } from "@/api/contracts/design";
import { projectParametersDetailsSchema } from "@/api/contracts/spring";
import { Button } from "@/components/ui/button";
import {
  DesignPanel,
  designStatusLabels,
  useDesignCalculation,
} from "./design-results";
import { NetworkFieldEditor } from "./network-field-editor";
import { NetworkTable } from "./network-table";
import { NetworkTopologyEditor } from "./network-topology-editor";
import { TabList, tabId } from "./tab-list";
import { useUnsavedChanges } from "./unsaved-changes-provider";

const sizingTabs = ["nodes", "segments", "results", "network"] as const;
type SizingTab = (typeof sizingTabs)[number];

const isSizingTab = (value: unknown): value is SizingTab =>
  sizingTabs.includes(value as SizingTab);

// Deep links from validation, audit and feedback point at rows inside a tab.
function tabForHash(hash: string): SizingTab | undefined {
  if (hash === "network-topology") return "network";
  if (hash.startsWith("node-")) return "nodes";
  if (hash.startsWith("segment-")) return "segments";
}

type Pending = { node: number; segment: number };

const pendingLabel = (count: number) =>
  count ? ` (${count} não ${count === 1 ? "salva" : "salvas"})` : "";

function designSummary(design: NetworkDesign) {
  const counts = Object.entries(designStatusLabels).flatMap(
    ([status, label]) => {
      const count = design.segments.filter((s) => s.status === status).length;
      return count ? [`${count} ${label.toLocaleLowerCase("pt-BR")}`] : [];
    },
  );
  const blocked = design.segments.filter(
    (s) =>
      !isCalculated(s) ||
      s.nonconformities.some((n) => n.severity === "CRITICAL"),
  ).length;
  const warned = design.segments.filter(
    (s) =>
      isCalculated(s) &&
      s.nonconformities.some((n) => n.severity === "WARNING") &&
      !s.nonconformities.some((n) => n.severity === "CRITICAL"),
  ).length;
  if (blocked) counts.push(`${blocked} não conforme${blocked > 1 ? "s" : ""}`);
  if (warned) counts.push(`${warned} com alerta${warned > 1 ? "s" : ""}`);
  return { text: counts.join(" · "), blocked, warned };
}

function CalculationStatus({
  design,
  pending,
}: {
  design: ReturnType<typeof useDesignCalculation>;
  pending: Pending;
}) {
  const unsaved = pending.node + pending.segment;
  if (unsaved > 0)
    return (
      <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        {unsaved}{" "}
        {unsaved === 1 ? "alteração não salva" : "alterações não salvas"}. Salve
        ou descarte antes de calcular.
      </p>
    );
  if (design.isFetching)
    return (
      <p className="text-sm text-muted-foreground">
        Calculando os trechos de montante para jusante…
      </p>
    );
  if (design.isError)
    return (
      <p className="flex items-center gap-2 text-sm text-destructive">
        <CircleX aria-hidden="true" className="size-4 shrink-0" />O último
        cálculo não foi concluído. Veja os detalhes em Resultados.
      </p>
    );
  if (!design.data)
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum cálculo executado nesta sessão.
      </p>
    );
  const { text, blocked, warned } = designSummary(design.data);
  const Icon = blocked ? CircleX : warned ? TriangleAlert : CircleCheck;
  const tone = blocked
    ? "text-rose-700 dark:text-rose-300"
    : warned
      ? "text-amber-700 dark:text-amber-300"
      : "text-teal-700 dark:text-teal-300";
  const time = new Date(design.dataUpdatedAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <p className={`flex items-center gap-2 text-sm ${tone}`}>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>
        Último cálculo às {time}: {text}.
      </span>
    </p>
  );
}

export function SizingWorkspace({
  projectId,
  initialTab,
}: {
  projectId: string;
  initialTab?: string;
}) {
  const [tab, setTab] = useState<SizingTab>(
    isSizingTab(initialTab) ? initialTab : "nodes",
  );
  const [pending, setPending] = useState<Pending>({ node: 0, segment: 0 });
  const [dirty, setDirty] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const panelId = useId();
  const { requestNavigation } = useUnsavedChanges();
  const design = useDesignCalculation(projectId);
  const parameters = useQuery({
    queryKey: projectQueryKeys.parameters(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/hydraulics`, { signal }),
        projectParametersDetailsSchema,
        "Não foi possível carregar os parâmetros.",
      ),
    retry: false,
  });
  useEffect(() => {
    const follow = () => {
      const target = tabForHash(window.location.hash.slice(1));
      if (target) setTab(target);
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, []);
  const onDirtyChange = useCallback((isDirty: boolean, counts: Pending) => {
    setDirty(isDirty);
    setPending(counts);
  }, []);
  const selectTab = (next: SizingTab) => {
    setTab(next);
    window.history.replaceState(null, "", `${pathname}?tab=${next}`);
  };
  const calculate = () => {
    selectTab("results");
    void design.refetch();
  };
  const tabs: [SizingTab, string][] = [
    ["nodes", `Cotas dos nós${pendingLabel(pending.node)}`],
    ["segments", `Trechos${pendingLabel(pending.segment)}`],
    ["results", "Resultados"],
    ["network", "Rede e topologia"],
  ];
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex min-w-0 flex-col gap-3">
        <h1 className="text-3xl font-bold">Dimensionamento</h1>
        <p className="text-muted-foreground">
          Complete os parâmetros hidráulicos, as cotas e os dados dos trechos
          para dimensionar a rede.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ["hydraulics", "Parâmetros hidráulicos"],
            ["paving", "Pavimentação"],
            ["flows", "Vazões concentradas"],
          ].map(([route, label]) => (
            <Button
              key={route}
              variant="outline"
              onClick={() =>
                requestNavigation(() =>
                  router.push(`/project/${projectId}/${route}`),
                )
              }
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div className="z-20 -mx-6 flex flex-col gap-3 border-y border-border/80 bg-background/95 px-6 py-3 backdrop-blur-sm md:sticky md:top-0 md:-mx-8 md:px-8">
        <section
          aria-label="Cálculo do dimensionamento"
          className="flex flex-wrap items-center gap-3"
        >
          <div aria-live="polite" className="min-w-0 flex-1 basis-64">
            <CalculationStatus design={design} pending={pending} />
          </div>
          <Button disabled={dirty || design.isFetching} onClick={calculate}>
            {design.isFetching ? "Calculando…" : "Calcular dimensionamento"}
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
        </section>
        <TabList
          label="Etapas do dimensionamento"
          panelId={panelId}
          tabs={tabs}
          value={tab}
          onChange={selectTab}
          className="flex flex-wrap gap-1 self-start rounded-md bg-muted p-1"
        />
      </div>
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(panelId, tab)}
        className="min-w-0"
      >
        {/* Hidden, not unmounted: unsaved drafts must survive tab switches. */}
        <div hidden={tab !== "nodes" && tab !== "segments"}>
          <NetworkFieldEditor
            projectId={projectId}
            view={tab === "segments" ? "segments" : "nodes"}
            onDirtyChange={onDirtyChange}
            projectMaterial={parameters.data?.defaultNetworkMaterial ?? null}
          />
        </div>
        <div hidden={tab !== "results"}>
          <DesignPanel projectId={projectId} />
        </div>
        <div hidden={tab !== "network"} className="flex flex-col gap-6">
          <NetworkTable projectId={projectId} />
          <NetworkTopologyEditor projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
