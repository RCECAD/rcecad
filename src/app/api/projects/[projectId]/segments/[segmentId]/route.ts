import { segmentRequestSchema } from "@/api/contracts/resources";
import { deleteSegment, updateSegment } from "@/api/server/resources";
import { handle, handleBody } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string; segmentId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const { projectId, segmentId } = await params;
  return handleBody(request, segmentRequestSchema, (body) =>
    updateSegment(projectId, segmentId, body),
  );
}

export async function DELETE(_request: Request, { params }: Context) {
  const { projectId, segmentId } = await params;
  return handle(() => deleteSegment(projectId, segmentId));
}
