import { getProjectById } from "@/api/server/projects";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const project = await getProjectById(projectId, { refresh: true });

    if (!project) {
      return Response.json(
        { error: "Projeto nao encontrado." },
        { status: 404 },
      );
    }

    return Response.json(project);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
