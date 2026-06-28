"use server";

import { ApiError } from "@/lib/api";
import { getServerSession } from "@/lib/auth/session";
import {
  type ApiProjectParameters,
  getParameters,
} from "@/lib/projects/projects-api";

/** Reads the project's design parameters, or null when not set yet (API 404). */
export async function getProjectParameters(
  projectId: string,
): Promise<ApiProjectParameters | null> {
  try {
    const session = await getServerSession();
    return await getParameters(projectId, session?.token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}
