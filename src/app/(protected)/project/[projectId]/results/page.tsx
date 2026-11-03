import { DesignPanel } from "@/components/project/design-results";
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="flex min-w-0 flex-col gap-6 mx-auto max-w-[1088px]">
      <h1 className="text-2xl font-semibold tracking-tight">Resultados</h1>
      <DesignPanel projectId={projectId} tabbed />
    </div>
  );
}
