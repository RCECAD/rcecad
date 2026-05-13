import { listProjects } from "@/domain/features/project/list-projects";
import { ProjectsClient } from "./client";

export default async function ProjectsPage() {
  const projects = await listProjects({});
  return <ProjectsClient projects={projects} />;
}
