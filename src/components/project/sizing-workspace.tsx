"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DesignPanel } from "./design-results";
import { NetworkFieldEditor } from "./network-field-editor";
import { NetworkTopologyEditor } from "./network-topology-editor";
import { useUnsavedChanges } from "./unsaved-changes-provider";

export function SizingWorkspace({ projectId }: { projectId: string }) {
  const [dirty, setDirty] = useState(false);
  const router = useRouter();
  const { requestNavigation } = useUnsavedChanges();
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Dimensionamento</h1>
        <p className="text-muted-foreground">
          Complete os parâmetros hidráulicos, as cotas e os dados dos trechos
          para dimensionar a rede.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ["hydraulics", "Parâmetros hidráulicos"],
            ["paving", "Pavimentação"],
            ["flows", "Vazões concentradas"],
          ].map(([route, label]) => (
            <Button
              key={route}
              variant="outline"
              onClick={() =>
                requestNavigation(() =>
                  router.push(`/project/${projectId}/${route}`),
                )
              }
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <NetworkTopologyEditor projectId={projectId} />
      <NetworkFieldEditor projectId={projectId} onDirtyChange={setDirty} />
      <DesignPanel projectId={projectId} disabled={dirty} />
    </div>
  );
}
