import type { Project } from "@/domain/entities/project";

export type Segment = {
  id: string;
  project: Pick<Project, "id">;
  code: string;
  upstreamNodeId: string;
  downstreamNodeId: string;
  length: number;
  slope: number;
  upstreamInvert: number;
  downstreamInvert: number;
  pavementType: string | null;
  diameter: number | null;
  material: string | null;
  manning: number | null;
};

export type SegmentWithNodes = {
  id: string;
  code: string;
  upstreamNode: string;
  downstreamNode: string;
  upstreamInvert: number;
  downstreamInvert: number;
  length: number;
  slope: number;
  pavementType: string | null;
  diameter: number | null;
  material: string | null;
  manning: number | null;
};
