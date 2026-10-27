import { deleteWaiver } from "@/api/server/resources";
import { handle } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string; waiverId: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const { projectId, waiverId } = await params;
  return handle(() => deleteWaiver(projectId, waiverId));
}
