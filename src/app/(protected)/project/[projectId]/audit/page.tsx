import { Suspense } from "react";
import { AuditLoading } from "@/components/project/audit-loading";
import { ProjectAudit } from "@/components/project/project-audit";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<AuditLoading />}>
      <ProjectAudit projectId={projectId} />
    </Suspense>
  );
}
