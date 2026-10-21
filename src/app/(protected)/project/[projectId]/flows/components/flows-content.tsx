"use client";
import { NetworkFieldEditor } from "@/components/project/network-field-editor";
export function FlowsContent({ projectId }: { projectId: string }) {
  return (
    <div className="mx-auto max-w-[1088px] space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Vazões</h1>
      <NetworkFieldEditor projectId={projectId} mode="contributions" />
    </div>
  );
}
