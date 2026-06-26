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

/** Response of GET /api/projects/{id}: the project plus its hydraulic topology. */
export type ApiProjectDetail = {
  project: ApiProject;
  nodes: ApiHydraulicNode[];
  segments: ApiSegment[];
};

export function getProject(
  id: string,
  token?: string | null,
): Promise<ApiProjectDetail> {
  return apiFetch<ApiProjectDetail>(`/api/projects/${id}`, { token });
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

// --- DXF import (PENDING API Phase 2) -------------------------------------
// Intended contract: the front uploads the raw DXF and the back-end parses it,
// builds the topology (NBR domain) and persists project + nodes + segments.
// The endpoint POST /api/projects/import-dxf does not exist yet.

export type ApiNodeType = "PV" | "TA" | "TQ" | "terminal";

export type ApiHydraulicNode = {
  id: string;
  projectId: string;
  code: string;
  type: ApiNodeType;
  x: number;
  y: number;
  invertElevation: number;
  terrainElevation: number | null;
  angle: number | null;
};

export type ApiSegment = {
  id: string;
  projectId: string;
  code: string;
  upstreamNodeId: string;
  downstreamNodeId: string;
  length: number;
  slope: number;
  upstreamInvert: number;
  downstreamInvert: number;
  pavementType: string | null;
  diameter: number | null;
  material: string | null;
  manning: number | null;
};

export type ApiImportDxfResult = {
  project: ApiProject;
  nodes: ApiHydraulicNode[];
  segments: ApiSegment[];
};

export function importDxf(
  name: string,
  dxf: string,
  token?: string | null,
): Promise<ApiImportDxfResult> {
  return apiFetch<ApiImportDxfResult>("/api/projects/import-dxf", {
    method: "POST",
    body: { name, dxf },
    token,
  });
}

/** Absolute URL of the DXF export endpoint (PENDING API Phase 2). */
export function exportDxfUrl(id: string): string {
  return `/api/projects/${id}/export-dxf`;
}
