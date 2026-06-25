"use server";
import { type Domain, DomainError } from "@/domain";
import type { HydraulicNode, Project, Segment } from "@/domain/entities";
import { getServerSession } from "@/lib/auth/session";
import {
  type ApiHydraulicNode,
  type ApiProject,
  type ApiSegment,
  importDxf as importDxfApi,
} from "@/lib/projects/projects-api";

type Input = {
  projectName: string;
  dxfContent: string;
};

type Output = {
  project: Project;
  nodes: HydraulicNode[];
  segments: Segment[];
};

type Setup = Domain<Input, Output>;

function toProject(project: ApiProject): Project {
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
}

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

function toSegment(segment: ApiSegment): Segment {
  return {
    id: segment.id,
    project: { id: segment.projectId },
    code: segment.code,
    upstreamNodeId: segment.upstreamNodeId,
    downstreamNodeId: segment.downstreamNodeId,
    length: segment.length,
    slope: segment.slope,
    upstreamInvert: segment.upstreamInvert,
    downstreamInvert: segment.downstreamInvert,
    pavementType: segment.pavementType,
    diameter: segment.diameter,
    material: segment.material,
    manning: segment.manning,
  };
}

// NOTE (API Phase 2): the DXF is uploaded raw to the back-end, which parses it and
// builds the topology (NBR domain). Targets the intended POST /api/projects/import-dxf,
// which does not exist yet, so import will fail until that slice ships.
export const importDxf: Setup = async ({ projectName, dxfContent }) => {
  try {
    const session = await getServerSession();
    const result = await importDxfApi(projectName, dxfContent, session?.token);

    return {
      project: toProject(result.project),
      nodes: result.nodes.map(toNode),
      segments: result.segments.map(toSegment),
    };
  } catch (err) {
    console.error(err);
    return DomainError({ msg: "Error importing DXF", err });
  }
};
