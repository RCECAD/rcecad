/**
 * Pure JWT helpers — no `document`, no `next/headers`. Safe to import from the
 * browser, the Edge proxy, and React Server Components alike.
 *
 * The API issues an RS256 token whose claims are: `sub` (email), `roles`,
 * `permissions`, `iss`, `iat`, `exp`. There is no name/CNPJ claim, so the
 * display name is derived from the email local part.
 */

export const TOKEN_COOKIE = "rcecad_token";

export type JwtPayload = {
  sub: string;
  roles?: string[];
  permissions?: string[];
  iss?: string;
  iat?: number;
  exp?: number;
};

export type Session = {
  token: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
};

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  if (typeof atob === "function") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return Buffer.from(padded, "base64").toString("utf-8");
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload): boolean {
  return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
}

/** Builds a session from a raw token, or null if it is malformed or expired. */
export function sessionFromToken(token: string): Session | null {
  const payload = decodeJwt(token);
  if (!payload?.sub || isTokenExpired(payload)) return null;

  return {
    token,
    email: payload.sub,
    displayName: payload.sub.split("@")[0],
    roles: payload.roles ?? [],
    permissions: payload.permissions ?? [],
  };
}
