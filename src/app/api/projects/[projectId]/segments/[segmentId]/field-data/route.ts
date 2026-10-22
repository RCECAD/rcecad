import { segmentFieldDataSchema } from "@/api/contracts/design";
import { updateSegmentFieldData } from "@/api/server/design";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function PUT(
  request: Request,
  context: { params: Promise<{ projectId: string; segmentId: string }> },
) {
  const parsed = segmentFieldDataSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Revise os dados de campo.", issues: parsed.error.issues },
      { status: 400 },
    );
  try {
    const { projectId, segmentId } = await context.params;
    return Response.json(
      await updateSegmentFieldData(projectId, segmentId, parsed.data),
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
