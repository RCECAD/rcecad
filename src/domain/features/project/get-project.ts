"use server";
import { type Domain, DomainError } from "@/domain";
import type {
  HydraulicNode,
  Project,
  SegmentWithNodes,
} from "@/domain/entities";
import { ApiError } from "@/lib/api";
import { getServerSession } from "@/lib/auth/session";
import { getProject as getProjectApi } from "@/lib/projects/projects-api";

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

export const getProject: Setup = async ({ id }) => {
  try {
    const session = await getServerSession();
    const project = await getProjectApi(id, session?.token);

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
      // PENDING (API Phase 2): hydraulic nodes/segments endpoints are not implemented yet,
      // so the detail comes back empty until the back-end DXF/topology slices land.
      nodes: [],
      segments: [],
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    console.error(err);
    return DomainError({ msg: "Error fetching project", err });
  }
};
