import { afterEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => store }));

import {
  ACCESS_TOKEN_COOKIE,
  clearAuthSession,
  REFRESH_TOKEN_COOKIE,
  setAuthSession,
} from "./session";

describe("session cookies", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  it.each([
    "production",
    "development",
  ])("sets appropriate flags and lifetimes in %s", async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    await setAuthSession({
      accessToken: "access",
      refreshToken: "refresh",
      expiresIn: 900,
      refreshExpiresIn: 604800,
    });
    expect(store.set).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, "access", {
      httpOnly: true,
      secure: environment === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });
    expect(store.set).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      "refresh",
      expect.objectContaining({ maxAge: 604800, httpOnly: true }),
    );
  });
  it("removes both cookies when the session ends", async () => {
    await clearAuthSession();
    expect(store.delete.mock.calls).toEqual([
      [ACCESS_TOKEN_COOKIE],
      [REFRESH_TOKEN_COOKIE],
    ]);
  });
});
