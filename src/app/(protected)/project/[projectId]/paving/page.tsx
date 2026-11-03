import { NetworkFieldEditor } from "@/components/project/network-field-editor";
export default async function PavingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="flex min-w-0 flex-col gap-6 mx-auto max-w-[1088px]">
      <h1 className="text-2xl font-semibold tracking-tight">Pavimentação</h1>
      <NetworkFieldEditor projectId={projectId} mode="paving" />
    </div>
  );
}
