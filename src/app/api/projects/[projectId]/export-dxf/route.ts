import { exportOriginalDxf } from "@/api/server/resources";
import { handleFile } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;
  return handleFile(() => exportOriginalDxf(projectId), `${projectId}.dxf`);
}
