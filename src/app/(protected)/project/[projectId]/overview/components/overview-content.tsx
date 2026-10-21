import {
  CircleCheck,
  CircleX,
  Download,
  Droplets,
  FileText,
  RefreshCw,
  Siren,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const quickActions = [
  { label: "Completar Dados Gerais", icon: FileText, route: "general-data" },
  {
    label: "Configurar dados hidráulicos",
    icon: Droplets,
    route: "hydraulics",
  },
  { label: "Exportar Projeto", icon: Download, route: "export" },
];

const panelClassName = "rounded-lg border border-border/80 bg-card/40 p-5";
export function OverviewContent({
  projectId,
  projectDetails,
  stages,
  alerts,
  recentActions,
  onRefresh,
  refreshing,
  status,
}: {
  projectId: string;
  projectDetails: { label: string; value: string }[];
  stages: { title: string; description: string; complete: boolean }[];
  alerts: { title: string; href: string }[];
  recentActions: {
    id: string;
    title: string;
    detail: string | null;
    time: string;
  }[];
  onRefresh: () => void;
  refreshing: boolean;
  status: string;
}) {
  const progress = stages.length
    ? Math.round(
        (stages.filter((stage) => stage.complete).length / stages.length) * 100,
      )
    : 0;
  return (
    <div className="mx-auto grid w-full min-w-0 gap-5 xl:-mx-4 xl:w-[calc(100%+2rem)] xl:gap-8 xl:grid-cols-[minmax(0,1fr)_350px]">
      <div className="min-w-0 space-y-5">
        <section aria-labelledby="overview-title" className={panelClassName}>
          <h1 id="overview-title" className="text-base font-semibold">
            Visão Geral do Projeto
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Status atual: {status}
          </p>
          <dl className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-3">
            {projectDetails.map((detail) => (
              <div key={detail.label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">
                  {detail.label}
                </dt>
                <dd className="mt-0.5 break-words text-xs leading-5">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span id="overview-progress-label">Etapas concluídas</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div
              role="progressbar"
              aria-labelledby="overview-progress-label"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-2 overflow-hidden rounded-full bg-secondary"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Indicador das quatro etapas abaixo. Consulte a Validação para
            verificar a aptidão do dimensionamento.
          </p>
        </section>

        <section aria-labelledby="overview-stages" className={panelClassName}>
          <h2 id="overview-stages" className="mb-3 text-sm font-semibold">
            Andamento por Etapas
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
            {stages.map((stage) => {
              const Icon = stage.complete ? CircleCheck : CircleX;
              return (
                <li
                  key={stage.title}
                  className={`min-w-0 rounded-md border p-3 ${stage.complete ? "border-teal-300 bg-teal-50/80 dark:border-teal-800 dark:bg-teal-950/30" : "border-border/80"}`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`mb-2 size-5 ${stage.complete ? "text-teal-500" : "text-muted-foreground"}`}
                  />
                  <p className="text-xs font-medium">{stage.title}</p>
                  <p
                    className={`mt-0.5 text-xs ${stage.complete ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground"}`}
                  >
                    {stage.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="overview-history" className={panelClassName}>
          <h2 id="overview-history" className="mb-5 text-sm font-semibold">
            Últimas Ações
          </h2>
          <ol className="ml-2">
            {recentActions.length === 0 && (
              <li className="text-xs text-muted-foreground">
                Nenhuma ação registrada.
              </li>
            )}
            {recentActions.map((action, index) => (
              <li
                key={action.id}
                className="relative border-l-2 border-border pb-9 pl-4 last:border-transparent last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className={`absolute -left-[5px] top-1 size-2 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/60"}`}
                />
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-xs">
                  <div>
                    <p className="font-medium">{action.title}</p>
                    <p className="mt-1 text-muted-foreground">
                      {action.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums">
                    {action.time}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside
        aria-label="Pendências e ações do projeto"
        className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1"
      >
        <section aria-labelledby="overview-alerts" className={panelClassName}>
          <h2
            id="overview-alerts"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Siren
              aria-hidden="true"
              className="size-4 shrink-0 text-amber-500"
            />
            Pendências e Alertas
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {alerts.length}{" "}
            {alerts.length === 1 ? "item requer" : "itens requerem"} sua
            atenção.
          </p>
          <ul className="mt-5 space-y-2">
            {alerts.map((alert) => (
              <li
                key={`${alert.href}-${alert.title}`}
                className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-3 text-xs leading-5 dark:border-amber-800 dark:bg-amber-950/30"
              >
                <TriangleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-amber-500"
                />
                <Link href={alert.href} className="hover:underline">
                  {alert.title}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={refreshing}
              onClick={onRefresh}
              className="disabled:opacity-100"
            >
              <RefreshCw aria-hidden="true" />
              Atualizar
            </Button>
          </div>
        </section>
        <section aria-labelledby="overview-actions" className={panelClassName}>
          <h2
            id="overview-actions"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Sparkles
              aria-hidden="true"
              className="size-4 shrink-0 text-blue-500"
            />
            Ações Rápidas
          </h2>
          <div className="mt-5 space-y-2">
            {quickActions.map(({ label, icon: Icon, route }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                asChild
                className="h-auto min-h-10 w-full justify-start gap-2 whitespace-normal border-blue-200 bg-blue-100 px-2.5 py-2 text-left text-xs leading-5 shadow-none disabled:opacity-100 dark:border-blue-800 dark:bg-blue-950/30"
              >
                <Link href={`/project/${projectId}/${route}`}>
                  <Icon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-blue-500"
                  />
                  {label}
                </Link>
              </Button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
