import { nodeFieldDataSchema } from "@/api/contracts/design";
import { updateNodeFieldData } from "@/api/server/design";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function PUT(
  request: Request,
  context: { params: Promise<{ projectId: string; nodeId: string }> },
) {
  const parsed = nodeFieldDataSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Revise os dados de campo.", issues: parsed.error.issues },
      { status: 400 },
    );
  try {
    const { projectId, nodeId } = await context.params;
    return Response.json(
      await updateNodeFieldData(projectId, nodeId, parsed.data),
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
