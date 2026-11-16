import { notFound } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { getHomeProjects, getProjectById } from "@/api/server/projects";
import { ProjectSidebar } from "@/components/project/project-sidebar";
import { ProjectShellSkeleton } from "@/components/ui/loading-skeletons";
import { SidebarProvider } from "@/components/ui/sidebar";

interface ProjectLayoutProps {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}

export default function ProjectLayout(props: Readonly<ProjectLayoutProps>) {
  return (
    <Suspense fallback={<ProjectShellSkeleton />}>
      <ProjectLayoutContent {...props} />
    </Suspense>
  );
}

async function ProjectLayoutContent({
  children,
  params,
}: Readonly<ProjectLayoutProps>) {
  const { projectId } = await params;
  const [project, allProjectsPayload] = await Promise.all([
    getProjectById(projectId),
    getHomeProjects({ stats: false }),
  ]);

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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-muted/10 [scrollbar-gutter:stable]">
          <main className="mx-auto w-full min-w-0 max-w-[1600px] grow shrink-0 p-6 pb-12 md:p-8 md:pb-16">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
