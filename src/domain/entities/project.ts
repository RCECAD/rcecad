export type ProjectStatus = "pending" | "inProgress" | "validated" | "exported";

export type Project = {
  id: string;
  name: string;
  contractor: string | null;
  technicalManager: string | null;
  originalDxf: string | null;
  createdAt: Date;
  updatedAt: Date;
  location: string;
  owner: string;
  status: ProjectStatus;
  cnpj: string;
};

export type ProjectListItem = {
  id: string;
  name: string;
  contractor: string | null;
  createdAt: Date;
  totalSegments: number;
};

export type ProjectsStatusSummary = Record<ProjectStatus, number>;

export type HomeProjectsPayload = {
  recentProjects: Array<Project>;
  projects: Array<Project>;
  statusSummary: ProjectsStatusSummary;
};
