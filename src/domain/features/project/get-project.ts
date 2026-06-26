"use server";
import { type Domain, DomainError } from "@/domain";
import type {
  HydraulicNode,
  Project,
  SegmentWithNodes,
} from "@/domain/entities";
import { ApiError } from "@/lib/api";
import { getServerSession } from "@/lib/auth/session";
import {
  type ApiHydraulicNode,
  type ApiSegment,
  getProject as getProjectApi,
} from "@/lib/projects/projects-api";

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

function toNode(node: ApiHydraulicNode): HydraulicNode {
  return {
    id: node.id,
    projectId: node.projectId,
    code: node.code,
    type: node.type,
    x: node.x,
    y: node.y,
    invertElevation: node.invertElevation,
    terrainElevation: node.terrainElevation,
    angle: node.angle,
  };
}

function toSegmentWithNodes(
  segment: ApiSegment,
  codeByNodeId: Map<string, string>,
): SegmentWithNodes {
  return {
    id: segment.id,
    code: segment.code,
    upstreamNode: codeByNodeId.get(segment.upstreamNodeId) ?? "",
    downstreamNode: codeByNodeId.get(segment.downstreamNodeId) ?? "",
    upstreamInvert: segment.upstreamInvert,
    downstreamInvert: segment.downstreamInvert,
    length: segment.length,
    slope: segment.slope,
    pavementType: segment.pavementType,
    diameter: segment.diameter,
    material: segment.material,
    manning: segment.manning,
  };
}

export const getProject: Setup = async ({ id }) => {
  try {
    const session = await getServerSession();
    const { project, nodes, segments } = await getProjectApi(
      id,
      session?.token,
    );

    const codeByNodeId = new Map(nodes.map((node) => [node.id, node.code]));

    return {
      project: {
        id: project.id,
        name: project.name,
        contractor: project.contractor,
        technicalManager: project.technicalManager,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        // PENDING (API Phase 2): originalDxf is not exposed by GET /api/projects/{id} yet.
        hasOriginalDxf: false,
      },
      nodes: nodes.map(toNode),
      segments: segments.map((segment) =>
        toSegmentWithNodes(segment, codeByNodeId),
      ),
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    console.error(err);
    return DomainError({ msg: "Error fetching project", err });
  }
};
