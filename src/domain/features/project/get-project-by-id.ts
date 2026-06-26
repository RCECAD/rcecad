"use server";

import { type Domain, DomainError } from "@/domain";
import type { Project } from "@/domain/entities";
import { ApiError } from "@/lib/api";
import { getServerSession } from "@/lib/auth/session";
import { getProject } from "@/lib/projects/projects-api";

type Input = {
  projectId: string;
};
type Output = Project | undefined;
type Setup = Domain<Input, Output>;

export const getProjectById: Setup = async ({ projectId }) => {
  try {
    const session = await getServerSession();
    const { project } = await getProject(projectId, session?.token);

    return {
      id: project.id,
      name: project.name,
      contractor: project.contractor,
      technicalManager: project.technicalManager,
      originalDxf: null,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      location: project.location ?? "",
      owner: project.owner ?? "",
      status: project.status,
      cnpj: project.cnpj,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return undefined;
    }
    console.error(err);
    return DomainError({
      msg: `An error occurred while trying to load project with ID ${projectId}`,
      err,
    });
  }
};
