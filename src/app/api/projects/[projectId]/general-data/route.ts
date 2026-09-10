import { toGeneralDataFormValues } from "@/api/server/project-adapters";
import { getProjectById, updateProject } from "@/api/server/projects";
import { routeErrorResponse } from "@/api/server/route-errors";
import { generalDataSchema } from "@/schemas/general-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const project = await getProjectById(projectId, { refresh: true });

    if (!project) {
      return Response.json(
        { error: "Projeto não encontrado." },
        { status: 404 },
      );
    }

    return Response.json(toGeneralDataFormValues(project));
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const parsed = generalDataSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      { error: "Revise os dados informados.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const { projectId } = await context.params;
    const project = await updateProject(projectId, parsed.data);
    return Response.json(toGeneralDataFormValues(project));
  } catch (error) {
    return routeErrorResponse(error);
  }
}
