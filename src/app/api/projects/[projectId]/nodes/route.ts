import { nodeRequestSchema } from "@/api/contracts/resources";
import { createNode } from "@/api/server/resources";
import { handleBody } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, { params }: Context) {
  const { projectId } = await params;
  return handleBody(
    request,
    nodeRequestSchema,
    (body) => createNode(projectId, body),
    201,
  );
}
