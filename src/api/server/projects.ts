import "server-only";

import {
  type ProjectListQuery,
  type ProjectParameters,
  projectDetailResponseSchema,
  projectListQuerySchema,
  projectPageResponseSchema,
  projectParametersSchema,
  projectResponseSchema,
  updateProjectRequestSchema,
} from "@/api/contracts/spring";
import { toProject, toProjectFromDetail } from "@/api/server/project-adapters";
import type {
  HomeProjectsPayload,
  Project,
  ProjectsStatusSummary,
} from "@/domain/entities";
import type { GeneralDataFormValues } from "@/schemas/general-data";
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
  refresh = true,
}: {
  refresh?: boolean;
} = {}): Promise<HomeProjectsPayload> {
  const response = await listProjects({ page: 0, size: 100 }, { refresh });

  return {
    recentProjects: response.content.slice(0, 3),
    projects: response.content,
    statusSummary: buildSummary(response.content),
    page: response.page,
    size: response.size,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  };
}

export async function getProjectById(
  projectId: string,
  {
    refresh = true,
  }: {
    refresh?: boolean;
  } = {},
): Promise<Project | undefined> {
  const request = refresh ? springRequestWithRefresh : springRequest;

  try {
    const response = await request(
      projectPath(projectId),
      {},
      {
        schema: projectDetailResponseSchema,
      },
    );
    return toProjectFromDetail(response);
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 404) {
      return undefined;
    }

    throw error;
  }
}

export async function updateProject(
  projectId: string,
  values: GeneralDataFormValues,
): Promise<Project> {
  const payload = updateProjectRequestSchema.parse({
    name: values.name,
    contractor: values.contractor || null,
    technicalManager: values.technicalManager || null,
    location: values.location || null,
    status: values.status,
  });
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

export async function getProjectParameters(
  projectId: string,
): Promise<ProjectParameters> {
  return springRequestWithRefresh(
    `${projectPath(projectId)}/parameters`,
    {},
    {
      schema: projectParametersSchema,
    },
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
