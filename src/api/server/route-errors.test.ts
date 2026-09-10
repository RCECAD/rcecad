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
});
