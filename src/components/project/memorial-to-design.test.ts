import { describe, expect, it } from "vitest";
import type { CalculationMemorial } from "@/api/contracts/resources";
import { memorialToDesign } from "./memorial-to-design";

const projectId = "9e8c6966-c49a-4f2f-9d9a-0953d2f6d0dc";
const first = "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0b01";
const second = "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0b02";
const choice = {
  diameterMm: 150,
  slope: 0.005,
  material: "PVC",
  upstreamInvertM: 100,
  diameterImposed: true,
  upstreamDropM: 0,
};
const empty = {
  limits: [],
  nonconformities: [],
  justifications: ["registro"],
  conflicts: [],
  attempts: [],
  reason: null,
  blockedByCodes: [],
};
const memorial: CalculationMemorial = {
  identification: {
    projectId,
    name: "Rede",
    contractor: null,
    technicalManager: null,
    location: null,
    revision: "R0",
    horizon: null,
  },
  rulesetVersion: "nbr-baseline-2",
  generatedAt: "2026-10-27T12:00:00Z",
  adoptedParameters: [],
  formulas: [],
  segments: [
    {
      ...empty,
      segmentId: first,
      code: "T-01",
      outcome: "VERIFIED",
      choice,
      quantities: [
        { key: "tractiveTension", unit: "Pa", value: 1.2, formulaId: "F1" },
      ],
    },
    {
      ...empty,
      segmentId: second,
      code: "T-02",
      outcome: "NOT_EVALUATED",
      choice: null,
      quantities: [],
      reason: "Montante recusado",
      blockedByCodes: ["T-01"],
    },
  ],
  nonconformities: [],
  justifications: [],
  appliedContributions: [],
};

describe("stored memorial as a design result", () => {
  it("keeps outcome, choice and quantities, and resolves blocking codes to ids", () => {
    const design = memorialToDesign(memorial, projectId);
    expect(design.rulesetVersionId).toBe("nbr-baseline-2");
    const [verified, blocked] = design.segments;
    expect(verified).toMatchObject({
      status: "verified",
      segmentCode: "T-01",
      choice: { diameterMm: 150, diameterImposed: true },
      quantities: [{ key: "tractiveTension", value: 1.2 }],
    });
    expect(blocked).toMatchObject({
      status: "notEvaluated",
      reason: "Montante recusado",
      blockedBy: [first],
      blockedByCodes: ["T-01"],
    });
  });

  it("rejects an outcome the screen cannot represent", () => {
    expect(() =>
      memorialToDesign(
        {
          ...memorial,
          segments: [{ ...memorial.segments[0], outcome: "UNKNOWN" }],
        },
        projectId,
      ),
    ).toThrow();
  });
});
