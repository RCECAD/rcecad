export type Project = {
  id: string;
  name: string;
  contractor: string | null;
  technicalManager: string | null;
  originalDxf: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectListItem = {
  id: string;
  name: string;
  contractor: string | null;
  createdAt: Date;
  totalSegments: number;
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
