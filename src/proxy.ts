import { type NextRequest, NextResponse } from "next/server";
import { sessionFromToken, TOKEN_COOKIE } from "@/lib/auth/jwt";

const PUBLIC_PATHS = ["/"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/auth");
}

/**
 * Next.js proxy (formerly middleware). Gates protected routes on the presence
 * of a valid, unexpired JWT cookie. The token's signature is NOT verified here
 * (Edge has no RSA public key) — that is the API's job on every request. This
 * is a UX gate, not the security boundary.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const session = token ? sessionFromToken(token) : null;

  if (!isPublicPath(pathname) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (
    session &&
    (pathname === "/auth/login" || pathname === "/auth/register")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
