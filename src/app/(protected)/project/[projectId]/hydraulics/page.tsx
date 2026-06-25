"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/domain/entities";
import { getProjectById } from "@/domain/features/project/get-project-by-id";
import { HydraulicsForm } from "./components/hydraulics-form";

export default function HydraulicsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch project details to verify existence
  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      try {
        const proj = await getProjectById({ projectId });
        if (proj) {
          setProject(proj);
        } else {
          toast.error("Projeto não encontrado");
          router.push("/home");
        }
      } catch (err) {
        console.error("Error loading project: ", err);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId, router]);

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <HydraulicsForm projectId={projectId} />;
}
