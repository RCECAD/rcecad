const skeleton = "h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
      <div className="space-y-3">
        <div className={skeleton} />
        <div className={skeleton} />
        <div className={skeleton} />
        <div className={skeleton} />
        <div className={skeleton} />
        <div className={skeleton} />
      </div>
    </main>
  );
}
