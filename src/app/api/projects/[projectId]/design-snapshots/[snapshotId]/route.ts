import { getDesignSnapshot } from "@/api/server/resources";
import { handle } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string; snapshotId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { projectId, snapshotId } = await params;
  return handle(() => getDesignSnapshot(projectId, snapshotId));
}
