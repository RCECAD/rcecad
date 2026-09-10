import { describe, expect, it } from "vitest";
import {
  loginResponseSchema,
  projectPageResponseSchema,
  projectParametersSchema,
} from "./spring";

const projectSummary = {
  id: "9e8c6966-c49a-4f2f-9d9a-0953d2f6d0dc",
  name: "Rede Centro",
  contractor: "Prefeitura Municipal",
  status: "inProgress",
  location: "Cascavel, PR",
  createdAt: "2026-09-10T18:00:00Z",
  totalSegments: 12,
};

describe("Spring contract schemas", () => {
  it("accepts the paginated project response published by Spring", () => {
    const result = projectPageResponseSchema.safeParse({
      content: [projectSummary],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a changed project response before it reaches the UI", () => {
    const result = projectPageResponseSchema.safeParse({
      content: [{ ...projectSummary, totalSegments: "12" }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    });

    expect(result.success).toBe(false);
  });

  it("accepts only the official hydraulic parameter fields", () => {
    expect(
      projectParametersSchema.safeParse({
        initialPopulation: 312,
        finalPopulation: 468,
        returnCoefficient: 0.8,
        perCapitaFlow: 220,
        infiltrationRate: 0.0001,
        peakDailyFactor: 1.25,
        peakHourlyFactor: 1.6,
        manningCoefficient: 0.01,
      }).success,
    ).toBe(true);

    expect(
      projectParametersSchema.safeParse({
        returnCoefficient: 0.8,
        consumptionPerCapita: 220,
      }).success,
    ).toBe(false);
  });

  it("requires both tokens from login and refresh responses", () => {
    expect(
      loginResponseSchema.safeParse({
        accessToken: "access",
        tokenType: "Bearer",
        expiresIn: 900,
        refreshToken: "refresh",
        refreshExpiresIn: 604800,
      }).success,
    ).toBe(true);
    expect(
      loginResponseSchema.safeParse({
        accessToken: "access",
        tokenType: "Bearer",
        expiresIn: 900,
      }).success,
    ).toBe(false);
  });
});
