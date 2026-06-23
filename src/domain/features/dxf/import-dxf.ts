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
import { type DxfInsert, type DxfLine, parseDxf } from "@/lib/dxf-parser";

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
const POSITION_PRECISION = 3;
const OUTLET_CODE_PREFIX = "PV_OUTLET";

type NodeSeed = {
  code: string;
  x: number;
  y: number;
  invertElevation: number;
  angle: number | null;
};

type SegmentSeed = {
  code: string;
  upstreamCode: string;
  downstreamCode: string;
  length: number;
  slope: number;
  upstreamInvert: number;
  downstreamInvert: number;
  pavementType: string | null;
};

type PipeXdata = {
  segmentCode: string;
  upstreamCode: string;
  pavementType: string | null;
};

function posKey(x: number, y: number): string {
  return `${x.toFixed(POSITION_PRECISION)},${y.toFixed(POSITION_PRECISION)}`;
}

function parsePipeXdata(pipe: DxfLine): PipeXdata {
  const xdata = pipe.xdata[XDATA_APP] ?? [];
  return {
    segmentCode: xdata[0] ?? "unknown",
    upstreamCode: xdata[1] ?? "",
    pavementType: xdata[2] ?? null,
  };
}

function buildNetwork(pipes: DxfLine[], nodeInserts: DxfInsert[]) {
  const positionToCode = new Map<string, string>();

  for (const pipe of pipes) {
    const { upstreamCode } = parsePipeXdata(pipe);
    if (upstreamCode) {
      positionToCode.set(posKey(pipe.x0, pipe.y0), upstreamCode);
    }
  }

  let outletCounter = 0;
  for (const pipe of pipes) {
    const key = posKey(pipe.x1, pipe.y1);
    if (!positionToCode.has(key)) {
      outletCounter += 1;
      positionToCode.set(key, `${OUTLET_CODE_PREFIX}_${outletCounter}`);
    }
  }

  const nodeSeedByCode = new Map<string, NodeSeed>();

  for (const pipe of pipes) {
    const { upstreamCode } = parsePipeXdata(pipe);
    if (upstreamCode && !nodeSeedByCode.has(upstreamCode)) {
      nodeSeedByCode.set(upstreamCode, {
        code: upstreamCode,
        x: pipe.x0,
        y: pipe.y0,
        invertElevation: pipe.z0,
        angle: null,
      });
    }

    const downstreamCode = positionToCode.get(posKey(pipe.x1, pipe.y1));
    if (downstreamCode && !nodeSeedByCode.has(downstreamCode)) {
      nodeSeedByCode.set(downstreamCode, {
        code: downstreamCode,
        x: pipe.x1,
        y: pipe.y1,
        invertElevation: pipe.z1,
        angle: null,
      });
    }
  }

  for (const insert of nodeInserts) {
    const code = positionToCode.get(posKey(insert.x, insert.y));
    if (!code) continue;
    const seed = nodeSeedByCode.get(code);
    if (seed) seed.angle = insert.angle;
  }

  const segmentSeeds: SegmentSeed[] = [];
  const orphanSegments: string[] = [];

  for (const pipe of pipes) {
    const { segmentCode, upstreamCode, pavementType } = parsePipeXdata(pipe);
    const downstreamCode = positionToCode.get(posKey(pipe.x1, pipe.y1));

    if (!upstreamCode || !downstreamCode) {
      orphanSegments.push(segmentCode);
      continue;
    }

    const dx = pipe.x1 - pipe.x0;
    const dy = pipe.y1 - pipe.y0;
    const length = Math.sqrt(dx * dx + dy * dy);
    const slope = length > 0 ? (pipe.z0 - pipe.z1) / length : 0;

    segmentSeeds.push({
      code: segmentCode,
      upstreamCode,
      downstreamCode,
      length,
      slope,
      upstreamInvert: pipe.z0,
      downstreamInvert: pipe.z1,
      pavementType,
    });
  }

  return {
    nodeSeeds: Array.from(nodeSeedByCode.values()),
    segmentSeeds,
    orphanSegments,
  };
}

export const importDxf: Setup = async (input) => {
  try {
    const parsed = parseDxf(input.dxfContent);
    const pipes = parsed.lines.filter((line) => line.layer === PIPE_LAYER);
    const nodeInserts = parsed.inserts.filter(
      (insert) => insert.layer === NODE_LAYER && insert.block === NODE_LAYER,
    );

    if (pipes.length === 0) {
      return DomainError({
        msg: "DXF does not contain entities in SANC_REDE layer",
        err: "empty",
      });
    }

    const { nodeSeeds, segmentSeeds, orphanSegments } = buildNetwork(
      pipes,
      nodeInserts,
    );

    if (orphanSegments.length > 0) {
      return DomainError({
        msg: `DXF has segments without upstream/downstream nodes: ${orphanSegments.join(", ")}`,
        err: "orphan_segments",
      });
    }

    const result = await db.transaction(async (tx) => {
      const [dbProject] = await tx
        .insert(projects)
        .values({ name: input.projectName, originalDxf: input.dxfContent })
        .returning();

      const dbNodes = await tx
        .insert(hydraulicNodes)
        .values(
          nodeSeeds.map((seed) => ({
            projectId: dbProject.id,
            code: seed.code,
            type: "PV",
            x: seed.x,
            y: seed.y,
            invertElevation: seed.invertElevation,
            angle: seed.angle,
          })),
        )
        .returning();

      const nodeCodeToId = new Map(dbNodes.map((node) => [node.code, node.id]));

      const dbSegments = await tx
        .insert(segments)
        .values(
          segmentSeeds.map((seed) => {
            const upstreamNodeId = nodeCodeToId.get(seed.upstreamCode);
            const downstreamNodeId = nodeCodeToId.get(seed.downstreamCode);
            if (!upstreamNodeId || !downstreamNodeId) {
              throw new Error(
                `Segment ${seed.code} references unknown node codes (${seed.upstreamCode} → ${seed.downstreamCode})`,
              );
            }
            return {
              projectId: dbProject.id,
              code: seed.code,
              upstreamNodeId,
              downstreamNodeId,
              length: seed.length,
              slope: seed.slope,
              upstreamInvert: seed.upstreamInvert,
              downstreamInvert: seed.downstreamInvert,
              pavementType: seed.pavementType,
            };
          }),
        )
        .returning();

      return { dbProject, dbNodes, dbSegments };
    });

    return {
      project: {
        id: result.dbProject.id,
        name: result.dbProject.name,
        contractor: result.dbProject.contractor,
        technicalManager: result.dbProject.technicalManager,
        originalDxf: result.dbProject.originalDxf,
        createdAt: result.dbProject.createdAt,
        updatedAt: result.dbProject.updatedAt,
        location: "",
        owner: "",
        status: "pending" as const,
        cnpj: "",
      },
      nodes: result.dbNodes.map((node) => ({
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
      segments: result.dbSegments.map((segment) => ({
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
      })),
    };
  } catch (err) {
    console.error(err);
    return DomainError({ msg: "Error importing DXF", err });
  }
};
