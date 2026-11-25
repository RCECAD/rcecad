import {
  CircleCheck,
  CircleX,
  Download,
  Droplets,
  FileText,
  Info,
  RefreshCw,
  Siren,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Feedback,
  FeedbackActions,
  RequestError,
} from "@/components/ui/feedback";
import { InlineListSkeleton } from "@/components/ui/loading-skeletons";
import type { OverviewAlert } from "@/lib/overview-alerts";

const alertStyles = {
  CRITICAL: {
    label: "Erro crítico",
    Icon: CircleX,
    icon: "text-rose-600 dark:text-rose-400",
    style:
      "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30",
  },
  ALERT: {
    label: "Alerta",
    Icon: TriangleAlert,
    icon: "text-amber-500",
    style:
      "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
  },
  INFO: {
    label: "Informação",
    Icon: Info,
    icon: "text-blue-500",
    style:
      "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30",
  },
};

const quickActions = [
  { label: "Completar dados gerais", icon: FileText, route: "general-data" },
  {
    label: "Configurar dados hidráulicos",
    icon: Droplets,
    route: "hydraulics",
  },
  { label: "Exportar projeto", icon: Download, route: "export" },
];

const panelClassName = "rounded-lg border border-border/80 bg-card/40 p-5";
export function OverviewContent({
  projectId,
  projectDetails,
  stages,
  alerts,
  alertsLoading,
  alertsError,
  recentActions,
  onRefresh,
  refreshing,
  status,
  progressPercent,
  notice,
  historyHref,
}: {
  historyHref: string;
  progressPercent?: number;
  notice?: string;
  projectId: string;
  projectDetails: { label: string; value: string }[];
  stages: {
    title: string;
    description: string;
    complete: boolean;
    href: string;
  }[];
  alerts: OverviewAlert[];
  alertsLoading: boolean;
  alertsError: unknown;
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
  const progress = Math.round(
    progressPercent ??
      (stages.length
        ? (stages.filter((stage) => stage.complete).length / stages.length) *
          100
        : 0),
  );
  return (
    <div className="grid w-full min-w-0 gap-5 xl:gap-8 xl:grid-cols-[minmax(0,1fr)_350px]">
      <div className="flex min-w-0 flex-col gap-5">
        <section aria-labelledby="overview-title" className={panelClassName}>
          <h1 id="overview-title" className="text-base font-semibold">
            Visão geral do projeto
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Status atual: {status}
          </p>
          {notice && (
            <Feedback
              className="mt-3"
              tone="warning"
              title="Dimensionamento desatualizado"
              description={notice}
              actions={[
                {
                  label: "Validar novamente",
                  href: `/project/${projectId}/validation`,
                },
              ]}
            />
          )}
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
            Andamento por etapas
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
                  <div className="mt-3">
                    <FeedbackActions
                      actions={[
                        {
                          label: stage.complete
                            ? "Revisar etapa"
                            : "Completar etapa",
                          href: stage.href,
                        },
                      ]}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="overview-history" className={panelClassName}>
          <h2 id="overview-history" className="mb-5 text-sm font-semibold">
            Últimas ações
          </h2>
          <ol className="ml-2 mt-3">
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
          <div className="mt-5 flex justify-end">
            <Button asChild variant="secondary" size="xs">
              <Link href={historyHref}>Ver histórico completo</Link>
            </Button>
          </div>
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
            Pendências e alertas
          </h2>
          {alerts.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {alerts.length}{" "}
              {alerts.length === 1 ? "item requer" : "itens requerem"} sua
              atenção.
            </p>
          )}
          {alertsError != null && (
            <div className="mt-3">
              <RequestError
                title="Não foi possível carregar os alertas da validação"
                error={alertsError}
              />
            </div>
          )}
          {alertsLoading && (
            <div className="mt-3">
              <InlineListSkeleton label="Carregando alertas" rows={2} />
            </div>
          )}
          {!alertsLoading && alertsError == null && alerts.length === 0 && (
            <Feedback
              className="mt-3"
              tone="success"
              title="Nenhuma pendência ou alerta em aberto"
              description="Execute a validação para conferir as regras do dimensionamento."
              actions={[
                {
                  label: "Ir para validação",
                  href: `/project/${projectId}/validation`,
                },
              ]}
            />
          )}
          {alerts.length > 0 && (
            <ul className="mt-4 flex max-h-96 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
              {alerts.map((alert) => {
                const { Icon, label, style, icon } =
                  alertStyles[alert.severity];
                return (
                  <li
                    key={alert.key}
                    className={`flex min-w-0 items-start gap-2 rounded-md border px-2.5 py-3 text-xs leading-5 ${style}`}
                  >
                    <Icon
                      aria-hidden="true"
                      className={`mt-0.5 size-4 shrink-0 ${icon}`}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{label}</span>
                        {alert.target && (
                          <span className="rounded border border-border bg-background px-1.5 font-medium text-foreground">
                            {alert.target}
                          </span>
                        )}
                      </div>
                      <p className="break-words">{alert.title}</p>
                      <FeedbackActions
                        actions={[
                          { label: alert.actionLabel, href: alert.href },
                        ]}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
              {refreshing ? "Atualizando..." : "Atualizar"}
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
            Ações rápidas
          </h2>
          <div className="mt-5 flex min-w-0 flex-col gap-2">
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
