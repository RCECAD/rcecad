// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./spring-client", async (original) => ({
  ...(await original<typeof import("./spring-client")>()),
  springRequestWithRefresh: mocks.request,
}));
vi.mock("./dev-preview", () => ({ isDevPreview: false }));

import { getProjectParameters, importDxf, updateProject } from "./projects";
import { SpringApiError } from "./spring-client";

describe("new project hydraulics", () => {
  beforeEach(() => {
    mocks.request.mockReset();
  });

  it("reads unconfigured parameters from Spring instead of guessing a missing configuration", async () => {
    const details = { configured: false, defaults: {} };
    mocks.request.mockResolvedValueOnce(details);
    await expect(getProjectParameters("project-1")).resolves.toBe(details);
    expect(mocks.request).toHaveBeenCalledTimes(1);
    expect(mocks.request.mock.calls[0][0]).toBe(
      "/projects/project-1/parameters",
    );
  });

  it("preserves a missing or inaccessible project as a 404", async () => {
    mocks.request.mockRejectedValue(new SpringApiError(404, "Not found"));
    await expect(getProjectParameters("project-1")).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("DXF import transport", () => {
  it("sends the file and metadata as multipart with an upload timeout", async () => {
    mocks.request.mockResolvedValue({
      project: { id: "project-1" },
      segments: [],
      nodes: [],
    });
    const file = new File(["  0\nEOF\n"], "rede.dxf");
    const form = new FormData();
    form.set("file", file);
    form.set("name", "Rede");
    const original = new Request("http://localhost", {
      method: "POST",
      body: form,
    });
    const contentType = original.headers.get("content-type") ?? "";
    const body = await original.blob();
    await importDxf(body, contentType);
    const [path, init, options] = mocks.request.mock.lastCall ?? [];
    expect(path).toBe("/projects/import-dxf");
    expect(init.body).toBe(body);
    const encoded = new Request("http://localhost", init);
    expect(encoded.headers.get("content-type")).toBe(contentType);
    const data = await encoded.formData();
    expect(await (data.get("file") as File).text()).toBe("  0\nEOF\n");
    expect(data.get("name")).toBe("Rede");
    expect(options.timeoutMs).toBe(300_000);
  });
});

describe("project optional fields", () => {
  it("sends blank values when the user clears fields, since null preserves existing data in Spring", async () => {
    mocks.request.mockResolvedValue({ id: "project-1" });
    await updateProject("project-1", {
      name: "Rede",
      contractor: "",
      technicalManager: "",
      location: "",
      status: "pending",
    });
    const [, init] = mocks.request.mock.lastCall ?? [];
    expect(JSON.parse(init.body)).toMatchObject({
      contractor: "",
      technicalManager: "",
      location: "",
    });
  });
});
