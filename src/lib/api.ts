/**
 * Thin HTTP client for the RCECAD Spring API.
 *
 * Base URL comes from NEXT_PUBLIC_API_URL (defaults to the local Spring port).
 * Auth is sent via the `Authorization: Bearer <token>` header — the API is a
 * stateless OAuth2 resource server, so no cookies are sent to it.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/** Error body shape returned by the API's RestExceptionHandler. */
export type ApiErrorBody = {
  title?: string;
  status?: number;
  details?: string;
  developerMessage?: string;
  timestamp?: string;
  /** Present on validation errors (422). */
  fields?: string;
  fieldsMessage?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  /** Plain object — serialized to JSON automatically. */
  body?: unknown;
  /** Bearer token to attach. */
  token?: string | null;
};

function extractMessage(status: number, body: ApiErrorBody | null): string {
  return (
    body?.details ||
    body?.fieldsMessage ||
    body?.title ||
    `A requisição falhou (HTTP ${status}).`
  );
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, token, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  if (body !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      extractMessage(response.status, payload),
      payload,
    );
  }

  return payload as T;
}
