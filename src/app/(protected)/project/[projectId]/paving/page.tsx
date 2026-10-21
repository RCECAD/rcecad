import { NetworkFieldEditor } from "@/components/project/network-field-editor";
export default async function PavingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pavimentação</h1>
      <NetworkFieldEditor projectId={projectId} mode="paving" />
    </div>
  );
}
