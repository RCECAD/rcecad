import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasAuthSession: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("./session", () => mocks);
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { SpringApiError } from "./spring-client";
import { springPageRequest } from "./spring-page-client";

describe("Spring reads during page rendering", () => {
  beforeEach(() => {
    mocks.redirect.mockImplementation(() => {
      throw new Error("redirect");
    });
    mocks.hasAuthSession.mockResolvedValue(true);
  });
  it("redirects expired access to the POST refresh flow without rotating cookies during render", async () => {
    const load = vi.fn().mockRejectedValue(new SpringApiError(401, "expired"));
    await expect(springPageRequest(load, "/project/example")).rejects.toThrow(
      "redirect",
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/auth/refresh?next=%2Fproject%2Fexample",
    );
    expect(load).toHaveBeenCalledOnce();
  });
  it("redirects visitors without a session to login", async () => {
    mocks.hasAuthSession.mockResolvedValue(false);
    await expect(
      springPageRequest(async () => {
        throw new SpringApiError(401, "missing");
      }, "/home"),
    ).rejects.toThrow("redirect");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login");
  });
  it("preserves backend failures instead of treating them as expired sessions", async () => {
    await expect(
      springPageRequest(async () => {
        throw new SpringApiError(503, "offline");
      }, "/home"),
    ).rejects.toMatchObject({ status: 503 });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
