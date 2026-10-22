// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  createProject: vi.fn(),
  importDxf: vi.fn(),
  getProjectById: vi.fn(),
  getProjectParameters: vi.fn(),
  listProjects: vi.fn(),
  toGeneralDataFormValues: vi.fn(),
  updateProject: vi.fn(),
  updateProjectParameters: vi.fn(),
}));

vi.mock("@/api/server/projects", () => ({
  createProject: mocks.createProject,
  importDxf: mocks.importDxf,
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
vi.mock("@/api/server/dxf-upload", () => ({
  withDxfUpload: async (
    request: Request,
    upload: (body: Blob, type: string) => Promise<unknown>,
  ) => upload(await request.blob(), request.headers.get("content-type") ?? ""),
}));

import {
  GET as getGeneralData,
  PUT as updateGeneralData,
} from "./[projectId]/general-data/route";
import {
  GET as getHydraulics,
  PUT as updateHydraulics,
} from "./[projectId]/hydraulics/route";
import { POST as importDxf } from "./import-dxf/route";
import { POST as createProject, GET as listProjects } from "./route";

const parameters = {
  initialPopulation: 312,
  finalPopulation: 468,
  returnCoefficient: 0.8,
  perCapitaFlow: 220,
  infiltrationRate: 0.0001,
  peakDailyFactor: 1.25,
  peakHourlyFactor: 1.6,
  manningCoefficient: 0.01,
  defaultNetworkMaterial: "PVC JEI",
};

describe("protected project route handlers", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => {
      mock.mockReset();
    });
  });

  it("creates a project with only the editable fields", async () => {
    const values = {
      name: "Nova rede",
      contractor: null,
      technicalManager: null,
      location: null,
    };
    mocks.createProject.mockResolvedValue({ id: "project-1", ...values });
    const response = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ ...values, ownerId: "someone-else" }),
      }),
    );
    expect(response.status).toBe(201);
    expect(mocks.createProject).toHaveBeenCalledWith(values);
  });

  it("rejects malformed JSON before creating a project", async () => {
    const response = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: "{",
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.createProject).not.toHaveBeenCalled();
  });

  it("forwards the multipart file with the original boundary and metadata", async () => {
    const dxf = "  0\nSECTION\n  0\nEOF\n";
    const values = new FormData();
    values.set("name", "Rede importada");
    values.set("file", new File([dxf], "rede.dxf"));
    values.set("contractor", "Prefeitura");
    values.set("technicalManager", "Ana");
    values.set("revision", "R1");
    values.set("basin", "Centro");
    mocks.importDxf.mockResolvedValue({ id: "project-1" });
    const response = await importDxf(
      new Request("http://localhost/api/projects/import-dxf", {
        method: "POST",
        body: values,
      }),
    );
    expect(response.status).toBe(201);
    const [body, type] = mocks.importDxf.mock.calls[0];
    const input = await new Request("http://localhost", {
      method: "POST",
      body,
      headers: { "content-type": type },
    }).formData();
    expect(Object.fromEntries(input)).toMatchObject({
      name: "Rede importada",
      contractor: "Prefeitura",
      technicalManager: "Ana",
      revision: "R1",
      basin: "Centro",
    });
    expect((input.get("file") as File).name).toBe("rede.dxf");
    expect(await (input.get("file") as File).text()).toBe(dxf);
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

  it.each([
    ["general data", updateGeneralData],
    ["hydraulics", updateHydraulics],
  ])("returns 400 for malformed JSON in %s updates", async (_name, handler) => {
    const response = await handler(
      new Request("http://localhost", { method: "PUT", body: "{" }),
      {
        params: Promise.resolve({ projectId: "project-1" }),
      },
    );
    expect(response.status).toBe(400);
    expect(mocks.updateProject).not.toHaveBeenCalled();
    expect(mocks.updateProjectParameters).not.toHaveBeenCalled();
  });
});
