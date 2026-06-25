/** Project endpoint bindings for the RCECAD Spring API. */

import { apiFetch } from "@/lib/api";

export type ApiProjectStatus =
  | "pending"
  | "inProgress"
  | "validated"
  | "exported";

/** Item of GET /api/projects (paginated summary). */
export type ApiProjectSummary = {
  id: string;
  name: string;
  contractor: string | null;
  status: ApiProjectStatus;
  location: string | null;
  createdAt: string;
  totalSegments: number;
};

/** Full project of GET/POST/PUT /api/projects[/{id}]. */
export type ApiProject = {
  id: string;
  name: string;
  contractor: string | null;
  technicalManager: string | null;
  location: string | null;
  status: ApiProjectStatus;
  owner: string | null;
  cnpj: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiPage<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ListProjectsParams = {
  page?: number;
  size?: number;
  status?: ApiProjectStatus;
  search?: string;
};

export function listProjects(
  params: ListProjectsParams = {},
  token?: string | null,
): Promise<ApiPage<ApiProjectSummary>> {
  const query = new URLSearchParams();
  if (params.page != null) query.set("page", String(params.page));
  if (params.size != null) query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  const qs = query.toString();
  return apiFetch<ApiPage<ApiProjectSummary>>(
    `/api/projects${qs ? `?${qs}` : ""}`,
    { token },
  );
}

export function getProject(
  id: string,
  token?: string | null,
): Promise<ApiProject> {
  return apiFetch<ApiProject>(`/api/projects/${id}`, { token });
}

export type CreateProjectBody = {
  name: string;
  contractor?: string | null;
  technicalManager?: string | null;
  location?: string | null;
};

export function createProject(
  body: CreateProjectBody,
  token?: string | null,
): Promise<ApiProject> {
  return apiFetch<ApiProject>("/api/projects", {
    method: "POST",
    body,
    token,
  });
}

export type UpdateProjectBody = CreateProjectBody & {
  status: ApiProjectStatus;
};

export function updateProject(
  id: string,
  body: UpdateProjectBody,
  token?: string | null,
): Promise<ApiProject> {
  return apiFetch<ApiProject>(`/api/projects/${id}`, {
    method: "PUT",
    body,
    token,
  });
}
