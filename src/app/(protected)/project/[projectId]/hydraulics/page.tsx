"use client";

import { useParams } from "next/navigation";
import { PageLoading } from "@/components/ui/page-state";
import { HydraulicsForm } from "./components/hydraulics-form";

export default function HydraulicsPage() {
  const params = useParams();
  const projectId =
    typeof params.projectId === "string" ? params.projectId : undefined;

  if (!projectId) {
    return <PageLoading label="Carregando projeto" />;
  }

  return <HydraulicsForm projectId={projectId} />;
}
