import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mocks = vi.hoisted(() => ({
  clearAuthSession: vi.fn(),
  getAuthSession: vi.fn(),
  setAuthSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/api/server/session", () => mocks);

import {
  SpringContractError,
  springRequest,
  springRequestWithRefresh,
} from "./spring-client";

const tokens = {
  accessToken: "new-access-token",
  tokenType: "Bearer",
  expiresIn: 900,
  refreshToken: "new-refresh-token",
  refreshExpiresIn: 604800,
};

describe("Spring client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    mocks.clearAuthSession.mockReset();
    mocks.getAuthSession.mockReset();
    mocks.setAuthSession.mockReset();
    mocks.getAuthSession.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    vi.stubGlobal("fetch", fetchMock);
    process.env.SPRING_API_BASE_URL = "https://spring.example";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.SPRING_API_BASE_URL;
  });

  it("adds the /api prefix, keeps auth server-side, and validates success bodies", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "project-1" }), { status: 200 }),
    );

    await expect(
      springRequest(
        "/projects/project-1",
        {},
        {
          schema: z.object({ id: z.string() }),
        },
      ),
    ).resolves.toEqual({ id: "project-1" });

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      "https://spring.example/api/projects/project-1",
    );
    expect(new Headers(init.headers).get("authorization")).toBe(
      "Bearer access-token",
    );
    expect(init.cache).toBe("no-store");
  });

  it("fails closed when a successful response no longer matches its schema", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 42 }), { status: 200 }),
    );

    await expect(
      springRequest(
        "/projects/project-1",
        {},
        {
          schema: z.object({ id: z.string() }),
        },
      ),
    ).rejects.toBeInstanceOf(SpringContractError);
  });

  it("refreshes once and retries the original request with the rotated access token", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ title: "Unauthorized" }), {
          status: 401,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tokens), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "project-1" }), { status: 200 }),
      );

    await expect(
      springRequestWithRefresh(
        "/projects/project-1",
        {},
        {
          schema: z.object({ id: z.string() }),
        },
      ),
    ).resolves.toEqual({ id: "project-1" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(new URL(fetchMock.mock.calls[1][0]).pathname).toBe(
      "/api/auth/refresh",
    );
    expect(
      new Headers(fetchMock.mock.calls[1][1].headers).has("authorization"),
    ).toBe(false);
    expect(
      new Headers(fetchMock.mock.calls[2][1].headers).get("authorization"),
    ).toBe("Bearer new-access-token");
    expect(mocks.setAuthSession).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: "new-refresh-token" }),
    );
  });

  it("shares one refresh when protected requests fail at the same time", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tokens), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "project-1" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "project-2" }), { status: 200 }),
      );

    const schema = z.object({ id: z.string() });
    const [first, second] = await Promise.all([
      springRequestWithRefresh("/projects/project-1", {}, { schema }),
      springRequestWithRefresh("/projects/project-2", {}, { schema }),
    ]);

    expect(first).toEqual({ id: "project-1" });
    expect(second).toEqual({ id: "project-2" });
    expect(
      fetchMock.mock.calls.filter(
        ([url]) => new URL(url).pathname === "/api/auth/refresh",
      ),
    ).toHaveLength(1);
  });
});
