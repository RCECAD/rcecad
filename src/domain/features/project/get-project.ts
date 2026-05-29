"use server";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { hydraulicNodes, projects, segments } from "@/db/schema";
import { type Domain, DomainError } from "@/domain";
import type {
  HydraulicNode,
  NodeType,
  Project,
  SegmentWithNodes,
} from "@/domain/entities";

type Input = Pick<Project, "id">;

export type ProjectDetailOutput = {
  project: {
    id: string;
    name: string;
    contractor: string | null;
    technicalManager: string | null;
    createdAt: Date;
    updatedAt: Date;
    hasOriginalDxf: boolean;
  };
  nodes: HydraulicNode[];
  segments: SegmentWithNodes[];
} | null;

type Setup = Domain<Input, ProjectDetailOutput>;

const upstream = alias(hydraulicNodes, "upstream");
const downstream = alias(hydraulicNodes, "downstream");

export const getProject: Setup = async ({ id }) => {
  try {
    const [dbProject] = await db
      .select({
        id: projects.id,
        name: projects.name,
        contractor: projects.contractor,
        technicalManager: projects.technicalManager,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        originalDxf: projects.originalDxf,
      })
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!dbProject) return null;

    const [nodeRows, segmentRows] = await Promise.all([
      db
        .select()
        .from(hydraulicNodes)
        .where(eq(hydraulicNodes.projectId, id))
        .orderBy(hydraulicNodes.code),
      db
        .select({
          id: segments.id,
          code: segments.code,
          upstreamNode: upstream.code,
          downstreamNode: downstream.code,
          upstreamInvert: segments.upstreamInvert,
          downstreamInvert: segments.downstreamInvert,
          length: segments.length,
          slope: segments.slope,
          pavementType: segments.pavementType,
          diameter: segments.diameter,
          material: segments.material,
          manning: segments.manning,
        })
        .from(segments)
        .innerJoin(upstream, eq(segments.upstreamNodeId, upstream.id))
        .innerJoin(downstream, eq(segments.downstreamNodeId, downstream.id))
        .where(eq(segments.projectId, id))
        .orderBy(segments.code),
    ]);

    return {
      project: {
        id: dbProject.id,
        name: dbProject.name,
        contractor: dbProject.contractor,
        technicalManager: dbProject.technicalManager,
        createdAt: dbProject.createdAt,
        updatedAt: dbProject.updatedAt,
        hasOriginalDxf: dbProject.originalDxf !== null,
      },
      nodes: nodeRows.map((node) => ({
        id: node.id,
        projectId: node.projectId,
        code: node.code,
        type: node.type as NodeType,
        x: node.x,
        y: node.y,
        invertElevation: node.invertElevation,
        terrainElevation: node.terrainElevation,
        angle: node.angle,
      })),
      segments: segmentRows,
    };
  } catch (err) {
    console.error(err);
    return DomainError({ msg: "Error fetching project", err });
  }
};
