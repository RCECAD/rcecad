export type ProjectStatus = "pending" | "inProgress" | "validated" | "exported";

export type Project = {
  id: string;
  name: string;
  updatedAt: string;
  location: string;
  owner: string;
  status: ProjectStatus;
  cnpj: string;
};

export type ProjectsStatusSummary = Record<ProjectStatus, number>;

export type HomeProjectsPayload = {
  recentProjects: Array<Project>;
  projects: Array<Project>;
  statusSummary: ProjectsStatusSummary;
};
