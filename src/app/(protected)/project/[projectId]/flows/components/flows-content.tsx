"use client";
import { SingularContributionsEditor } from "@/components/project/singular-contributions-editor";
export function FlowsContent({ projectId }: { projectId: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-6 mx-auto max-w-[1088px]">
      <h1 className="text-2xl font-semibold tracking-tight">Vazões</h1>
      <SingularContributionsEditor projectId={projectId} />
    </div>
  );
}
