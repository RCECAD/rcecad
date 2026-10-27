// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/api/server/session", () => ({
  getAuthSession: vi.fn().mockResolvedValue({
    accessToken: "access-token",
    refreshToken: "refresh-token",
  }),
  setAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
  hasAuthSession: vi.fn().mockResolvedValue(true),
}));

import { GET as exportDxf } from "./[projectId]/export-dxf/route";
import { POST as exportDocument } from "./[projectId]/exports/[document]/route";
import { GET as nonconformities } from "./[projectId]/nonconformities/route";
import { DELETE as deleteProject } from "./[projectId]/route";
import { POST as createContribution } from "./[projectId]/singular-contributions/route";
import { DELETE as deleteWaiver } from "./[projectId]/waivers/[waiverId]/route";
import { POST as createWaiver } from "./[projectId]/waivers/route";

const projectId = "9e8c6966-c49a-4f2f-9d9a-0953d2f6d0dc";
const segmentId = "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0b01";
const fetchMock = vi.fn();
const params = <T extends object>(extra: T) => ({
  params: Promise.resolve({ projectId, ...extra }),
});
const springCall = (index = 0) => {
  const [url, init] = fetchMock.mock.calls[index];
  return { url: String(url), init: init as RequestInit };
};
const jsonRequest = (body: unknown) =>
  new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
  });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.SPRING_API_BASE_URL = "https://spring.example";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.SPRING_API_BASE_URL;
});

describe("export routes", () => {
  it("streams the Spring PDF unchanged and asks Spring for any media type", async () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    fetchMock.mockResolvedValueOnce(
      new Response(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            'attachment; filename="rede-revR1-memorial-de-calculo.pdf"',
        },
      }),
    );
    const response = await exportDocument(
      new Request("http://localhost", { method: "POST" }),
      params({ document: "memorial" }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain(
      "rede-revR1-memorial-de-calculo.pdf",
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(pdf);
    const { url, init } = springCall();
    expect(url).toBe(
      `https://spring.example/api/projects/${projectId}/exports/memorial`,
    );
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Accept")).toBe("*/*");
  });

  it("forwards the validation items of a blocked export", async () => {
    const items = [
      {
        severity: "CRITICAL",
        category: "REQUIRED_DATA",
        step: "HYDRAULICS",
        title: "Missing pipe material",
        message: "Informe o material",
        suggestedAction: "Abra Hidráulica",
        target: { type: "PROJECT", id: null, code: null },
      },
    ];
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { code: "EXPORT_BLOCKED", status: 422, details: "Blocked", items },
        { status: 422 },
      ),
    );
    const response = await exportDocument(
      new Request("http://localhost", { method: "POST" }),
      params({ document: "spreadsheet" }),
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      code: "EXPORT_BLOCKED",
      items,
    });
  });

  it("refuses unknown documents without calling Spring", async () => {
    const response = await exportDocument(
      new Request("http://localhost", { method: "POST" }),
      params({ document: "../../users" }),
    );
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("names the original DXF after the project when Spring sends no file name", async () => {
    fetchMock.mockResolvedValueOnce(new Response("0\nEOF\n"));
    const response = await exportDxf(
      new Request("http://localhost"),
      params({}),
    );
    expect(response.headers.get("Content-Disposition")).toContain(
      `${projectId}.dxf`,
    );
    expect(springCall().url).toContain(`/projects/${projectId}/export-dxf`);
  });
});

describe("singular contribution routes", () => {
  it("rejects a contribution with two targets before calling Spring", async () => {
    const response = await createContribution(
      jsonRequest({
        name: "Indústria",
        type: "INDUSTRIAL",
        nodeId: segmentId,
        segmentId,
        initialLps: 1,
        finalLps: 2,
      }),
      params({}),
    );
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates a segment contribution and keeps the 201 status", async () => {
    const body = {
      name: "Indústria",
      type: "INDUSTRIAL",
      nodeId: null,
      segmentId,
      initialLps: 1,
      finalLps: 2,
    };
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { ...body, id: projectId, targetCode: "T-01" },
        { status: 201 },
      ),
    );
    const response = await createContribution(jsonRequest(body), params({}));
    expect(response.status).toBe(201);
    expect(JSON.parse(String(springCall().init.body))).toEqual(body);
  });
});

describe("waiver routes", () => {
  it("sends a parameter waiver without rule fields", async () => {
    const body = {
      type: "PARAMETER",
      segmentId,
      parameter: "DIAMETER",
      value: 200,
      justification: "Aprovado pela concessionária",
      sourceId: "NBR 9649:1986",
    };
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          ...body,
          id: projectId,
          projectId,
          segmentCode: "T-01",
          sourceId: null,
          ruleCode: null,
          downgradeTo: null,
          approvedBy: projectId,
          approvedAt: "2026-10-27T12:00:00Z",
        },
        { status: 201 },
      ),
    );
    const response = await createWaiver(jsonRequest(body), params({}));
    expect(response.status).toBe(201);
    expect(JSON.parse(String(springCall().init.body))).not.toHaveProperty(
      "sourceId",
    );
  });

  it("answers 204 when Spring deletes the waiver", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await deleteWaiver(
      new Request("http://localhost", { method: "DELETE" }),
      params({ waiverId: segmentId }),
    );
    expect(response.status).toBe(204);
    expect(springCall().init.method).toBe("DELETE");
  });
});

describe("project and nonconformity routes", () => {
  it("deletes a project through Spring", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await deleteProject(
      new Request("http://localhost", { method: "DELETE" }),
      params({}),
    );
    expect(response.status).toBe(204);
    expect(springCall().url).toBe(
      `https://spring.example/api/projects/${projectId}`,
    );
  });

  it("validates the nonconformity status filter before calling Spring", async () => {
    const invalid = await nonconformities(
      new Request("http://localhost/x?status=DELETED"),
      params({}),
    );
    expect(invalid.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(Response.json([]));
    await nonconformities(
      new Request("http://localhost/x?status=OPEN"),
      params({}),
    );
    expect(springCall().url).toContain("/nonconformities?status=OPEN");
  });
});
