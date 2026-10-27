import { ExportContent } from "./components/export-content";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ExportContent projectId={projectId} />;
}
