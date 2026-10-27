import { listExports } from "@/api/server/resources";
import { handle } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;
  return handle(() => listExports(projectId));
}
