import { Skeleton } from "@/components/ui/skeleton";

export function AuditLoading() {
  return (
    <div
      role="status"
      aria-label="Carregando auditoria do projeto"
      className="space-y-4"
    >
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-28 w-full" />
      {["recent", "second", "third", "fourth"].map((item) => (
        <Skeleton key={item} className="h-32 w-full" />
      ))}
    </div>
  );
}
