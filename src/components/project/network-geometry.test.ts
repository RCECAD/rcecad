import { describe, expect, it } from "vitest";
import type {
  HydraulicNodeResponse,
  SegmentResponse,
} from "@/api/contracts/spring";
import {
  nodeRows,
  profilePath,
  segmentRows,
  spacedLabels,
} from "./network-geometry";

const projectId = "9e8c6966-c49a-4f2f-9d9a-0953d2f6d0dc";
const node = (
  id: string,
  code: string,
  invert: number,
  terrain: number | null,
): HydraulicNodeResponse => ({
  id,
  projectId,
  code,
  type: "PV",
  hasDropTube: false,
  x: 0,
  y: 0,
  invertElevation: invert,
  terrainElevation: terrain,
  angle: null,
});
const segment = (
  id: string,
  code: string,
  upstreamNodeId: string,
  downstreamNodeId: string,
  length: number,
): SegmentResponse => ({
  id,
  projectId,
  code,
  upstreamNodeId,
  downstreamNodeId,
  length,
  slope: 0.01,
  upstreamInvert: 100,
  downstreamInvert: 99,
  pavementTypeRaw: null,
  pavementType: null,
  elementType: null,
  receivesDryWeatherFlow: null,
  surfaceMaterial: null,
  surfaceCondition: null,
  pavementNotes: null,
  fixedDiameterMm: null,
  material: null,
});
const nodes = [
  node("a", "PV-1", 100, 101.5),
  node("b", "PV-2", 99, 100.6),
  node("c", "PV-3", 98, null),
  node("d", "PV-4", 99.5, 101),
];
const segments = [
  segment("t1", "T-1", "a", "b", 40),
  segment("t2", "T-2", "b", "c", 60),
  segment("t3", "T-3", "d", "b", 30),
];

describe("network geometry", () => {
  it("derives segment depths from ground and invert, leaving unknown ground blank", () => {
    const [first, second] = segmentRows({ nodes, segments });
    expect(first).toMatchObject({
      upstreamCode: "PV-1",
      downstreamCode: "PV-2",
      upstreamDepth: 1.5,
      downstreamDepth: 1.6,
    });
    expect(second.downstreamDepth).toBeNull();
  });

  it("counts arriving and leaving segments per node", () => {
    const b = nodeRows({ nodes, segments }).find((row) => row.code === "PV-2");
    expect(b).toMatchObject({ incoming: 2, outgoing: 1, depth: 1.6 });
  });

  it("hides labels that would overlap a label already drawn", () => {
    expect(
      spacedLabels(
        [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 40, y: 0 },
          { x: 42, y: 3 },
        ],
        20,
      ),
    ).toEqual([true, false, true, false]);
  });

  it("follows the flow from a start node to the outlet with cumulative distance", () => {
    const path = profilePath({ nodes, segments }, "d");
    expect(path.map((step) => step.segment.code)).toEqual(["T-3", "T-2"]);
    expect(path.map((step) => step.start)).toEqual([0, 30]);
  });
});
