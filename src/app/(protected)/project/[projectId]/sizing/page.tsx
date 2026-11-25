import { SizingWorkspace } from "@/components/project/sizing-workspace";
export default async function SizingPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ projectId }, { tab }] = await Promise.all([params, searchParams]);
  return (
    <SizingWorkspace key={projectId} projectId={projectId} initialTab={tab} />
  );
}
