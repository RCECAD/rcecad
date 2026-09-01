import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getHomeProjects, getProjectById } from "@/api/server/projects";
import { ProjectSidebar } from "@/components/project/project-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface ProjectLayoutProps {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function ProjectLayout({
  children,
  params,
}: Readonly<ProjectLayoutProps>) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  const allProjectsPayload = await getHomeProjects();

  if (!project) {
    notFound();
  }

  const allProjects = allProjectsPayload.projects.some(
    (item) => item.id === project.id,
  )
    ? allProjectsPayload.projects
    : [project, ...allProjectsPayload.projects];

  return (
    <SidebarProvider
      defaultOpen
      className="flex flex-1 flex-row min-h-0 h-full"
    >
      <div className="flex min-h-0 flex-1 flex-row w-full overflow-hidden">
        <ProjectSidebar currentProject={project} allProjects={allProjects} />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-muted/10">
          <main className="flex-1 min-h-0 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
