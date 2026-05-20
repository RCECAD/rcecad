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

const projectRows: Array<Project> = [
  {
    id: "home-project-1",
    name: "Projeto 1",
    updatedAt: "2026-01-22T15:30:00.000Z",
    location: "Cascavel, PR",
    owner: "Giovane",
    status: "pending",
  },
  {
    id: "home-project-2",
    name: "Projeto 2",
    updatedAt: "2026-01-22T14:10:00.000Z",
    location: "Foz do Iguaçu, PR",
    owner: "Abel",
    status: "validated",
  },
  {
    id: "home-project-3",
    name: "Projeto 3",
    updatedAt: "2026-01-22T12:45:00.000Z",
    location: "Cascavel, PR",
    owner: "Caim",
    status: "exported",
  },
  {
    id: "home-project-4",
    name: "Projeto 4",
    updatedAt: "2026-01-22T11:20:00.000Z",
    location: "Cascavel, PR",
    owner: "Lucio",
    status: "inProgress",
  },
  {
    id: "home-project-5",
    name: "Projeto 5",
    updatedAt: "2026-01-22T09:05:00.000Z",
    location: "Cascavel, PR",
    owner: "Gabriel",
    status: "inProgress",
  },
  {
    id: "home-project-6",
    name: "Projeto 6",
    updatedAt: "2026-01-21T18:40:00.000Z",
    location: "Toledo, PR",
    owner: "Rafael",
    status: "pending",
  },
  {
    id: "home-project-7",
    name: "Projeto 7",
    updatedAt: "2026-01-21T17:15:00.000Z",
    location: "Maringá, PR",
    owner: "Amanda",
    status: "validated",
  },
  {
    id: "home-project-8",
    name: "Projeto 8",
    updatedAt: "2026-01-21T15:00:00.000Z",
    location: "Curitiba, PR",
    owner: "Felipe",
    status: "exported",
  },
  {
    id: "home-project-9",
    name: "Projeto 9",
    updatedAt: "2026-01-21T13:30:00.000Z",
    location: "Ponta Grossa, PR",
    owner: "Bianca",
    status: "pending",
  },
  {
    id: "home-project-10",
    name: "Projeto 10",
    updatedAt: "2026-01-21T10:20:00.000Z",
    location: "Cascavel, PR",
    owner: "Heitor",
    status: "inProgress",
  },
  {
    id: "home-project-11",
    name: "Projeto 11",
    updatedAt: "2026-01-20T19:00:00.000Z",
    location: "Londrina, PR",
    owner: "Karen",
    status: "validated",
  },
  {
    id: "home-project-12",
    name: "Projeto 12",
    updatedAt: "2026-01-20T16:25:00.000Z",
    location: "Chapecó, SC",
    owner: "Diego",
    status: "exported",
  },
];

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
