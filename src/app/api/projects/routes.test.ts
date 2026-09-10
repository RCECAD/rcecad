import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProjectById: vi.fn(),
  getProjectParameters: vi.fn(),
  listProjects: vi.fn(),
  toGeneralDataFormValues: vi.fn(),
  updateProject: vi.fn(),
  updateProjectParameters: vi.fn(),
}));

vi.mock("@/api/server/projects", () => ({
  getProjectById: mocks.getProjectById,
  getProjectParameters: mocks.getProjectParameters,
  listProjects: mocks.listProjects,
  updateProject: mocks.updateProject,
  updateProjectParameters: mocks.updateProjectParameters,
}));
vi.mock("@/api/server/project-adapters", () => ({
  toGeneralDataFormValues: mocks.toGeneralDataFormValues,
}));
vi.mock("@/api/server/route-errors", () => ({
  routeErrorResponse: (error: unknown) =>
    Response.json({ error: String(error) }, { status: 500 }),
}));

import {
  GET as getGeneralData,
  PUT as updateGeneralData,
} from "./[projectId]/general-data/route";
import {
  GET as getHydraulics,
  PUT as updateHydraulics,
} from "./[projectId]/hydraulics/route";
import { GET as listProjects } from "./route";

const parameters = {
  initialPopulation: 312,
  finalPopulation: 468,
  returnCoefficient: 0.8,
  perCapitaFlow: 220,
  infiltrationRate: 0.0001,
  peakDailyFactor: 1.25,
  peakHourlyFactor: 1.6,
  manningCoefficient: 0.01,
};

describe("protected project route handlers", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => {
      mock.mockReset();
    });
  });

  it("passes only validated pagination filters to the project list", async () => {
    mocks.listProjects.mockResolvedValue({ content: [], page: 1 });

    const response = await listProjects(
      new Request(
        "http://localhost/api/projects?page=1&size=50&status=pending&search=Centro",
      ),
    );

    expect(mocks.listProjects).toHaveBeenCalledWith(
      { page: 1, size: 50, status: "pending", search: "Centro" },
      { refresh: true },
    );
    await expect(response.json()).resolves.toEqual({ content: [], page: 1 });
  });

  it("rejects invalid list filters before calling Spring", async () => {
    const response = await listProjects(
      new Request("http://localhost/api/projects?page=-1&size=999"),
    );

    expect(response.status).toBe(400);
    expect(mocks.listProjects).not.toHaveBeenCalled();
  });

  it("does not mask a missing project as editable general data", async () => {
    mocks.getProjectById.mockResolvedValue(undefined);

    const response = await getGeneralData(new Request("http://localhost"), {
      params: Promise.resolve({ projectId: "project-1" }),
    });

    expect(response.status).toBe(404);
    expect(mocks.toGeneralDataFormValues).not.toHaveBeenCalled();
  });

  it("validates general data before forwarding an update", async () => {
    const response = await updateGeneralData(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ name: "" }),
      }),
      { params: Promise.resolve({ projectId: "project-1" }) },
    );

    expect(response.status).toBe(400);
    expect(mocks.updateProject).not.toHaveBeenCalled();
  });

  it("validates and forwards official hydraulic parameters", async () => {
    mocks.getProjectParameters.mockResolvedValue(parameters);
    mocks.updateProjectParameters.mockResolvedValue(parameters);

    const getResponse = await getHydraulics(new Request("http://localhost"), {
      params: Promise.resolve({ projectId: "project-1" }),
    });
    expect(mocks.getProjectParameters).toHaveBeenCalledWith("project-1");
    await expect(getResponse.json()).resolves.toEqual(parameters);

    const updateResponse = await updateHydraulics(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify(parameters),
      }),
      { params: Promise.resolve({ projectId: "project-1" }) },
    );
    expect(mocks.updateProjectParameters).toHaveBeenCalledWith(
      "project-1",
      parameters,
    );
    await expect(updateResponse.json()).resolves.toEqual(parameters);
  });
});
