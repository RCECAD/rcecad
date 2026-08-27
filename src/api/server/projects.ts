import "server-only";

import { redirect } from "next/navigation";
import type {
  HomeProjectsPayload,
  Project,
  ProjectsStatusSummary,
} from "@/domain/entities";
import {
  SpringApiError,
  springRequest,
  springRequestWithRefresh,
} from "./spring-client";

type ProjectsResponse = HomeProjectsPayload | Array<Project>;

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

function normalizeProjectsPayload(
  response: ProjectsResponse,
): HomeProjectsPayload {
  if (Array.isArray(response)) {
    return {
      recentProjects: response.slice(0, 3),
      projects: response,
      statusSummary: buildSummary(response),
    };
  }

  return response;
}

export async function getHomeProjects({
  refresh = false,
}: {
  refresh?: boolean;
} = {}): Promise<HomeProjectsPayload> {
  const request = refresh ? springRequestWithRefresh : springRequest;

  try {
    const response = await request<ProjectsResponse>("/projects");
    return normalizeProjectsPayload(response);
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 401) {
      redirect("/auth/login");
    }

    throw error;
  }
}

export async function getProjectById(
  projectId: string,
  {
    refresh = false,
  }: {
    refresh?: boolean;
  } = {},
): Promise<Project | undefined> {
  const request = refresh ? springRequestWithRefresh : springRequest;

  try {
    return await request<Project>(`/projects/${encodeURIComponent(projectId)}`);
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 404) {
      return undefined;
    }

    if (error instanceof SpringApiError && error.status === 401) {
      redirect("/auth/login");
    }

    throw error;
  }
}
