import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { routeErrorResponse } from "./route-errors";
import { SpringApiError } from "./spring-client";

describe("route error translation", () => {
  it("returns safe field feedback without exposing the developer message", async () => {
    const response = routeErrorResponse(
      new SpringApiError(422, "raw upstream error", {
        title: "Validation error",
        details: "Revise os campos informados.",
        developerMessage: "entity.id=42",
        fields: "name",
        fieldsMessage: "must not be blank",
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Revise os campos informados.",
      code: "SPRING_422",
      fieldErrors: {
        fields: "name",
        message: "must not be blank",
      },
    });
  });

  it.each([
    [
      503,
      "UPLOADS_BUSY",
      "Há outros uploads em processamento. Aguarde alguns instantes e tente novamente.",
    ],
    [413, "PAYLOAD_TOO_LARGE", "O arquivo DXF deve ter até 300 MB."],
    [422, "INVALID_NETWORK_TOPOLOGY", "Cycle detected at node PV-03"],
  ])("preserves upload status %s and code %s with safe feedback", async (status, code, error) => {
    const response = routeErrorResponse(
      new SpringApiError(status, "Spring API request failed", {
        code,
        details: "Cycle detected at node PV-03",
        developerMessage: "private-internal-diagnostic",
      }),
    );
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ code, error });
  });
});
