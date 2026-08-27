import { FolderOpen } from "lucide-react";
import { useId } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type EmptyStateProps = {
  description: string;
  title: string;
};

type PageLoadingProps = {
  label?: string;
};

export function EmptyState({
  description,
  title,
}: Readonly<EmptyStateProps>) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center"
    >
      <FolderOpen
        aria-hidden="true"
        className="mx-auto mb-4 size-10 text-muted-foreground"
      />
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </section>
  );
}

export function PageLoading({
  label = "Carregando conteúdo",
}: Readonly<PageLoadingProps>) {
  return (
    <div
      aria-label={label}
      aria-busy="true"
      aria-live="polite"
      className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10"
      role="status"
    >
      <span className="sr-only">{label}</span>
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["first", "second", "third"].map((item) => (
          <div
            key={item}
            className="space-y-4 rounded-xl border border-border bg-card p-5"
          >
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
