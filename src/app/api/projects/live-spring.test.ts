// @vitest-environment node
/**
 * Opt-in contract check of every Next route against a running Spring:
 * RCECAD_LIVE_SPRING_URL=http://localhost:8081 RCECAD_LIVE_DXF=<file.dxf> bunx vitest run live-spring
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";

const springUrl = process.env.RCECAD_LIVE_SPRING_URL;
const dxfPath = process.env.RCECAD_LIVE_DXF;
const session = vi.hoisted(() => ({ accessToken: "", refreshToken: "" }));

vi.mock("server-only", () => ({}));
vi.mock("@/api/server/session", () => ({
  getAuthSession: async () => session,
  setAuthSession: async (tokens: typeof session) =>
    Object.assign(session, tokens),
  clearAuthSession: async () => undefined,
  hasAuthSession: async () => true,
}));

type Handler = (
  request: Request,
  context: { params: Promise<never> },
) => Promise<Response>;

async function call(
  handler: Handler,
  params: Record<string, string>,
  init: RequestInit & { query?: string } = {},
) {
  const response = await handler(
    new Request(`http://localhost/api${init.query ?? ""}`, {
      ...init,
      headers:
        init.body && typeof init.body === "string"
          ? { "Content-Type": "application/json" }
          : init.headers,
    }),
    { params: Promise.resolve(params) as Promise<never> },
  );
  const type = response.headers.get("Content-Type") ?? "";
  const body = type.includes("json") ? await response.json() : null;
  // A 502 here means the front contract no longer matches Spring.
  if (response.status >= 500) throw new Error(JSON.stringify(body));
  return { status: response.status, body, type };
}
const json = (method: string, body: unknown) => ({
  method,
  body: JSON.stringify(body),
});

describe.skipIf(!springUrl || !dxfPath)("live Spring contract", () => {
  let projectId = "";
  const p = () => ({ projectId });

  beforeAll(async () => {
    process.env.SPRING_API_BASE_URL = springUrl;
    const login = await fetch(`${springUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@rcecad.com", password: "admin123" }),
    });
    Object.assign(session, await login.json());
  });

  it("keeps every existing and new route compatible with Spring", async () => {
    const routes = {
      importDxf: (await import("./import-dxf/route")).POST,
      preview: (await import("./dxf-preview/route")).POST,
      list: (await import("./route")).GET,
      project: await import("./[projectId]/route"),
      network: (await import("./[projectId]/network/route")).GET,
      general: await import("./[projectId]/general-data/route"),
      hydraulics: await import("./[projectId]/hydraulics/route"),
      nodeField: (await import("./[projectId]/nodes/[nodeId]/field-data/route"))
        .PUT,
      segmentField: (
        await import("./[projectId]/segments/[segmentId]/field-data/route")
      ).PUT,
      design: (await import("./[projectId]/design/route")).GET,
      validation: (await import("./[projectId]/validation/route")).GET,
      overview: (await import("./[projectId]/overview/route")).GET,
      profile: (await import("../normative-profile/route")).GET,
      actions: (await import("./[projectId]/actions/route")).GET,
      summary: (await import("./[projectId]/executive-summary/route")).GET,
      memorial: (await import("./[projectId]/calculation-memorial/route")).GET,
      contributions: await import("./[projectId]/singular-contributions/route"),
      contribution: await import(
        "./[projectId]/singular-contributions/[contributionId]/route"
      ),
      nodes: (await import("./[projectId]/nodes/route")).POST,
      node: await import("./[projectId]/nodes/[nodeId]/route"),
      segments: (await import("./[projectId]/segments/route")).POST,
      segment: await import("./[projectId]/segments/[segmentId]/route"),
      ncs: (await import("./[projectId]/nonconformities/route")).GET,
      decision: (
        await import(
          "./[projectId]/nonconformities/[nonconformityId]/decision/route"
        )
      ).POST,
      history: (
        await import(
          "./[projectId]/nonconformities/[nonconformityId]/history/route"
        )
      ).GET,
      waivers: await import("./[projectId]/waivers/route"),
      waiver: (await import("./[projectId]/waivers/[waiverId]/route")).DELETE,
      exportDoc: (await import("./[projectId]/exports/[document]/route")).POST,
      exports: (await import("./[projectId]/exports/route")).GET,
      snapshots: (await import("./[projectId]/design-snapshots/route")).GET,
      snapshot: (
        await import("./[projectId]/design-snapshots/[snapshotId]/route")
      ).GET,
      dxf: (await import("./[projectId]/export-dxf/route")).GET,
    };
    const form = () => {
      const data = new FormData();
      data.set("name", "Verificação ao vivo");
      data.set("file", new File([readFileSync(dxfPath as string)], "rede.dxf"));
      return data;
    };
    const multipart = (data: FormData) => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: data,
      });
      return {
        method: "POST",
        body: request.body,
        headers: request.headers,
        duplex: "half",
      } as RequestInit;
    };

    expect((await call(routes.preview, {}, multipart(form()))).status).toBe(
      200,
    );
    const imported = await call(routes.importDxf, {}, multipart(form()));
    expect(imported.status).toBe(201);
    projectId = imported.body.id;

    expect(
      (await call(routes.list, {}, { query: "?page=0&size=5" })).status,
    ).toBe(200);
    expect((await call(routes.project.GET, p())).status).toBe(200);
    const network = (await call(routes.network, p())).body;
    const general = (await call(routes.general.GET, p())).body;
    const updated = await call(
      routes.general.PUT,
      p(),
      json("PUT", { ...general, totalNetworkLengthM: 500 }),
    );
    expect(updated.body.totalNetworkLengthM).toBe(500);

    const details = (await call(routes.hydraulics.GET, p())).body;
    expect(details).toHaveProperty("configured");
    const materialSwitch = {
      fromMaterial: "PVC JEI",
      toMaterial: "Concreto",
      aboveDiameterMm: 400,
    };
    await call(
      routes.hydraulics.PUT,
      p(),
      json("PUT", {
        initialPopulation: 100,
        finalPopulation: 200,
        returnCoefficient: 0.8,
        perCapitaFlow: 200,
        infiltrationRate: 0.1,
        peakDailyFactor: 1.2,
        peakHourlyFactor: 1.5,
        manningCoefficient: null,
        defaultNetworkMaterial: "PVC JEI",
        justification: null,
        materialSwitch,
      }),
    );
    expect(
      (await call(routes.hydraulics.GET, p())).body.materialSwitch,
    ).toEqual(materialSwitch);

    for (const node of network.nodes)
      expect(
        (
          await call(
            routes.nodeField,
            { ...p(), nodeId: node.id },
            json("PUT", { terrainElevation: node.invertElevation + 2 }),
          )
        ).status,
      ).toBe(200);
    for (const segment of network.segments)
      expect(
        (
          await call(
            routes.segmentField,
            { ...p(), segmentId: segment.id },
            json("PUT", {
              elementType: "COLLECTOR",
              receivesDryWeatherFlow: false,
              pavementType: "PAVED_STREET_WITH_CURB_AND_GUTTER",
              surfaceMaterial: null,
              surfaceCondition: null,
              pavementNotes: null,
              fixedDiameterMm: null,
              material: null,
            }),
          )
        ).status,
      ).toBe(200);

    const designed = await call(routes.design, p());
    expect(designed.status, JSON.stringify(designed.body)).toBe(200);
    expect((await call(routes.validation, p())).status).toBe(200);
    expect((await call(routes.overview, p())).status).toBe(200);
    expect(
      (await call(routes.profile, {})).body.standards.length,
    ).toBeGreaterThan(0);
    expect(
      (await call(routes.actions, p(), { query: "?limit=50" })).status,
    ).toBe(200);
    expect((await call(routes.summary, p())).status).toBe(200);
    expect((await call(routes.memorial, p())).status).toBe(200);

    const [first] = network.segments;
    const contribution = {
      name: "Indústria",
      type: "INDUSTRIAL",
      nodeId: null,
      segmentId: first.id,
      initialLps: 0.5,
      finalLps: 1,
    };
    const created = await call(
      routes.contributions.POST,
      p(),
      json("POST", contribution),
    );
    expect(created.status).toBe(201);
    const contributionId = { ...p(), contributionId: created.body.id };
    expect(
      (
        await call(
          routes.contribution.PUT,
          contributionId,
          json("PUT", { ...contribution, finalLps: 1.5 }),
        )
      ).body.finalLps,
    ).toBe(1.5);
    expect((await call(routes.contributions.GET, p())).body).toHaveLength(1);
    expect(
      (
        await call(routes.contribution.DELETE, contributionId, {
          method: "DELETE",
        })
      ).status,
    ).toBe(204);

    const node = await call(
      routes.nodes,
      p(),
      json("POST", {
        code: "LIVE-N",
        type: "PV",
        hasDropTube: false,
        x: 1,
        y: 1,
        invertElevation: 500,
        terrainElevation: null,
        angle: null,
      }),
    );
    expect(node.status).toBe(201);
    const nodeId = { ...p(), nodeId: node.body.id };
    expect(
      (
        await call(
          routes.node.PUT,
          nodeId,
          json("PUT", {
            code: "LIVE-N2",
            type: "TL",
            hasDropTube: true,
            x: 2,
            y: 2,
            invertElevation: 500,
            terrainElevation: 502,
            angle: null,
          }),
        )
      ).status,
    ).toBe(200);
    const downstream = new Set(
      network.segments.map(
        (s: { downstreamNodeId: string }) => s.downstreamNodeId,
      ),
    );
    const head = network.segments.find(
      (s: { upstreamNodeId: string }) => !downstream.has(s.upstreamNodeId),
    ).upstreamNodeId;
    const topology = {
      code: "LIVE-T",
      upstreamNodeId: node.body.id,
      downstreamNodeId: head,
      upstreamInvert: 500,
      downstreamInvert: 499,
    };
    const segment = await call(routes.segments, p(), json("POST", topology));
    expect(segment.status).toBe(201);
    const segmentId = { ...p(), segmentId: segment.body.id };
    expect(
      (
        await call(
          routes.segment.PUT,
          segmentId,
          json("PUT", { ...topology, code: "LIVE-T2" }),
        )
      ).status,
    ).toBe(200);
    expect(
      (await call(routes.segment.DELETE, segmentId, { method: "DELETE" }))
        .status,
    ).toBe(204);
    expect(
      (await call(routes.node.DELETE, nodeId, { method: "DELETE" })).status,
    ).toBe(204);

    await call(routes.validation, p());
    const tracked = (await call(routes.ncs, p())).body;
    expect(
      (await call(routes.ncs, p(), { query: "?status=OPEN" })).status,
    ).toBe(200);
    const acceptable = tracked.find(
      (n: { status: string; severity: string }) =>
        n.status === "OPEN" && n.severity !== "CRITICAL",
    );
    if (acceptable) {
      const id = { ...p(), nonconformityId: acceptable.id };
      expect(
        (
          await call(
            routes.decision,
            id,
            json("POST", { status: "ACCEPTED", justification: "Verificação" }),
          )
        ).body.status,
      ).toBe("ACCEPTED");
      expect((await call(routes.history, id)).body.length).toBeGreaterThan(0);
    }

    const waiver = await call(
      routes.waivers.POST,
      p(),
      json("POST", {
        type: "PARAMETER",
        segmentId: first.id,
        parameter: "DIAMETER",
        value: 150,
        justification: "Verificação",
      }),
    );
    expect(waiver.status).toBe(201);
    expect((await call(routes.waivers.GET, p())).body).toHaveLength(1);
    expect(
      (
        await call(
          routes.waiver,
          { ...p(), waiverId: waiver.body.id },
          { method: "DELETE" },
        )
      ).status,
    ).toBe(204);

    for (const document of [
      "memorial",
      "spreadsheet",
      "technical-report",
      "longitudinal-profiles",
    ]) {
      const result = await call(
        routes.exportDoc,
        { ...p(), document },
        { method: "POST" },
      );
      // A network that is not ready to conclude is a valid 422 EXPORT_BLOCKED outcome.
      expect([200, 422]).toContain(result.status);
      if (result.status === 422)
        expect(result.body.code).toBe("EXPORT_BLOCKED");
    }
    expect((await call(routes.exports, p())).status).toBe(200);
    const snapshots = (await call(routes.snapshots, p())).body;
    if (snapshots.length)
      expect(
        (await call(routes.snapshot, { ...p(), snapshotId: snapshots[0].id }))
          .status,
      ).toBe(200);
    expect((await call(routes.dxf, p())).status).toBe(200);

    expect(
      (await call(routes.project.DELETE, p(), { method: "DELETE" })).status,
    ).toBe(204);
    expect((await call(routes.network, p())).status).toBe(404);
  }, 300_000);
});
