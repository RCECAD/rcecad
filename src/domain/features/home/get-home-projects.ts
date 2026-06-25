"use server";

import { type Domain, DomainError } from "@/domain";
import type {
  HomeProjectsPayload,
  Project,
  ProjectsStatusSummary,
} from "@/domain/entities";

type Input = Record<string, never>;
type Output = HomeProjectsPayload;
type Setup = Domain<Input, Output>;

import { projectRows } from "./mock-projects";

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

export const getHomeProjects: Setup = async () => {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      recentProjects: projectRows.slice(0, 3),
      projects: projectRows,
      statusSummary: buildSummary(projectRows),
    };
  } catch (err) {
    console.error(err);
    return DomainError({
      msg: "An error occurred while trying to load home projects",
      err,
    });
  }
};
