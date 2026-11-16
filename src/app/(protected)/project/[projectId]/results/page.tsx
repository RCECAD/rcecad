import { DesignPanel } from "@/components/project/design-results";
export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ snapshot?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Resultados</h1>
      <DesignPanel projectId={projectId} snapshotId={query.snapshot} tabbed />
    </div>
  );
}
