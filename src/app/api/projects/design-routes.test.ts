// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  getProjectNetwork: vi.fn(),
  getProjectDesign: vi.fn(),
  validateProject: vi.fn(),
  getProjectOverview: vi.fn(),
  updateNodeFieldData: vi.fn(),
  updateSegmentFieldData: vi.fn(),
  previewDxf: vi.fn(),
}));
vi.mock("@/api/server/design", () => mocks);
vi.mock("@/api/server/dxf-upload", () => ({
  withDxfUpload: async (
    request: Request,
    upload: (body: Blob, type: string) => Promise<unknown>,
  ) => upload(await request.blob(), request.headers.get("content-type") ?? ""),
}));

import { SpringApiError } from "@/api/server/spring-client";
import { GET as design } from "./[projectId]/design/route";
import { PUT as updateSegment } from "./[projectId]/segments/[segmentId]/field-data/route";
import { POST as preview } from "./dxf-preview/route";

const context = {
  params: Promise.resolve({ projectId: "project-1", segmentId: "segment-1" }),
};
describe("design route boundaries", () => {
  it("previews the multipart upload without creating a project or changing the file", async () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x30, 0x0d, 0x0a, 0xe7]);
    const form = new FormData();
    form.set("file", new File([bytes], "rede.dxf"));
    const result = { segmentCount: 1, nodeCount: 2, warnings: [] };
    mocks.previewDxf.mockResolvedValueOnce(result);
    const response = await preview(
      new Request("http://localhost/api/projects/dxf-preview", {
        method: "POST",
        body: form,
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(result);
    const [body, contentType] = mocks.previewDxf.mock.calls[0];
    const forwarded = await new Request("http://localhost", {
      method: "POST",
      body,
      headers: { "content-type": contentType },
    }).formData();
    expect(
      new Uint8Array(await (forwarded.get("file") as File).arrayBuffer()),
    ).toEqual(bytes);
  });
  it("keeps authentication and incomplete-survey HTTP status/code without exposing upstream internals", async () => {
    for (const [status, code] of [
      [401, "UNAUTHORIZED"],
      [422, "INCOMPLETE_SURVEY_DATA"],
    ] as const) {
      mocks.getProjectDesign.mockRejectedValueOnce(
        new SpringApiError(status, "raw", {
          code,
          details: "Missing survey",
          developerMessage: "secret.internal",
        }),
      );
      const response = await design(new Request("http://localhost"), context);
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ error: "Missing survey", code });
    }
  });
  it("rejects partial replacements so editing one tab cannot erase other fields", async () => {
    const response = await updateSegment(
      new Request("http://localhost", {
        method: "PUT",
        body: JSON.stringify({ pavementType: "SIDEWALK" }),
      }),
      context,
    );
    expect(response.status).toBe(400);
    expect(mocks.updateSegmentFieldData).not.toHaveBeenCalled();
  });
});
