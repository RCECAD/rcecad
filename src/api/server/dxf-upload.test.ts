// @vitest-environment node

import { stat } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  directories: [] as string[],
}));
vi.mock("server-only", () => ({}));
vi.mock("./spring-client", async (original) => ({
  ...(await original<typeof import("./spring-client")>()),
  springRequestWithRefresh: mocks.authenticate,
}));
vi.mock("@/api/contracts/spring", async (original) => ({
  ...(await original<typeof import("@/api/contracts/spring")>()),
  MAX_DXF_BYTES: 1024,
}));
vi.mock("node:fs/promises", async (original) => {
  const actual = await original<typeof import("node:fs/promises")>();
  return {
    ...actual,
    mkdtemp: async (prefix: string) => {
      const directory = await actual.mkdtemp(prefix);
      mocks.directories.push(directory);
      return directory;
    },
  };
});

import { withDxfUpload } from "./dxf-upload";
import { SpringApiError } from "./spring-client";

function multipartRequest() {
  const form = new FormData();
  form.set("file", new File(["  0\nEOF\n"], "rede.dxf"));
  form.set("name", "Rede");
  form.set("contractor", "Prefeitura");
  form.set("technicalManager", "Ana");
  form.set("revision", "R1");
  form.set("basin", "Centro");
  return new Request("http://localhost/api/projects/import-dxf", {
    method: "POST",
    body: form,
  });
}

async function expectCleaned() {
  expect(mocks.directories.length).toBeGreaterThan(0);
  for (const directory of mocks.directories) {
    await expect(stat(directory)).rejects.toMatchObject({ code: "ENOENT" });
  }
}

describe("bounded DXF uploads", () => {
  beforeEach(() => {
    mocks.authenticate.mockReset().mockResolvedValue({});
    mocks.directories.length = 0;
  });

  it("authenticates first, spools to disk, preserves multipart bytes and removes the temporary file", async () => {
    const request = multipartRequest();
    const expected = await request.clone().arrayBuffer();
    vi.spyOn(request, "formData").mockRejectedValue(
      new Error("Must not buffer multipart"),
    );
    mocks.authenticate.mockImplementation(async () => {
      expect(request.bodyUsed).toBe(false);
    });
    const result = await withDxfUpload(request, async (body, type) => {
      expect(mocks.authenticate).toHaveBeenCalledWith(
        "/projects?page=0&size=1",
        {},
        expect.any(Object),
      );
      expect(await body.arrayBuffer()).toEqual(expected);
      const form = await new Request("http://localhost", {
        method: "POST",
        body,
        headers: { "content-type": type },
      }).formData();
      expect(Object.fromEntries(form)).toMatchObject({
        name: "Rede",
        contractor: "Prefeitura",
        technicalManager: "Ana",
        revision: "R1",
        basin: "Centro",
      });
      expect(await (form.get("file") as File).text()).toBe("  0\nEOF\n");
      return { id: "project-1" };
    });
    expect(result).toEqual({ id: "project-1" });
    expect(request.formData).not.toHaveBeenCalled();
    await expectCleaned();
  });

  it("does not read or store a request rejected by authentication", async () => {
    const request = multipartRequest();
    mocks.authenticate.mockRejectedValue(
      new SpringApiError(401, "Unauthorized"),
    );
    const upload = vi.fn();
    await expect(withDxfUpload(request, upload)).rejects.toMatchObject({
      status: 401,
    });
    expect(request.bodyUsed).toBe(false);
    expect(mocks.directories).toHaveLength(0);
    expect(upload).not.toHaveBeenCalled();
  });

  it("preserves BOM, CRLF and non-UTF-8 bytes in the original DXF file", async () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x30, 0x0d, 0x0a, 0xe7]);
    const form = new FormData();
    form.set("file", new File([bytes], "Rede.DXF"));
    await withDxfUpload(
      new Request("http://localhost/api/projects/dxf-preview", {
        method: "POST",
        body: form,
      }),
      async (body, contentType) => {
        const forwarded = await new Request("http://localhost", {
          method: "POST",
          body,
          headers: { "content-type": contentType },
        }).formData();
        expect(
          new Uint8Array(await (forwarded.get("file") as File).arrayBuffer()),
        ).toEqual(bytes);
        expect(forwarded.has("name")).toBe(false);
      },
    );
    await expectCleaned();
  });

  it("rejects legacy JSON and missing multipart boundaries before reading", async () => {
    for (const type of ["application/json", "multipart/form-data"]) {
      const request = new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": type },
        body: "{}",
      });
      await expect(withDxfUpload(request, vi.fn())).rejects.toMatchObject({
        status: 400,
      });
    }
    expect(mocks.authenticate).not.toHaveBeenCalled();
    expect(mocks.directories).toHaveLength(0);
  });

  it("rejects an oversized declared body without reading or storing it", async () => {
    const request = multipartRequest();
    request.headers.set("content-length", String(1024 + 64 * 1024 + 1));
    await expect(withDxfUpload(request, vi.fn())).rejects.toMatchObject({
      status: 413,
      payload: { code: "PAYLOAD_TOO_LARGE" },
    });
    expect(request.bodyUsed).toBe(false);
    expect(mocks.directories).toHaveLength(0);
  });

  it("bounds bodies without content-length and cleans up on overflow", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: new Uint8Array(1024 + 64 * 1024 + 1),
      headers: { "content-type": "multipart/form-data; boundary=test" },
    });
    expect(request.headers.has("content-length")).toBe(false);
    const upload = vi.fn();
    await expect(withDxfUpload(request, upload)).rejects.toMatchObject({
      status: 413,
    });
    expect(upload).not.toHaveBeenCalled();
    await expectCleaned();
  });

  it("removes temporary files after backend rejection and allows another upload", async () => {
    await expect(
      withDxfUpload(multipartRequest(), async () => {
        throw new SpringApiError(422, "Invalid topology");
      }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      withDxfUpload(multipartRequest(), async () => "ok"),
    ).resolves.toBe("ok");
    await expectCleaned();
  });

  it("admits only two uploads at once and releases their slots after completion", async () => {
    let release: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const upload = vi.fn(async () => {
      await pending;
      return "ok";
    });
    const first = withDxfUpload(multipartRequest(), upload);
    const second = withDxfUpload(multipartRequest(), upload);
    try {
      await vi.waitFor(() => expect(upload).toHaveBeenCalledTimes(2));
      await expect(
        withDxfUpload(multipartRequest(), upload),
      ).rejects.toMatchObject({
        status: 503,
        payload: { code: "UPLOADS_BUSY" },
      });
    } finally {
      release();
      await Promise.all([first, second]);
    }
    await expect(
      withDxfUpload(multipartRequest(), async () => "ok"),
    ).resolves.toBe("ok");
    await expectCleaned();
  });
});
