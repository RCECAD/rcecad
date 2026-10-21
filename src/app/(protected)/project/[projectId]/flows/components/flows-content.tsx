"use client";
import { NetworkFieldEditor } from "@/components/project/network-field-editor";
export function FlowsContent({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Vazões</h1>
      <NetworkFieldEditor projectId={projectId} mode="contributions" />
    </div>
  );
}
