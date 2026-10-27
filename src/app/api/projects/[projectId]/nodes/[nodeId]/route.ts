import { nodeRequestSchema } from "@/api/contracts/resources";
import { deleteNode, updateNode } from "@/api/server/resources";
import { handle, handleBody } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string; nodeId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const { projectId, nodeId } = await params;
  return handleBody(request, nodeRequestSchema, (body) =>
    updateNode(projectId, nodeId, body),
  );
}

export async function DELETE(_request: Request, { params }: Context) {
  const { projectId, nodeId } = await params;
  return handle(() => deleteNode(projectId, nodeId));
}
