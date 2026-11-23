import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

const panelClassName =
  "rounded-lg border border-border/80 bg-card/40 p-5 shadow-none";

type LoadingStateProps = {
  children: ReactNode;
  className?: string;
  label: string;
};

export function LoadingState({
  children,
  className,
  label,
}: Readonly<LoadingStateProps>) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      aria-live="polite"
      className={className}
      role="status"
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

function Lines({ count = 3 }: { count?: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          // Skeleton rows are static placeholders and never reorder.
          key={`line-${index}`}
          className={cn("h-4", index === count - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function LandingSkeleton() {
  return (
    <LoadingState
      label="Carregando página inicial"
      className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-10 rounded-lg border border-slate-200 bg-white px-8 py-14 shadow-sm">
        <Skeleton className="h-9 w-40" />
        <div className="flex w-full flex-col items-center gap-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </LoadingState>
  );
}

export function AuthSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <LoadingState
      label="Carregando autenticação"
      className="flex min-h-screen items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 px-4 py-8"
    >
      <div className="mx-auto w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: fields }, (_, index) => (
            <FieldSkeleton key={`auth-field-${index}`} />
          ))}
          <Skeleton className="mt-2 h-10 w-full" />
        </div>
      </div>
    </LoadingState>
  );
}

export function ProtectedShellSkeleton() {
  return (
    <LoadingState
      label="Carregando aplicação"
      className="flex h-svh min-w-0 flex-col overflow-hidden"
    >
      <div className="flex h-20 items-center gap-6 border-b border-border bg-slate-50 px-4 lg:px-32">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="hidden h-4 w-52 sm:block" />
        <Skeleton className="ml-auto h-9 w-20" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col bg-background p-6 md:p-10">
        <div className="mx-auto w-full max-w-5xl">
          <Lines />
        </div>
      </div>
    </LoadingState>
  );
}

export function HomeSkeleton() {
  return (
    <LoadingState
      label="Carregando projetos"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background pt-16"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 text-center">
        <div className="flex w-full flex-col items-center gap-3">
          <Skeleton className="h-12 w-full max-w-sm" />
          <Skeleton className="h-9 w-full max-w-md" />
        </div>
        <Skeleton className="h-14 w-full max-w-3xl" />
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 pb-16 pt-10">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={`project-${index}`} className={panelClassName}>
              <Lines count={4} />
            </div>
          ))}
        </div>
      </div>
    </LoadingState>
  );
}

export function ProjectShellSkeleton() {
  return (
    <LoadingState
      label="Carregando projeto"
      className="flex min-h-0 flex-1 flex-row overflow-hidden"
    >
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar p-4 md:block">
        <Skeleton className="mb-8 h-12 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={`menu-${index}`} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-hidden p-6 md:p-8">
        <Skeleton className="mb-6 h-8 w-52" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className={panelClassName}><Lines count={5} /></div>
          <div className={panelClassName}><Lines count={4} /></div>
        </div>
      </main>
    </LoadingState>
  );
}

export function OverviewSkeleton() {
  return (
    <LoadingState label="Carregando visão geral" className="w-full min-w-0">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px] xl:gap-8">
        <div className="flex min-w-0 flex-col gap-5">
          <div className={panelClassName}><Lines count={6} /></div>
          <div className={panelClassName}>
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={`stage-${index}`} className="h-28 w-full" />
              ))}
            </div>
          </div>
          <div className={panelClassName}><Lines count={7} /></div>
        </div>
        <div className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
          <div className={panelClassName}><Lines count={6} /></div>
          <div className={panelClassName}><Lines count={4} /></div>
        </div>
      </div>
    </LoadingState>
  );
}

export function FormPageSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <LoadingState label="Carregando formulário" className="flex w-full min-w-0 flex-col gap-6">
      <Skeleton className="h-8 w-52" />
      {Array.from({ length: sections }, (_, section) => (
        <div key={`section-${section}`} className={cn(panelClassName, "space-y-5")}>
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, field) => (
              <FieldSkeleton key={`section-${section}-field-${field}`} />
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-4">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 w-28" />
      </div>
    </LoadingState>
  );
}

export function TablePageSkeleton({ label = "Carregando tabela" }: { label?: string }) {
  return (
    <LoadingState label={label} className="flex w-full min-w-0 flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <div className={cn(panelClassName, "min-w-0 space-y-5")}>
        <div className="space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="overflow-hidden rounded-lg border border-border">
          <Skeleton className="h-11 w-full rounded-none" />
          {Array.from({ length: 6 }, (_, row) => (
            <div key={`row-${row}`} className="grid grid-cols-4 gap-4 border-t p-3">
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-48" />
        </div>
      </div>
    </LoadingState>
  );
}

export function InlineListSkeleton({
  className,
  label,
  rows = 3,
}: {
  className?: string;
  label: string;
  rows?: number;
}) {
  return (
    <LoadingState label={label} className={cn("space-y-3", className)}>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={`list-row-${index}`}
          className="space-y-2 rounded-md border border-border/80 px-3 py-3"
        >
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </LoadingState>
  );
}

export function TableRowsSkeleton({
  columns = 4,
  label,
  rows = 5,
}: {
  columns?: number;
  label: string;
  rows?: number;
}) {
  return (
    <LoadingState label={label} className="overflow-x-auto rounded-lg border border-border/80">
      <div className="grid gap-3 bg-muted/20 p-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(4rem, 1fr))` }}>
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={`heading-${index}`} className="h-4" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={`table-row-${row}`}
          className="grid gap-3 border-t border-border/80 p-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(4rem, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={`cell-${row}-${column}`} className="h-5" />
          ))}
        </div>
      ))}
    </LoadingState>
  );
}

export function ResultPanelSkeleton({
  label,
  rows = 5,
}: {
  label: string;
  rows?: number;
}) {
  return (
    <LoadingState label={label} className={cn(panelClassName, "space-y-4")}>
      <Skeleton className="h-5 w-56" />
      <Lines count={rows} />
    </LoadingState>
  );
}

export function StatCardsSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={`stat-${index}`}
          className="flex h-32 items-end justify-between gap-4 rounded-lg border border-border/80 p-4"
        >
          <div className="space-y-3">
            <Skeleton className="size-7" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-14 w-14" />
        </div>
      ))}
    </div>
  );
}

export function SizingSkeleton() {
  return (
    <LoadingState label="Carregando dimensionamento" className="flex min-w-0 flex-col gap-8">
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-44" />
        </div>
      </div>
      <div className={cn(panelClassName, "space-y-4")}>
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-10 w-full max-w-xs" />
        <Lines count={7} />
      </div>
      <div className={panelClassName}><Lines count={4} /></div>
      <div className={cn(panelClassName, "space-y-4")}>
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-10 w-full max-w-xs" />
        <Lines count={7} />
      </div>
      <div className={panelClassName}><Lines count={3} /></div>
    </LoadingState>
  );
}

export function ValidationSkeleton() {
  return (
    <LoadingState label="Carregando validação" className="flex min-w-0 flex-col gap-6">
      <Skeleton className="h-8 w-40" />
      <div className={cn(panelClassName, "space-y-5")}>
        <Skeleton className="h-6 w-52" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={`validation-${index}`} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className={panelClassName}><Lines count={5} /></div>
    </LoadingState>
  );
}

export function ResultsSkeleton() {
  return (
    <LoadingState label="Carregando resultados" className="flex min-w-0 flex-col gap-6">
      <Skeleton className="h-8 w-40" />
      <div className="flex justify-between gap-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className={cn(panelClassName, "space-y-5")}>
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={`tab-${index}`} className="h-9 w-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </LoadingState>
  );
}

export function ExportSkeleton() {
  return (
    <LoadingState label="Carregando exportação" className="flex min-w-0 flex-col gap-6">
      <Skeleton className="h-8 w-44" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className={cn(panelClassName, "space-y-4")}>
          <Skeleton className="h-6 w-52" />
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={`document-${index}`} className="h-16 w-full" />
          ))}
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="space-y-5">
          <div className={panelClassName}><Lines count={5} /></div>
          <div className={panelClassName}><Lines count={5} /></div>
        </div>
      </div>
    </LoadingState>
  );
}
