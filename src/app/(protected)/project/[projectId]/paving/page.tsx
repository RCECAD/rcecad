import { NetworkFieldEditor } from "@/components/project/network-field-editor";
export default async function PavingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="mx-auto max-w-[1088px] space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Pavimentação</h1>
      <NetworkFieldEditor projectId={projectId} mode="paving" />
    </div>
  );
}
