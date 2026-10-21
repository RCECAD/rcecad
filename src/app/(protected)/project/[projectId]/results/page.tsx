import { DesignPanel } from "@/components/project/design-results";
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Resultados</h1>
      <DesignPanel projectId={projectId} />
    </div>
  );
}
