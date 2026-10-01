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
import { Button } from "@/components/ui/button";

const projectDetails = [
  { label: "Responsável Técnico", value: "Giovane Comelli" },
  { label: "Criado em", value: "12/04/2026 - 12:22" },
  { label: "Última atualização", value: "12/04/2026 - 13:24" },
  { label: "Contratante", value: "Prefeitura Municipal de Cascavel" },
  { label: "Revisão", value: "rev.129" },
];

const stages = [
  { title: "DXF Importado", description: "233 MB", complete: true },
  { title: "Dados Gerais", description: "Incompleto", complete: false },
  { title: "Dados Hidráulicos", description: "Incompleto", complete: false },
  { title: "Exportação", description: "Nunca exportado", complete: false },
];

const alerts = [
  "Completar dados gerais do projeto",
  "Informar dados hidráulicos",
  "Cadastrar vazões concentradas",
];

const quickActions = [
  { label: "Completar Dados Gerais", icon: FileText },
  { label: "Configurar dados hidráulicos", icon: Droplets },
  { label: "Exportar Projeto", icon: Download },
];

const recentActions = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  title: "DXF Importado",
  detail: "233 MB",
  time: "Ontem, 23:33",
}));

const panelClassName = "rounded-lg border border-border/80 bg-card/40 p-5";
const progress = 23.2;

export function OverviewContent() {
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-7xl gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-5">
        <section aria-labelledby="overview-title" className={panelClassName}>
          <h1 id="overview-title" className="text-base font-semibold">
            Visão Geral do Projeto
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Status atual e informações principais
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
              <span id="overview-progress-label">Progresso Geral</span>
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
            3 itens requerem sua atenção.
          </p>
          <ul className="mt-5 space-y-2">
            {alerts.map((alert) => (
              <li
                key={alert}
                className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-3 text-xs leading-5 dark:border-amber-800 dark:bg-amber-950/30"
              >
                <TriangleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-amber-500"
                />
                {alert}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled
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
            {quickActions.map(({ label, icon: Icon }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                disabled
                className="h-auto min-h-10 w-full justify-start gap-2 whitespace-normal border-blue-200 bg-blue-100 px-2.5 py-2 text-left text-xs leading-5 shadow-none disabled:opacity-100 dark:border-blue-800 dark:bg-blue-950/30"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-blue-500"
                />
                {label}
              </Button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
