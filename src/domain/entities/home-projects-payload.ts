import type { HomeProject } from "@/domain/entities/home-project";
import type { HomeProjectStatus } from "@/domain/entities/home-project-status";

export type HomeProjectsStatusSummary = Record<HomeProjectStatus, number>;

export type HomeProjectsPayload = {
  recentProjects: Array<HomeProject>;
  projects: Array<HomeProject>;
  statusSummary: HomeProjectsStatusSummary;
};
