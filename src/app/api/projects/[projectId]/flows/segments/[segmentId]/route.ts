import { dischargeOverrideRequestSchema } from "@/api/contracts/resources";
import { informDischarge } from "@/api/server/resources";
import { handleBody } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string; segmentId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const { projectId, segmentId } = await params;
  return handleBody(request, dischargeOverrideRequestSchema, (body) =>
    informDischarge(projectId, segmentId, body),
  );
}
