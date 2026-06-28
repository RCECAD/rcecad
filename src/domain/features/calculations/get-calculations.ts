"use server";

import { ApiError } from "@/lib/api";
import { getServerSession } from "@/lib/auth/session";
import {
  type ApiSegmentCalculation,
  getCalculations,
} from "@/lib/projects/projects-api";

/**
 * Runs the project's hydraulic calculations via the API. Returns null when the parameters are
 * not set yet (the API answers 404), so the screen can prompt the user to configure them.
 */
export async function getProjectCalculations(
  projectId: string,
): Promise<ApiSegmentCalculation[] | null> {
  try {
    const session = await getServerSession();
    return await getCalculations(projectId, session?.token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}
