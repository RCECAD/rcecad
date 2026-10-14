import "server-only";

import { redirect } from "next/navigation";
import { hasAuthSession } from "./session";
import { SpringApiError } from "./spring-client";

/** Server Components can read cookies, but refresh must run in a POST handler. */
export async function springPageRequest<T>(
  load: () => Promise<T>,
  returnTo: string,
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 401) {
      if (!(await hasAuthSession())) redirect("/auth/login");
      redirect(`/auth/refresh?next=${encodeURIComponent(returnTo)}`);
    }
    throw error;
  }
}
