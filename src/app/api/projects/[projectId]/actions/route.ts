import { listProjectActions } from "@/api/server/resources";
import { handle } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Context) {
  const { projectId } = await params;
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 10);
  const safeLimit = Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), 100)
    : 10;
  return handle(() => listProjectActions(projectId, safeLimit));
}
