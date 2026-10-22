import { SizingWorkspace } from "@/components/project/sizing-workspace";
export default async function SizingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <SizingWorkspace key={projectId} projectId={projectId} />;
}
