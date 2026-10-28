import type {
  HydraulicNodeResponse,
  SegmentResponse,
} from "@/api/contracts/spring";

type Network = { nodes: HydraulicNodeResponse[]; segments: SegmentResponse[] };

// Depth = ground − invert, in metres, rounded to the millimetre.
const depth = (ground: number | null, invert: number) =>
  ground === null ? null : Math.round((ground - invert) * 1000) / 1000;

export function segmentRows({ nodes, segments }: Network) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return segments.map((segment) => {
    const upstream = byId.get(segment.upstreamNodeId);
    const downstream = byId.get(segment.downstreamNodeId);
    return {
      segment,
      upstreamCode: upstream?.code ?? "?",
      downstreamCode: downstream?.code ?? "?",
      upstreamGround: upstream?.terrainElevation ?? null,
      downstreamGround: downstream?.terrainElevation ?? null,
      upstreamDepth: depth(
        upstream?.terrainElevation ?? null,
        segment.upstreamInvert,
      ),
      downstreamDepth: depth(
        downstream?.terrainElevation ?? null,
        segment.downstreamInvert,
      ),
    };
  });
}

export function nodeRows({ nodes, segments }: Network) {
  return nodes.map((node) => ({
    ...node,
    incoming: segments.filter((s) => s.downstreamNodeId === node.id).length,
    outgoing: segments.filter((s) => s.upstreamNodeId === node.id).length,
    depth: depth(node.terrainElevation, node.invertElevation),
  }));
}

/** Segments from a start node to the outlet; `start` is the cumulative distance in metres. */
export function profilePath({ segments }: Network, startNodeId: string) {
  const leaving = new Map(segments.map((s) => [s.upstreamNodeId, s]));
  const path: { segment: SegmentResponse; start: number }[] = [];
  const visited = new Set<string>();
  let distance = 0;
  for (
    let current = leaving.get(startNodeId);
    current && !visited.has(current.id);
    current = leaving.get(current.downstreamNodeId)
  ) {
    visited.add(current.id);
    path.push({ segment: current, start: distance });
    distance += current.length;
  }
  return path;
}

/** Greedy label thinning: keeps a label only if it is `gap` px away from every kept one. */
export function spacedLabels(points: { x: number; y: number }[], gap: number) {
  const kept: { x: number; y: number }[] = [];
  return points.map((point) => {
    const free = kept.every(
      (other) => Math.hypot(other.x - point.x, other.y - point.y) >= gap,
    );
    if (free) kept.push(point);
    return free;
  });
}

/** Nodes nobody drains into: the natural starting points of a profile. */
export const headNodes = ({ nodes, segments }: Network) =>
  nodes.filter(
    (node) =>
      !segments.some((s) => s.downstreamNodeId === node.id) &&
      segments.some((s) => s.upstreamNodeId === node.id),
  );
