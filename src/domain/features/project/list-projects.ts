"use server";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, segments } from "@/db/schema";
import { type Domain, DomainError } from "@/domain";
import type { ProjectListItem } from "@/domain/entities";

type Input = Record<string, never>;
type Output = ProjectListItem[];
type Setup = Domain<Input, Output>;

export const listProjects: Setup = async () => {
  try {
    const rows = await db
      .select({
        id: projects.id,
        name: projects.name,
        contractor: projects.contractor,
        createdAt: projects.createdAt,
        totalSegments: count(segments.id),
      })
      .from(projects)
      .leftJoin(segments, eq(segments.projectId, projects.id))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      contractor: row.contractor,
      createdAt: row.createdAt,
      totalSegments: Number(row.totalSegments),
    }));
  } catch (err) {
    console.error(err);
    return DomainError({ msg: "Error listing projects", err });
  }
};
