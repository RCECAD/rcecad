import {
  getProjectParameters,
  updateProjectParameters,
} from "@/api/server/projects";
import { routeErrorResponse } from "@/api/server/route-errors";
import { hydraulicsSchema } from "@/schemas/hydraulics";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    return Response.json(await getProjectParameters(projectId));
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const parsed = hydraulicsSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      {
        error: "Revise os parâmetros informados.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  try {
    const { projectId } = await context.params;
    return Response.json(await updateProjectParameters(projectId, parsed.data));
  } catch (error) {
    return routeErrorResponse(error);
  }
}
