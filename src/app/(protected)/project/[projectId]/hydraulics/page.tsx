"use client";

import { useParams } from "next/navigation";
import { FormPageSkeleton } from "@/components/ui/loading-skeletons";
import { HydraulicsForm } from "./components/hydraulics-form";

export default function HydraulicsPage() {
  const params = useParams();
  const projectId =
    typeof params.projectId === "string" ? params.projectId : undefined;

  if (!projectId) {
    return <FormPageSkeleton sections={2} />;
  }

  return <HydraulicsForm projectId={projectId} />;
}
