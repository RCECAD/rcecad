import "server-only";

import { z } from "zod";
import {
  authenticatedUserSchema,
  projectStatsSchema,
} from "@/api/contracts/resources";
import {
  type CreateProjectRequest,
  createProjectRequestSchema,
  type ProjectListQuery,
  type ProjectParameters,
  projectDetailResponseSchema,
  projectListQuerySchema,
  projectPageResponseSchema,
  projectParametersDetailsSchema,
  projectParametersSchema,
  projectResponseSchema,
  updateProjectRequestSchema,
} from "@/api/contracts/spring";
import {
  toProject,
  toProjectFromDetail,
  toProjectUpdateRequest,
} from "@/api/server/project-adapters";
import { springPageRequest } from "@/api/server/spring-page-client";
import type {
  HomeProjectsPayload,
  Project,
  ProjectsStatusSummary,
} from "@/domain/entities";
import type { GeneralDataFormValues } from "@/schemas/general-data";
import { isDevPreview, previewProject } from "./dev-preview";
import {
  SpringApiError,
  springRequest,
  springRequestWithRefresh,
} from "./spring-client";

function buildSummary(projects: Array<Project>): ProjectsStatusSummary {
  return projects.reduce<ProjectsStatusSummary>(
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

function projectPath(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}`;
}

function buildProjectListPath(query: ProjectListQuery) {
  const searchParams = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
  });

  if (query.status) {
    searchParams.set("status", query.status);
  }

  if (query.search) {
    searchParams.set("search", query.search);
  }

  return `/projects?${searchParams.toString()}`;
}

export async function listProjects(
  input: Partial<ProjectListQuery> = {},
  { refresh = true }: { refresh?: boolean } = {},
) {
  const query = projectListQuerySchema.parse(input);
  const request = refresh ? springRequestWithRefresh : springRequest;
  const response = await request(
    buildProjectListPath(query),
    {},
    {
      schema: projectPageResponseSchema,
    },
  );

  return {
    ...response,
    content: response.content.map(toProject),
  };
}

export async function getHomeProjects({
  refresh = false,
  stats = true,
}: {
  refresh?: boolean;
  stats?: boolean;
} = {}): Promise<HomeProjectsPayload> {
  if (isDevPreview) {
    return {
      recentProjects: [previewProject],
      projects: [previewProject],
      statusSummary: buildSummary([previewProject]),
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    };
  }

  const load = () =>
    Promise.all([
      listProjects({ page: 0, size: 100 }, { refresh }),
      stats
        ? (refresh ? springRequestWithRefresh : springRequest)(
            "/projects/stats",
            {},
            { schema: projectStatsSchema },
          )
        : undefined,
    ]);
  const [response, statusSummary] = await (refresh
    ? load()
    : springPageRequest(load, "/home"));

  return {
    recentProjects: response.content.slice(0, 3),
    projects: response.content,
    statusSummary: statusSummary ?? buildSummary(response.content),
    page: response.page,
    size: response.size,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  };
}

export async function getProjectById(
  projectId: string,
  {
    refresh = false,
  }: {
    refresh?: boolean;
  } = {},
): Promise<Project | undefined> {
  if (isDevPreview && projectId === previewProject.id) {
    return previewProject;
  }

  const request = refresh ? springRequestWithRefresh : springRequest;

  try {
    const load = () =>
      request(
        projectPath(projectId),
        {},
        {
          schema: projectDetailResponseSchema,
        },
      );
    const response = await (refresh
      ? load()
      : springPageRequest(load, `/project/${encodeURIComponent(projectId)}`));
    return toProjectFromDetail(response);
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 404) {
      return undefined;
    }

    throw error;
  }
}

export async function createProject(
  values: CreateProjectRequest,
): Promise<Project> {
  const response = await springRequestWithRefresh(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify(createProjectRequestSchema.parse(values)),
    },
    { schema: projectResponseSchema },
  );
  return toProject(response);
}

export async function importDxf(
  body: Blob,
  contentType: string,
): Promise<Project> {
  const response = await springRequestWithRefresh(
    "/projects/import-dxf",
    {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    },
    { schema: projectDetailResponseSchema, timeoutMs: 300_000 },
  );
  return toProjectFromDetail(response);
}

export async function updateProject(
  projectId: string,
  values: GeneralDataFormValues,
): Promise<Project> {
  const payload = updateProjectRequestSchema.parse(
    toProjectUpdateRequest(values),
  );
  const response = await springRequestWithRefresh(
    projectPath(projectId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    { schema: projectResponseSchema },
  );

  return toProject(response);
}

export async function getProjectParameters(projectId: string) {
  return springRequestWithRefresh(
    `${projectPath(projectId)}/parameters`,
    {},
    { schema: projectParametersDetailsSchema },
  );
}

export async function deleteProject(projectId: string): Promise<void> {
  await springRequestWithRefresh(
    projectPath(projectId),
    { method: "DELETE" },
    { schema: z.null() },
  );
}

export async function getCurrentUser() {
  if (isDevPreview) return null;
  return springPageRequest(
    () => springRequest("/users/me", {}, { schema: authenticatedUserSchema }),
    "/home",
  );
}

export async function updateProjectParameters(
  projectId: string,
  values: ProjectParameters,
): Promise<ProjectParameters> {
  const payload = projectParametersSchema.parse(values);
  return springRequestWithRefresh(
    `${projectPath(projectId)}/parameters`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    { schema: projectParametersSchema },
  );
}
