import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  MAX_DXF_BYTES,
  projectDetailResponseSchema,
  projectPageResponseSchema,
  projectParametersSchema,
} from "../../src/api/contracts/spring";
import {
  appUrl,
  authenticate,
  bearer,
  createProject,
  dxf,
  login,
  parameters,
  principalToken,
  setSession,
  springUrl,
  testPrefix,
} from "./helpers";

test.afterEach(async ({ context }) => {
  await context.request.post(`${appUrl}/api/auth/logout`);
});

test("API: auth rejects missing/invalid access, rotates refresh and revokes logout", async ({
  request,
}) => {
  expect((await request.get(`${springUrl}/api/projects`)).status()).toBe(401);
  expect(
    (
      await request.post(`${springUrl}/api/auth/login`, {
        data: { ...login, password: "invalid-password" },
      })
    ).status(),
  ).toBe(401);
  expect((await request.get(`${appUrl}/api/projects`)).status()).toBe(401);
  const tokens = await authenticate(request);
  const renewed = await request.post(`${springUrl}/api/auth/refresh`, {
    data: { refreshToken: tokens.refreshToken },
  });
  expect(renewed.status()).toBe(200);
  const rotated = await renewed.json();
  expect(rotated.refreshToken !== tokens.refreshToken).toBe(true);
  expect(
    (
      await request.post(`${springUrl}/api/auth/logout`, {
        data: { refreshToken: rotated.refreshToken },
      })
    ).status(),
  ).toBe(204);
  expect(
    (
      await request.post(`${springUrl}/api/auth/refresh`, {
        data: { refreshToken: rotated.refreshToken },
      })
    ).status(),
  ).toBe(401);
});

test("API: project CRUD, filters, pagination, ownership and Spring contracts", async ({
  context,
}) => {
  const tokens = await setSession(context);
  const api = context.request;
  const project = await createProject(api, "API");
  const data = {
    name: `${project.name} editado`,
    contractor: "Prefeitura teste",
    technicalManager: "Engenheiro teste",
    location: "Cascavel, PR",
    status: "inProgress",
  };
  const updated = await api.put(`/api/projects/${project.id}/general-data`, {
    data,
  });
  expect(updated.status()).toBe(200);
  expect(await updated.json()).toEqual(data);
  const detail = await api.get(`${springUrl}/api/projects/${project.id}`, {
    headers: bearer(tokens.accessToken),
  });
  const parsed = projectDetailResponseSchema.parse(await detail.json());
  expect(parsed.project).toMatchObject(data);
  expect(parsed.segments).toEqual([]);
  const listing = await api.get(`${springUrl}/api/projects`, {
    params: { search: project.name, status: "inProgress", size: 1, page: 0 },
    headers: bearer(tokens.accessToken),
  });
  const page = projectPageResponseSchema.parse(await listing.json());
  expect(page.content.map((item) => item.id)).toEqual([project.id]);
  expect(page.totalElements).toBe(1);
  const empty = await api.get(
    `/api/projects?search=${encodeURIComponent(project.name)}&size=1&page=1`,
  );
  expect((await empty.json()).content).toEqual([]);
  const other = bearer(principalToken());
  expect(
    (
      await api.get(`${springUrl}/api/projects/${project.id}`, {
        headers: other,
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await api.put(`${springUrl}/api/projects/${project.id}`, {
        headers: other,
        data,
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await api.get(`${springUrl}/api/projects`, {
        headers: bearer(principalToken({ permissions: [] })),
      })
    ).status(),
  ).toBe(403);
  for (const suffix of ["", "/general-data", "/hydraulics"]) {
    expect(
      (await api.get(`/api/projects/${randomUUID()}${suffix}`)).status(),
    ).toBe(404);
  }
});

test("API: initial hydraulics, nullable fields, unit values and persistence", async ({
  context,
}) => {
  const tokens = await setSession(context);
  const api = context.request;
  const project = await createProject(api, "Hidráulica");
  const initial = await api.get(`/api/projects/${project.id}/hydraulics`);
  expect(initial.status()).toBe(200);
  expect(await initial.json()).toBeNull();
  const target = `/api/projects/${project.id}/hydraulics`;
  expect((await api.put(target, { data: parameters })).status()).toBe(200);
  const direct = await api.get(
    `${springUrl}/api/projects/${project.id}/parameters`,
    { headers: bearer(tokens.accessToken) },
  );
  expect(projectParametersSchema.parse(await direct.json())).toEqual(
    parameters,
  );
  const changed = {
    ...parameters,
    infiltrationRate: 0.1,
    manningCoefficient: 0.013,
    defaultNetworkMaterial: null,
  };
  expect((await api.put(target, { data: changed })).status()).toBe(200);
  expect(await (await api.get(target)).json()).toEqual(changed);
  for (const invalid of [
    { returnCoefficient: 0 },
    { initialPopulation: -1 },
    { finalPopulation: 1.5 },
    { defaultNetworkMaterial: " " },
  ]) {
    expect(
      (await api.put(target, { data: { ...parameters, ...invalid } })).status(),
    ).toBe(400);
  }
});

test("API: invalid JSON/fields return safe errors without creating records", async ({
  context,
}) => {
  const tokens = await setSession(context);
  const api = context.request;
  const missing = randomUUID();
  for (const [method, path] of [
    ["POST", "/api/projects"],
    ["POST", "/api/projects/import-dxf"],
    ["PUT", `/api/projects/${missing}/general-data`],
    ["PUT", `/api/projects/${missing}/hydraulics`],
  ]) {
    const response = await api.fetch(path, {
      method,
      data: "{",
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(400);
    const body = await response.text();
    expect(body).not.toMatch(
      /developerMessage|stackTrace|accessToken|refreshToken/,
    );
  }
  for (const query of ["page=-1", "size=101", "status=invalid"]) {
    expect((await api.get(`/api/projects?${query}`)).status()).toBe(400);
  }
  const invalid = await api.post(`${springUrl}/api/projects`, {
    headers: bearer(tokens.accessToken),
    data: { name: "" },
  });
  expect(invalid.status()).toBe(422);
  expect(
    (
      await api.post("/api/projects", {
        data: {
          name: "x".repeat(201),
          contractor: null,
          technicalManager: null,
          location: null,
        },
      })
    ).status(),
  ).toBe(400);
});

test("API: DXF topology, byte limits and atomic rejection of invalid imports", async ({
  context,
}) => {
  const tokens = await setSession(context);
  const api = context.request;
  const name = `${testPrefix} DXF API`;
  const result = await api.post("/api/projects/import-dxf", {
    data: { name, dxf },
  });
  expect(result.status()).toBe(201);
  const project = await result.json();
  console.log(`Fixture: ${name} | ${project.id}`);
  expect(project.totalSegments).toBe(1);
  const detail = projectDetailResponseSchema.parse(
    await (
      await api.get(`${springUrl}/api/projects/${project.id}`, {
        headers: bearer(tokens.accessToken),
      })
    ).json(),
  );
  expect(detail.nodes).toHaveLength(2);
  expect(detail.segments).toHaveLength(1);
  const exported = await api.get(
    `${springUrl}/api/projects/${project.id}/export-dxf`,
    { headers: bearer(tokens.accessToken) },
  );
  expect(await exported.text()).toBe(dxf);
  for (const invalid of [
    "",
    "0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n",
    dxf.replace("SANC_REDE", "OTHER"),
    "é".repeat(MAX_DXF_BYTES / 2 + 1),
  ]) {
    const response = await api.post("/api/projects/import-dxf", {
      data: { name: `${name} invalid`, dxf: invalid },
    });
    expect(response.status()).toBe(400);
  }
  const listing = await api.get(
    `/api/projects?search=${encodeURIComponent(`${name} invalid`)}`,
  );
  expect((await listing.json()).totalElements).toBe(0);
});

test("API: concurrent requests with expired access share rotation and persist cookies", async ({
  context,
}) => {
  await setSession(context);
  const project = await createProject(context.request, "Sessão");
  // Warm route modules so this tests requests, not compilation timing.
  const paths = [
    "/api/projects",
    `/api/projects/${project.id}`,
    `/api/projects/${project.id}/general-data`,
    `/api/projects/${project.id}/hydraulics`,
  ];
  await Promise.all(paths.map((path) => context.request.get(path)));
  await context.addCookies([
    {
      name: "rcecad.access_token",
      value: principalToken({ expired: true }),
      url: appUrl,
      httpOnly: true,
    },
  ]);
  const responses = await Promise.all(
    paths.map((path) => context.request.get(path)),
  );
  expect(responses.map((response) => response.status())).toEqual([
    200, 200, 200, 200,
  ]);
  expect((await context.request.get("/api/projects")).status()).toBe(200);
  for (const response of responses) {
    const text = await response.text();
    expect(text).not.toMatch(/accessToken|refreshToken/);
  }
});
