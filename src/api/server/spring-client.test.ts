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
  refreshSpringSession,
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

  it("lets fetch encode multipart boundaries and retains the upload during token refresh", async () => {
    const upload = new FormData();
    upload.set("file", new File(["0\r\nEOF\r\n"], "rede.dxf"));
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(tokens))
      .mockResolvedValueOnce(Response.json({ id: "project-1" }));
    await springRequestWithRefresh(
      "/projects/import-dxf",
      { method: "POST", body: upload },
      { schema: z.object({ id: z.string() }) },
    );
    for (const index of [0, 2]) {
      expect(fetchMock.mock.calls[index][1].body).toBe(upload);
      expect(
        new Headers(fetchMock.mock.calls[index][1].headers).has("Content-Type"),
      ).toBe(false);
    }
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
    expect(mocks.setAuthSession).toHaveBeenCalledTimes(2);
  });

  it("keeps the session when refresh fails because Spring is unavailable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(refreshSpringSession()).rejects.toMatchObject({ status: 503 });
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
  });

  it("clears a rejected refresh token", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(refreshSpringSession()).resolves.toBeNull();
    expect(mocks.clearAuthSession).toHaveBeenCalledOnce();
  });

  it("stops after a second 401 and clears the rejected session", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(Response.json(tokens))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(
      springRequestWithRefresh(
        "/projects",
        {},
        { schema: z.object({ id: z.string() }) },
      ),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(mocks.clearAuthSession).toHaveBeenCalledOnce();
  });

  it("preserves cookies when the refresh endpoint returns 503", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(refreshSpringSession()).rejects.toMatchObject({ status: 503 });
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
  });

  it("reports interrupted response bodies as a connection failure", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new TypeError("connection reset"));
          },
        }),
      ),
    );
    await expect(
      springRequestWithRefresh(
        "/projects",
        {},
        { schema: z.object({ id: z.string() }) },
      ),
    ).rejects.toMatchObject({ status: 503 });
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
  });

  it("shares rotation when concurrent requests receive their 401 at different times", async () => {
    let releaseSecond: (response: Response) => void = () => {};
    let refreshes = 0;
    const secondResponse = new Promise<Response>((resolve) => {
      releaseSecond = resolve;
    });
    fetchMock.mockImplementation(async (url: URL, init: RequestInit) => {
      if (url.pathname === "/api/auth/refresh") {
        refreshes++;
        return refreshes === 1
          ? Response.json(tokens)
          : new Response(null, { status: 401 });
      }
      if (
        new Headers(init.headers).get("Authorization") ===
        "Bearer new-access-token"
      )
        return Response.json({ ok: true });
      if (url.pathname.endsWith("slow")) return secondResponse;
      return new Response(null, { status: 401 });
    });
    const schema = z.object({ ok: z.boolean() });
    const first = springRequestWithRefresh("/projects/fast", {}, { schema });
    const second = springRequestWithRefresh("/projects/slow", {}, { schema });
    await first;
    releaseSecond(new Response(null, { status: 401 }));
    await expect(second).resolves.toEqual({ ok: true });
    expect(refreshes).toBe(1);
    expect(mocks.clearAuthSession).not.toHaveBeenCalled();
  });

  it.each([
    "https://spring.example/rcecad",
    "https://spring.example/rcecad/api/",
  ])("preserves the deployment prefix in %s", async (base) => {
    process.env.SPRING_API_BASE_URL = base;
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true }));
    await springRequest(
      "/projects",
      {},
      { schema: z.object({ ok: z.boolean() }) },
    );
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://spring.example/rcecad/api/projects",
    );
  });
});
