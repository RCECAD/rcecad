import "server-only";

import type { z } from "zod";
import { loginResponseSchema } from "@/api/contracts/spring";
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
} from "@/api/server/session";

type SpringRequestOptions<T> = {
  schema: z.ZodType<T>;
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

export class SpringContractError extends SpringApiError {
  constructor(payload: unknown) {
    super(502, "A API retornou dados incompatíveis com o contrato.", payload);
    this.name = "SpringContractError";
  }
}

const refreshInFlight = new Map<string, Promise<SpringAuthTokens | null>>();

function getSpringApiBaseUrl(): string {
  return process.env.SPRING_API_BASE_URL ?? "http://localhost:8080";
}

function buildSpringUrl(path: string): URL {
  const base = new URL(getSpringApiBaseUrl());
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const prefix = base.pathname.replace(/\/$/, "");
  const apiPath = prefix.endsWith("/api")
    ? `${prefix}${normalizedPath}`
    : `/api${normalizedPath}`;

  return new URL(apiPath, base.origin);
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

export function normalizeAuthTokens(payload: unknown): SpringAuthTokens {
  const parsed = loginResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new SpringApiError(500, "Resposta de autenticação inválida", payload);
  }

  return {
    accessToken: parsed.data.accessToken,
    refreshToken: parsed.data.refreshToken,
    expiresIn: parsed.data.expiresIn,
    refreshExpiresIn: parsed.data.refreshExpiresIn,
  };
}

async function requestSpring<T>(
  path: string,
  init: RequestInit = {},
  options: SpringRequestOptions<T>,
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
      throw new SpringApiError(401, "Sessão não autenticada");
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

  const parsed = options.schema.safeParse(payload);

  if (!parsed.success) {
    throw new SpringContractError({
      issues: parsed.error.issues,
      payload,
    });
  }

  return parsed.data;
}

export async function springRequest<T>(
  path: string,
  init: RequestInit = {},
  options: SpringRequestOptions<T>,
): Promise<T> {
  return requestSpring<T>(path, init, options);
}

async function refreshSession(
  refreshToken: string,
): Promise<SpringAuthTokens | null> {
  try {
    const payload = await requestSpring(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      },
      { auth: false, schema: loginResponseSchema },
    );
    const tokens = normalizeAuthTokens(payload);
    await setAuthSession(tokens);

    return tokens;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function refreshSpringSession(): Promise<SpringAuthTokens | null> {
  const session = await getAuthSession();
  const refreshToken = session.refreshToken;

  if (!refreshToken) {
    return null;
  }

  const inFlight = refreshInFlight.get(refreshToken);

  if (inFlight) {
    return inFlight;
  }

  const refresh = refreshSession(refreshToken);
  refreshInFlight.set(refreshToken, refresh);

  try {
    return await refresh;
  } finally {
    if (refreshInFlight.get(refreshToken) === refresh) {
      refreshInFlight.delete(refreshToken);
    }
  }
}

export async function springRequestWithRefresh<T>(
  path: string,
  init: RequestInit = {},
  options: SpringRequestOptions<T>,
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

    try {
      return await requestSpring<T>(path, init, {
        ...options,
        accessToken: tokens.accessToken,
      });
    } catch (retryError) {
      if (retryError instanceof SpringApiError && retryError.status === 401) {
        await clearAuthSession();
      }

      throw retryError;
    }
  }
}
