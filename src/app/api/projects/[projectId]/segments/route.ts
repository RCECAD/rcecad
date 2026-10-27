import { segmentRequestSchema } from "@/api/contracts/resources";
import { createSegment } from "@/api/server/resources";
import { handleBody } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, { params }: Context) {
  const { projectId } = await params;
  return handleBody(
    request,
    segmentRequestSchema,
    (body) => createSegment(projectId, body),
    201,
  );
}
