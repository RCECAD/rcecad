import { notFound } from "next/navigation";
import { ProjectDetailClient } from "@/app/projects/[id]/client";
import { getProject } from "@/domain/features/project/get-project";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function SizingPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  const data = await getProject({ id: projectId });

  if (!data) {
    notFound();
  }

  return <ProjectDetailClient data={data} />;
}
