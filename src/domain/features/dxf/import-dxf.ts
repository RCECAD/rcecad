"use server";
import { db } from "@/db";
import { hydraulicNodes, projects, segments } from "@/db/schema";
import { type Domain, DomainError } from "@/domain";
import type {
  HydraulicNode,
  NodeType,
  Project,
  Segment,
} from "@/domain/entities";
import { parseDxf } from "@/lib/dxf-parser";

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

const PIPE_LAYER = "SANC_REDE";
const NODE_LAYER = "SANC_PV";
const XDATA_APP = "NUMEROTRE";

function posKey(x: number, y: number): string {
  return `${x.toFixed(3)},${y.toFixed(3)}`;
}

export const importDxf: Setup = async (input) => {
  try {
    const parsed = parseDxf(input.dxfContent);
    const pipes = parsed.lines.filter((l) => l.layer === PIPE_LAYER);
    const nodeInserts = parsed.inserts.filter(
      (ins) => ins.layer === NODE_LAYER && ins.block === NODE_LAYER,
    );

    if (pipes.length === 0) {
      return DomainError({
        msg: "DXF does not contain entities in SANC_REDE layer",
        err: "empty",
      });
    }

    // Map position → node code using upstream XDATA
    const positionToCode = new Map<string, string>();
    for (const pipe of pipes) {
      const nodeCode = pipe.xdata[XDATA_APP]?.[1];
      if (nodeCode) {
        positionToCode.set(posKey(pipe.x0, pipe.y0), nodeCode);
      }
    }

    // End points with no continuing segment → outlet nodes
    for (const pipe of pipes) {
      const key = posKey(pipe.x1, pipe.y1);
      if (!positionToCode.has(key)) {
        positionToCode.set(key, "PV_OUTLET");
      }
    }

    // Collect unique node data
    const nodeDataMap = new Map<
      string,
      { x: number; y: number; invertElevation: number; angle: number | null }
    >();

    for (const pipe of pipes) {
      const upstreamCode = pipe.xdata[XDATA_APP]?.[1];
      if (upstreamCode && !nodeDataMap.has(upstreamCode)) {
        nodeDataMap.set(upstreamCode, {
          x: pipe.x0,
          y: pipe.y0,
          invertElevation: pipe.z0,
          angle: null,
        });
      }
      const downstreamCode = positionToCode.get(posKey(pipe.x1, pipe.y1));
      if (downstreamCode && !nodeDataMap.has(downstreamCode)) {
        nodeDataMap.set(downstreamCode, {
          x: pipe.x1,
          y: pipe.y1,
          invertElevation: pipe.z1,
          angle: null,
        });
      }
    }

    // Match INSERT rotation angles to nodes
    for (const ins of nodeInserts) {
      const code = positionToCode.get(posKey(ins.x, ins.y));
      if (code) {
        const node = nodeDataMap.get(code);
        if (node) node.angle = ins.angle;
      }
    }

    // Insert project
    const [dbProject] = await db
      .insert(projects)
      .values({ name: input.projectName, originalDxf: input.dxfContent })
      .returning();

    // Insert hydraulic nodes
    const nodeCodeToId = new Map<string, string>();
    const nodesResult: HydraulicNode[] = [];

    for (const [code, data] of nodeDataMap) {
      const [dbNode] = await db
        .insert(hydraulicNodes)
        .values({
          projectId: dbProject.id,
          code,
          type: "PV",
          x: data.x,
          y: data.y,
          invertElevation: data.invertElevation,
          angle: data.angle,
        })
        .returning();

      nodeCodeToId.set(code, dbNode.id);
      nodesResult.push({
        id: dbNode.id,
        projectId: dbNode.projectId,
        code: dbNode.code,
        type: dbNode.type as NodeType,
        x: dbNode.x,
        y: dbNode.y,
        invertElevation: dbNode.invertElevation,
        terrainElevation: dbNode.terrainElevation,
        angle: dbNode.angle,
      });
    }

    // Insert segments
    const segmentsResult: Segment[] = [];

    for (const pipe of pipes) {
      const xdata = pipe.xdata[XDATA_APP] ?? [];
      const code = xdata[0] ?? "unknown";
      const upstreamCode = xdata[1] ?? "";
      const pavementType = xdata[2] ?? null;
      const downstreamCode = positionToCode.get(posKey(pipe.x1, pipe.y1));

      const upstreamNodeId = nodeCodeToId.get(upstreamCode);
      const downstreamNodeId = downstreamCode
        ? nodeCodeToId.get(downstreamCode)
        : undefined;

      if (!upstreamNodeId || !downstreamNodeId) continue;

      const dx = pipe.x1 - pipe.x0;
      const dy = pipe.y1 - pipe.y0;
      const length = Math.sqrt(dx * dx + dy * dy);
      const slope = length > 0 ? (pipe.z0 - pipe.z1) / length : 0;

      const [dbSegment] = await db
        .insert(segments)
        .values({
          projectId: dbProject.id,
          code,
          upstreamNodeId,
          downstreamNodeId,
          length,
          slope,
          upstreamInvert: pipe.z0,
          downstreamInvert: pipe.z1,
          pavementType,
        })
        .returning();

      segmentsResult.push({
        id: dbSegment.id,
        projectId: dbSegment.projectId,
        code: dbSegment.code,
        upstreamNodeId: dbSegment.upstreamNodeId,
        downstreamNodeId: dbSegment.downstreamNodeId,
        length: dbSegment.length,
        slope: dbSegment.slope,
        upstreamInvert: dbSegment.upstreamInvert,
        downstreamInvert: dbSegment.downstreamInvert,
        pavementType: dbSegment.pavementType,
        diameter: dbSegment.diameter,
        material: dbSegment.material,
        manning: dbSegment.manning,
      });
    }

    return {
      project: {
        id: dbProject.id,
        name: dbProject.name,
        contractor: dbProject.contractor,
        technicalManager: dbProject.technicalManager,
        originalDxf: dbProject.originalDxf,
        createdAt: dbProject.createdAt,
        updatedAt: dbProject.updatedAt,
      },
      nodes: nodesResult,
      segments: segmentsResult,
    };
  } catch (err) {
    console.error(err);
    return DomainError({ msg: "Error importing DXF", err });
  }
};
