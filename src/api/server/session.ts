import "server-only";

import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "rcecad.access_token";
export const REFRESH_TOKEN_COOKIE = "rcecad.refresh_token";

type TokenCookieOptions = {
  maxAge?: number;
};

export type AuthSession = {
  accessToken?: string;
  refreshToken?: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
};

function getCookieOptions({ maxAge }: TokenCookieOptions = {}) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  };
}

export async function getAuthSession(): Promise<AuthSession> {
  const cookieStore = await cookies();

  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

export async function hasAuthSession(): Promise<boolean> {
  const session = await getAuthSession();
  return Boolean(session.refreshToken);
}

export async function setAuthSession(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    getCookieOptions({ maxAge: tokens.expiresIn }),
  );
  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    getCookieOptions({ maxAge: tokens.refreshExpiresIn }),
  );
}

export async function clearAuthSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}
