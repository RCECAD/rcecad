"use server";

import { getServerSession } from "@/lib/auth/session";
import {
  type ApiProjectParameters,
  updateParameters,
} from "@/lib/projects/projects-api";

/** Stores the project's design parameters via the API. */
export async function saveProjectParameters(
  projectId: string,
  parameters: ApiProjectParameters,
): Promise<void> {
  const session = await getServerSession();
  await updateParameters(projectId, parameters, session?.token);
}
