import {
  CircleCheckBig,
  CircleDashed,
  ClipboardList,
  PackageCheck,
} from "lucide-react";
import type {
  HomeProject,
  HomeProjectStatus,
  HomeProjectsStatusSummary,
} from "@/domain/entities";

export function formatHomeProjectDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatHomeProjectDateLong(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function filterHomeProjects(
  projects: Array<HomeProject>,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return projects;
  }

  return projects.filter((project) =>
    [project.name, project.location, project.owner, project.status]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export function getRecentProjects(projects: HomeProject[], count = 3) {
  return [...projects].slice(0, count);
}

export function getProjectStatusCounts(
  projects: HomeProject[],
): HomeProjectsStatusSummary {
  return projects.reduce<HomeProjectsStatusSummary>(
    (acc, project) => {
      acc[project.status] += 1;
      return acc;
    },
    {
      pending: 0,
      inProgress: 0,
      validated: 0,
      exported: 0,
    },
  );
}

export function getStatusMeta(status: HomeProjectStatus) {
  const statuses = {
    pending: {
      label: "com pendências",
      shortLabel: "possui pendências",
      tone: "yellow",
      icon: ClipboardList,
    },
    inProgress: {
      label: "em andamento",
      shortLabel: "em andamento",
      tone: "slate",
      icon: CircleDashed,
    },
    validated: {
      label: "validados",
      shortLabel: "validado",
      tone: "teal",
      icon: CircleCheckBig,
    },
    exported: {
      label: "exportados",
      shortLabel: "exportado",
      tone: "blue",
      icon: PackageCheck,
    },
  } satisfies Record<
    HomeProjectStatus,
    {
      label: string;
      shortLabel: string;
      tone: "teal" | "yellow" | "blue" | "slate" | "rose";
      icon: typeof ClipboardList;
    }
  >;

  return statuses[status];
}
