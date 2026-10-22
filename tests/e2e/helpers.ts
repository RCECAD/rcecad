import { randomUUID, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  type APIRequestContext,
  type BrowserContext,
  expect,
} from "@playwright/test";
import { loginResponseSchema } from "../../src/api/contracts/spring";

export const appUrl = process.env.E2E_APP_URL ?? "http://localhost:3001";
export const springUrl = process.env.E2E_SPRING_URL ?? "http://localhost:8080";
export const testPrefix = `Regressão E2E ${Date.now()}`;
export const login = {
  email: process.env.E2E_EMAIL ?? "admin@rcecad.com",
  password: process.env.E2E_PASSWORD ?? "admin123",
};

for (const url of [appUrl, springUrl]) {
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)) {
    throw new Error("This suite creates fixtures and must use local servers.");
  }
}

export async function authenticate(api: APIRequestContext) {
  const response = await api.post(`${springUrl}/api/auth/login`, {
    data: login,
  });
  expect(response.status()).toBe(200);
  const payload = await response.json();
  // Never include token values in an assertion failure.
  expect(loginResponseSchema.safeParse(payload).success).toBe(true);
  return loginResponseSchema.parse(payload);
}

export async function setSession(context: BrowserContext) {
  const tokens = await authenticate(context.request);
  await context.addCookies([
    {
      name: "rcecad.access_token",
      value: tokens.accessToken,
      url: appUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "rcecad.refresh_token",
      value: tokens.refreshToken,
      url: appUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  return tokens;
}

export function bearer(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

/** Local JWT fixture for ownership/expiry tests; never written to disk or logs. */
export function principalToken({
  expired = false,
  permissions = ["MANAGE_PROJECT"],
}: {
  expired?: boolean;
  permissions?: string[];
} = {}) {
  const privateKey = readFileSync(
    process.env.E2E_PRIVATE_KEY_PATH ??
      resolve(
        process.env.E2E_BACKEND_DIR ?? "../rcecad-back",
        "rcecad/src/main/resources/certs/private_key.pem",
      ),
  );
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "rcecad",
      sub: "e2e-principal",
      uid: randomUUID(),
      roles: ["USER"],
      permissions,
      iat: now - 3600,
      exp: expired ? now - 120 : now + 300,
    }),
  ).toString("base64url");
  const message = `${header}.${payload}`;
  return `${message}.${sign("RSA-SHA256", Buffer.from(message), privateKey).toString("base64url")}`;
}

export const parameters = {
  justification: null,
  initialPopulation: 100,
  finalPopulation: 200,
  returnCoefficient: 0.8,
  perCapitaFlow: 200,
  infiltrationRate: null,
  peakDailyFactor: 1.2,
  peakHourlyFactor: 1.5,
  manningCoefficient: null,
  defaultNetworkMaterial: "PVC JEI",
};

export const dxf = [
  "0",
  "SECTION",
  "2",
  "ENTITIES",
  "0",
  "LINE",
  "8",
  "SANC_REDE",
  "10",
  "0.0",
  "20",
  "0.0",
  "30",
  "100.0",
  "11",
  "10.0",
  "21",
  "0.0",
  "31",
  "99.5",
  "1001",
  "NUMEROTRE",
  "1000",
  "T-01",
  "1000",
  "PV-01",
  "1000",
  "asphalt",
  "0",
  "ENDSEC",
  "0",
  "EOF",
  "",
].join("\n");

export async function createProject(api: APIRequestContext, label: string) {
  const response = await api.post(`${appUrl}/api/projects`, {
    data: {
      name: `${testPrefix} ${label}`,
      contractor: null,
      technicalManager: null,
      location: null,
    },
  });
  expect(response.status()).toBe(201);
  const project = await response.json();
  console.log(`Fixture: ${project.name} | ${project.id}`);
  return project as { id: string; name: string };
}
