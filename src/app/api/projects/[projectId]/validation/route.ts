import { validateProject } from "@/api/server/design";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    return Response.json(await validateProject(projectId));
  } catch (error) {
    return routeErrorResponse(error);
  }
}
