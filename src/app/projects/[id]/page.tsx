import { notFound } from "next/navigation";
import { getProject } from "@/domain/features/project/get-project";
import { ProjectDetailClient } from "./client";

export default async function ProjectDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const data = await getProject({ id });

  if (!data) notFound();

  return <ProjectDetailClient data={data} />;
}
