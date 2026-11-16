import { segmentFieldDataBatchSchema } from "@/api/contracts/design";
import { updateSegmentFieldDataBatch } from "@/api/server/design";
import { routeErrorResponse } from "@/api/server/route-errors";
import { portugueseValidation } from "@/lib/form-validation";

export async function PUT(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const parsed = segmentFieldDataBatchSchema.safeParse(
    await request.json().catch(() => null),
    portugueseValidation,
  );
  if (!parsed.success) {
    return Response.json(
      {
        error: "Revise os dados dos trechos antes de salvar.",
        fieldErrors: {
          fields: parsed.error.issues
            .map((issue) => issue.path.join("."))
            .join(", "),
          message: parsed.error.issues.map((issue) => issue.message).join(", "),
        },
      },
      { status: 400 },
    );
  }
  try {
    const { projectId } = await context.params;
    return Response.json(
      await updateSegmentFieldDataBatch(projectId, parsed.data),
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
