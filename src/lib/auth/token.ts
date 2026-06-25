/**
 * Browser-side token storage. The JWT is kept in a cookie (not httpOnly) so
 * that both the client (for the Bearer header) and the Edge proxy (for route
 * gating) can read it. Acceptable for this project; revisit if XSS hardening
 * becomes a requirement.
 */

import { TOKEN_COOKIE } from "@/lib/auth/jwt";

export function persistToken(token: string, maxAgeSeconds: number): void {
  // biome-ignore lint/suspicious/noDocumentCookie: the token cookie must be a plain cookie readable by the Edge proxy and the client; the async Cookie Store API does not fit this sync flow.
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export function readToken(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function removeToken(): void {
  // biome-ignore lint/suspicious/noDocumentCookie: see persistToken — sync cookie write required for proxy/client parity.
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
