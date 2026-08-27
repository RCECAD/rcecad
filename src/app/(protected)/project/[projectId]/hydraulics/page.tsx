"use client";

import { useParams } from "next/navigation";
import { HydraulicsForm } from "./components/hydraulics-form";

export default function HydraulicsPage() {
  const params = useParams();
  const projectId =
    typeof params.projectId === "string" ? params.projectId : undefined;

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <HydraulicsForm projectId={projectId} />;
}
