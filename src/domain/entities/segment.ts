export type Segment = {
  id: string;
  projectId: string;
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
