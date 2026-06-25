"use server";
import { type Domain, DomainError } from "@/domain";
import type { ProjectListItem } from "@/domain/entities";
import { getServerSession } from "@/lib/auth/session";
import { listProjects as listProjectsApi } from "@/lib/projects/projects-api";

type Input = Record<string, never>;
type Output = ProjectListItem[];
type Setup = Domain<Input, Output>;

export const listProjects: Setup = async () => {
  try {
    const session = await getServerSession();
    const page = await listProjectsApi({ size: 100 }, session?.token);

    return page.content.map((project) => ({
      id: project.id,
      name: project.name,
      contractor: project.contractor,
      createdAt: new Date(project.createdAt),
      totalSegments: project.totalSegments,
    }));
  } catch (err) {
    console.error(err);
    return DomainError({ msg: "Error listing projects", err });
  }
};
