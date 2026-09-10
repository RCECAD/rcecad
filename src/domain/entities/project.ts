export type ProjectStatus = "pending" | "inProgress" | "validated" | "exported";

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  contractor?: string;
  technicalManager?: string;
  location?: string;
  owner?: string;
  status: ProjectStatus;
  cnpj?: string;
  totalSegments?: number;
};

export type ProjectsStatusSummary = Record<ProjectStatus, number>;

export type HomeProjectsPayload = {
  recentProjects: Array<Project>;
  projects: Array<Project>;
  statusSummary: ProjectsStatusSummary;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
