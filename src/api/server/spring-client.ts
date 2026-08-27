import "server-only";

import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
} from "@/api/server/session";

type JsonRecord = Record<string, unknown>;

type SpringRequestOptions = {
  auth?: boolean;
  accessToken?: string;
};

export type SpringAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
};

export class SpringApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "SpringApiError";
    this.status = status;
    this.payload = payload;
  }
}

function getSpringApiBaseUrl(): string {
  return process.env.SPRING_API_BASE_URL ?? "http://localhost:8080";
}

function buildSpringUrl(path: string): URL {
  const baseUrl = getSpringApiBaseUrl();
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return new URL(normalizedPath, normalizedBase);
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getStringField(record: JsonRecord, keys: Array<string>) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

function getNumberField(record: JsonRecord, keys: Array<string>) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") {
      return value;
    }
  }

  return undefined;
}

export function normalizeAuthTokens(payload: unknown): SpringAuthTokens {
  if (!isJsonRecord(payload)) {
    throw new SpringApiError(500, "Resposta de autenticacao invalida", payload);
  }

  const accessToken = getStringField(payload, [
    "accessToken",
    "access_token",
    "token",
  ]);
  const refreshToken = getStringField(payload, [
    "refreshToken",
    "refresh_token",
  ]);

  if (!accessToken || !refreshToken) {
    throw new SpringApiError(500, "Tokens nao retornados pelo Spring", payload);
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: getNumberField(payload, ["expiresIn", "expires_in"]),
    refreshExpiresIn: getNumberField(payload, [
      "refreshExpiresIn",
      "refresh_expires_in",
    ]),
  };
}

async function requestSpring<T>(
  path: string,
  init: RequestInit = {},
  options: SpringRequestOptions = {},
): Promise<T> {
  const { auth = true } = options;
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const session = await getAuthSession();
    const accessToken = options.accessToken ?? session.accessToken;

    if (!accessToken) {
      throw new SpringApiError(401, "Sessao nao autenticada");
    }

    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(buildSpringUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new SpringApiError(
      response.status,
      `Spring API request failed: ${response.status}`,
      payload,
    );
  }

  return payload as T;
}

export async function springRequest<T>(
  path: string,
  init: RequestInit = {},
  options: SpringRequestOptions = {},
): Promise<T> {
  return requestSpring<T>(path, init, options);
}

export async function refreshSpringSession(): Promise<SpringAuthTokens | null> {
  const session = await getAuthSession();

  if (!session.refreshToken) {
    return null;
  }

  try {
    const payload = await requestSpring<unknown>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      },
      { auth: false },
    );
    const tokens = normalizeAuthTokens(payload);
    await setAuthSession(tokens);

    return tokens;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function springRequestWithRefresh<T>(
  path: string,
  init: RequestInit = {},
  options: SpringRequestOptions = {},
): Promise<T> {
  try {
    return await requestSpring<T>(path, init, options);
  } catch (error) {
    if (!(error instanceof SpringApiError) || error.status !== 401) {
      throw error;
    }

    const tokens = await refreshSpringSession();

    if (!tokens) {
      throw error;
    }

    return requestSpring<T>(path, init, {
      ...options,
      accessToken: tokens.accessToken,
    });
  }
}
