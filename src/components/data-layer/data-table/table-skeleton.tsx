import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="w-full rounded-md border">
      {/* header */}
      <div className="border-b p-3">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* rows */}
      <div className="p-3 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <>
          <div key={i} className="flex gap-3 items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* footer/pagination */}
      <div className="border-t p-3 flex justify-between items-center">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
