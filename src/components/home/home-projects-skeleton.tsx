import { Skeleton } from "@/components/ui/skeleton";

const skeletonCardKeys = [
  "home-skeleton-card-1",
  "home-skeleton-card-2",
  "home-skeleton-card-3",
];

export function HomeProjectsSkeleton() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 pb-16 pt-10">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {skeletonCardKeys.map((key) => (
          <div
            key={key}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
