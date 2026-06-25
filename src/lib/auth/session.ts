import "server-only";

import { cookies } from "next/headers";
import { type Session, sessionFromToken, TOKEN_COOKIE } from "@/lib/auth/jwt";

/**
 * Reads the current session on the server (RSC / server actions) from the
 * token cookie. Returns null when there is no valid, unexpired token.
 */
export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  return token ? sessionFromToken(token) : null;
}
