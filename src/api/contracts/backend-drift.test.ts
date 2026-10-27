// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  networkDesignSchema,
  projectOverviewSchema,
  segmentFieldDataSchema,
} from "./design";
import {
  projectDetailResponseSchema,
  projectParametersDetailsSchema,
  projectParametersSchema,
} from "./spring";

const projectId = "9e8c6966-c49a-4f2f-9d9a-0953d2f6d0dc";
const nodeA = "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0a01";
const nodeB = "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0a02";
const segmentId = "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0b01";

// Shapes mirror rcecad-back presentation DTOs at a0a43b3.
const backendSegment = {
  id: segmentId,
  projectId,
  code: "T-01",
  upstreamNodeId: nodeA,
  downstreamNodeId: nodeB,
  length: 50,
  slope: 0.005,
  upstreamInvert: 100,
  downstreamInvert: 99.75,
  pavementTypeRaw: "ASFALTO",
  pavementType: "PAVED_STREET_WITH_CURB_AND_GUTTER",
  elementType: "COLLECTOR",
  receivesDryWeatherFlow: false,
  surfaceMaterial: "ASPHALT",
  surfaceCondition: "GOOD",
  pavementNotes: null,
  fixedDiameterMm: null,
  material: null,
};

const backendNode = (id: string, code: string) => ({
  id,
  projectId,
  code,
  type: "PV",
  hasDropTube: false,
  x: 0,
  y: 0,
  invertElevation: 100,
  terrainElevation: 101.5,
  angle: null,
});

const backendDetail = {
  project: {
    id: projectId,
    name: "Rede Centro",
    contractor: null,
    technicalManager: null,
    location: null,
    status: "pending",
    owner: null,
    cnpj: "00000000000191",
    createdAt: "2026-10-20T12:00:00Z",
    updatedAt: "2026-10-21T12:00:00Z",
    internalCode: null,
    revision: "R1",
    systemType: null,
    horizon: null,
    notes: null,
    totalAreaKm2: null,
    totalNetworkLengthM: 1000,
    sector: null,
    basin: null,
  },
  nodes: [backendNode(nodeA, "PV-1"), backendNode(nodeB, "PV-2")],
  segments: [backendSegment],
  designOutdated: null,
  lastSnapshotAt: null,
};

const choice = {
  diameterMm: 150,
  slope: 0.006,
  material: "PVC JEI",
  upstreamInvertM: 100,
  diameterImposed: true,
  upstreamDropM: 0,
};

describe("current backend contract", () => {
  it("reads a project detail whose segments no longer carry contribution or legacy pipe fields", () => {
    const parsed = projectDetailResponseSchema.parse(backendDetail);
    expect(parsed.segments[0].fixedDiameterMm).toBeNull();
    expect(parsed.nodes[0].hasDropTube).toBe(false);
    expect(parsed.project.totalNetworkLengthM).toBe(1000);
  });

  it("sends segment field data without the contribution fields Spring now rejects", () => {
    const payload = segmentFieldDataSchema.parse({
      ...backendSegment,
      fixedDiameterMm: 200,
      material: "Concreto",
    });
    expect(payload).not.toHaveProperty("initialSingularContributionLps");
    expect(payload).toMatchObject({
      fixedDiameterMm: 200,
      material: "Concreto",
    });
  });

  it("accepts verified segments and adopted parameters in the design", () => {
    const parsed = networkDesignSchema.parse({
      projectId,
      rulesetVersionId: "nbr-baseline-1",
      justifications: [],
      adoptedParameters: [
        {
          key: "perCapitaFlow",
          unit: "L/hab.dia",
          value: 150,
          origin: "PROJECT:measuredValue",
          projectSupplied: true,
        },
      ],
      nonconformities: [],
      segments: [
        {
          status: "verified",
          segmentId,
          segmentCode: "T-01",
          rulesetVersionId: "nbr-baseline-1",
          justifications: [],
          choice,
          quantities: [],
          nonconformities: [],
        },
      ],
    });
    expect(parsed.segments[0].status).toBe("verified");
  });

  it("reads unconfigured parameters with baseline defaults", () => {
    const parsed = projectParametersDetailsSchema.parse({
      configured: false,
      initialPopulation: null,
      finalPopulation: null,
      returnCoefficient: 0.8,
      perCapitaFlow: null,
      infiltrationRate: null,
      infiltrationRateUnit: "L_PER_S_KM",
      peakDailyFactor: 1.2,
      peakHourlyFactor: 1.5,
      manningCoefficient: null,
      defaultNetworkMaterial: null,
      materialSwitch: null,
      justification: null,
      defaults: {
        returnCoefficient: { value: 0.8, source: "NBR 9649:1986" },
        perCapitaFlow: { value: null, source: null },
      },
      normativeProfile: {
        rulesetVersion: "nbr-baseline-1",
        name: "ABNT NBR 9649",
        standards: ["NBR 9649:1986"],
      },
    });
    expect(parsed.configured).toBe(false);
  });

  it("keeps the material switch when saving parameters", () => {
    const parsed = projectParametersSchema.parse({
      initialPopulation: 1,
      finalPopulation: 2,
      returnCoefficient: 0.8,
      perCapitaFlow: 150,
      infiltrationRate: null,
      peakDailyFactor: 1.2,
      peakHourlyFactor: 1.5,
      manningCoefficient: null,
      defaultNetworkMaterial: "PVC",
      materialSwitch: {
        fromMaterial: "PVC",
        toMaterial: "Concreto",
        aboveDiameterMm: 400,
      },
    });
    expect(parsed.materialSwitch?.aboveDiameterMm).toBe(400);
  });

  it("reads overview progress, steps and audit entity", () => {
    const parsed = projectOverviewSchema.parse({
      projectId,
      name: "Rede Centro",
      status: "pending",
      progressPercent: 50,
      steps: [{ step: "DXF_IMPORT", state: "DONE", detail: "1 trechos" }],
      pendingItems: { count: 0, items: [] },
      recentActions: [
        {
          id: segmentId,
          type: "WAIVER_CREATED",
          occurredAt: "2026-10-21T16:02:17.404859Z",
          userId: nodeA,
          detail: null,
          entityType: "WAIVER",
          entityId: segmentId,
        },
      ],
      designOutdated: true,
      lastSnapshotAt: "2026-10-21T16:02:17Z",
    });
    expect(parsed.progressPercent).toBe(50);
    expect(parsed.designOutdated).toBe(true);
  });
});
