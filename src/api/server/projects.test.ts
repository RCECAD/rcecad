import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./spring-client", async (original) => ({
  ...(await original<typeof import("./spring-client")>()),
  springRequestWithRefresh: mocks.request,
}));
vi.mock("./dev-preview", () => ({ isDevPreview: false }));

import { getProjectParameters } from "./projects";
import { SpringApiError } from "./spring-client";

describe("new project hydraulics", () => {
  beforeEach(() => {
    mocks.request.mockReset();
  });

  it("returns an empty configuration only after confirming the project exists", async () => {
    mocks.request
      .mockRejectedValueOnce(new SpringApiError(404, "Parameters not set"))
      .mockResolvedValueOnce({
        project: { id: "project-1" },
        segments: [],
        nodes: [],
      });
    await expect(getProjectParameters("project-1")).resolves.toBeNull();
    expect(mocks.request.mock.calls[1][0]).toBe("/projects/project-1");
  });

  it("preserves a missing or inaccessible project as a 404", async () => {
    mocks.request.mockRejectedValue(new SpringApiError(404, "Not found"));
    await expect(getProjectParameters("project-1")).rejects.toMatchObject({
      status: 404,
    });
  });
});
