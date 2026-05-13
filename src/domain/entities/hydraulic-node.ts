export type NodeType = "PV" | "TA" | "TQ" | "terminal";

export type HydraulicNode = {
  id: string;
  projectId: string;
  code: string;
  type: NodeType;
  x: number;
  y: number;
  invertElevation: number;
  terrainElevation: number | null;
  angle: number | null;
};
