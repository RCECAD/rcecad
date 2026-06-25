"use server";

import { type Domain, DomainError } from "@/domain";
import type {
  HomeProjectsPayload,
  Project,
  ProjectsStatusSummary,
} from "@/domain/entities";
import { getServerSession } from "@/lib/auth/session";
import {
  type ApiProjectSummary,
  listProjects,
} from "@/lib/projects/projects-api";

type Input = Record<string, never>;
type Output = HomeProjectsPayload;
type Setup = Domain<Input, Output>;

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

function toProject(summary: ApiProjectSummary, owner: string): Project {
  return {
    id: summary.id,
    name: summary.name,
    contractor: summary.contractor,
    technicalManager: null,
    originalDxf: null,
    createdAt: new Date(summary.createdAt),
    updatedAt: new Date(summary.createdAt),
    location: summary.location ?? "",
    owner,
    status: summary.status,
  };
}

export const getHomeProjects: Setup = async () => {
  try {
    const session = await getServerSession();
    const owner = session?.displayName ?? "";
    const page = await listProjects({ size: 100 }, session?.token);
    const projects = page.content.map((summary) => toProject(summary, owner));

    return {
      recentProjects: projects.slice(0, 3),
      projects,
      statusSummary: buildSummary(projects),
    };
  } catch (err) {
    console.error(err);
    return DomainError({
      msg: "An error occurred while trying to load home projects",
      err,
    });
  }
};
