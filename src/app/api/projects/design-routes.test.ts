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
}));
vi.mock("@/api/server/design", () => mocks);

import { SpringApiError } from "@/api/server/spring-client";
import { GET as design } from "./[projectId]/design/route";
import { PUT as updateSegment } from "./[projectId]/segments/[segmentId]/field-data/route";

const context = {
  params: Promise.resolve({ projectId: "project-1", segmentId: "segment-1" }),
};
describe("design route boundaries", () => {
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
