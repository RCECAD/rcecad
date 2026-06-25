"use server";

import { type Domain, DomainError } from "@/domain";
import type { Project } from "@/domain/entities";
import { projectRows } from "@/domain/features/home/mock-projects";

type Input = {
  projectId: string;
};
type Output = Project | undefined;
type Setup = Domain<Input, Output>;

export const getProjectById: Setup = async ({ projectId }) => {
  try {
    const project = projectRows.find((p) => p.id === projectId);
    return project;
  } catch (err) {
    console.error(err);
    return DomainError({
      msg: `An error occurred while trying to load project with ID ${projectId}`,
      err,
    });
  }
};
