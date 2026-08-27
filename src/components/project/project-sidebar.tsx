"use client";

import {
  CheckSquare,
  Droplet,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderDown,
  Layers,
  LayoutGrid,
  Waves,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Project } from "@/domain/entities";
import { useUnsavedChanges } from "./unsaved-changes-provider";

interface ProjectSidebarProps {
  currentProject: Project;
  allProjects: Array<Project>;
}

export function ProjectSidebar({
  currentProject,
  allProjects,
}: Readonly<ProjectSidebarProps>) {
  const pathname = usePathname();
  const router = useRouter();
  const { requestNavigation } = useUnsavedChanges();

  // Extract the tab from the current path.
  // Paths look like /project/[projectId]/[tab]
  const currentTab = useMemo(() => {
    const parts = pathname.split("/");
    // parts: ["", "project", "projectId", "tab"]
    return parts[3] ?? "overview";
  }, [pathname]);

  const menuItems = useMemo(
    () => [
      {
        id: "overview",
        label: "Visão Geral",
        icon: LayoutGrid,
        href: `/project/${currentProject.id}/overview`,
      },
      {
        id: "general-data",
        label: "Dados Gerais",
        icon: FileText,
        href: `/project/${currentProject.id}/general-data`,
      },
      {
        id: "hydraulics",
        label: "Hidráulica",
        icon: Droplet,
        href: `/project/${currentProject.id}/hydraulics`,
      },
      {
        id: "flows",
        label: "Vazões",
        icon: Waves,
        href: `/project/${currentProject.id}/flows`,
      },
      {
        id: "paving",
        label: "Pavimentação",
        icon: Layers,
        href: `/project/${currentProject.id}/paving`,
      },
      {
        id: "sizing",
        label: "Dimensionamento",
        icon: CheckSquare,
        href: `/project/${currentProject.id}/sizing`,
      },
      {
        id: "validation",
        label: "Validação",
        icon: FileCheck2,
        href: `/project/${currentProject.id}/validation`,
      },
      {
        id: "results",
        label: "Resultados",
        icon: FileSpreadsheet,
        href: `/project/${currentProject.id}/results`,
      },
      {
        id: "export",
        label: "Exportação",
        icon: FolderDown,
        href: `/project/${currentProject.id}/export`,
      },
    ],
    [currentProject.id],
  );

  const handleProjectChange = (projectId: string) => {
    // Preserve the current tab (e.g. hydraulics) when switching projects
    requestNavigation(() => {
      router.push(`/project/${projectId}/${currentTab}`);
    });
  };

  return (
    <Sidebar
      className="border-r border-border bg-sidebar md:top-16 md:h-[calc(100vh-64px)]"
      data-slot="sidebar"
    >
      {/* Project Switcher Selector */}
      <SidebarHeader className="p-4 border-b border-border bg-sidebar/50">
        <Select value={currentProject.id} onValueChange={handleProjectChange}>
          <SelectTrigger className="w-full justify-between border-0 bg-transparent shadow-none hover:bg-muted/50 p-2 h-auto cursor-pointer focus:ring-0">
            <div className="flex flex-col items-start text-left">
              <span className="font-semibold text-foreground text-sm tracking-tight leading-none">
                {currentProject.name}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                RCEcad Project
              </span>
            </div>
          </SelectTrigger>
          <SelectContent position="popper" className="w-56">
            {allProjects.map((proj) => (
              <SelectItem key={proj.id} value={proj.id}>
                {proj.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarHeader>

      {/* Navigation Sections */}
      <SidebarContent className="px-2 py-4">
        <div className="px-3 py-1 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          Platform
        </div>
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  className={`w-full justify-start gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    isActive
                      ? "bg-sidebar-accent text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => {
                    if (!isActive) {
                      requestNavigation(() => router.push(item.href));
                    }
                  }}
                >
                  <Icon
                    className={`size-4 ${isActive ? "text-primary fill-primary/10" : ""}`}
                  />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
