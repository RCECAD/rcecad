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

type SessionRequests = {
  active: number;
  refresh?: Promise<SpringAuthTokens | null>;
};

const sessionRequests = new Map<string, SessionRequests>();

function joinSessionRequests(refreshToken: string): SessionRequests {
  const group = sessionRequests.get(refreshToken) ?? { active: 0 };
  group.active++;
  sessionRequests.set(refreshToken, group);
  return group;
}

function leaveSessionRequests(refreshToken: string, group: SessionRequests) {
  group.active--;
  if (group.active === 0) sessionRequests.delete(refreshToken);
}

function getSpringApiBaseUrl(): string {
  return process.env.SPRING_API_BASE_URL ?? "http://localhost:8080";
}

function buildSpringUrl(path: string): URL {
  const base = new URL(getSpringApiBaseUrl());
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const prefix = base.pathname.replace(/\/$/, "");
  const apiPath = `${prefix}${prefix.endsWith("/api") ? "" : "/api"}${normalizedPath}`;

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

  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
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

  let response: Response;
  let payload: unknown;
  try {
    response = await fetch(buildSpringUrl(path), {
      ...init,
      headers,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(30_000),
    });
    payload = await parseJsonResponse(response);
  } catch {
    throw new SpringApiError(
      503,
      "Não foi possível conectar ao backend. Tente novamente.",
    );
  }

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
    return normalizeAuthTokens(payload);
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 401) return null;
    throw error;
  }
}

export async function refreshSpringSession(): Promise<SpringAuthTokens | null> {
  const session = await getAuthSession();
  const refreshToken = session.refreshToken;

  if (!refreshToken) {
    return null;
  }

  const group = joinSessionRequests(refreshToken);
  try {
    return await applySessionRefresh(refreshToken, group);
  } finally {
    leaveSessionRequests(refreshToken, group);
  }
}

async function applySessionRefresh(
  refreshToken: string,
  group: SessionRequests,
) {
  group.refresh ??= refreshSession(refreshToken);
  const tokens = await group.refresh;
  // Each HTTP response must receive cookies, even when it shares the refresh.
  if (tokens) await setAuthSession(tokens);
  else await clearAuthSession();
  return tokens;
}

export async function springRequestWithRefresh<T>(
  path: string,
  init: RequestInit = {},
  options: SpringRequestOptions<T>,
): Promise<T> {
  const session = options.auth === false ? undefined : await getAuthSession();
  const refreshToken = session?.refreshToken;
  // Enroll before fetching so a slow 401 can reuse rotation from a faster request.
  // Tokens are retained only until all overlapping requests have completed.
  const group = refreshToken ? joinSessionRequests(refreshToken) : undefined;
  try {
    try {
      return await requestSpring<T>(path, init, options);
    } catch (error) {
      if (
        !(error instanceof SpringApiError) ||
        error.status !== 401 ||
        !refreshToken ||
        !group
      ) {
        throw error;
      }

      const tokens = await applySessionRefresh(refreshToken, group);
      if (!tokens) throw error;

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
  } finally {
    if (refreshToken && group) leaveSessionRequests(refreshToken, group);
  }
}
