import { nonconformityDecisionRequestSchema } from "@/api/contracts/resources";
import { decideNonconformity } from "@/api/server/resources";
import { handleBody } from "@/api/server/route-handler";

type Context = {
  params: Promise<{ projectId: string; nonconformityId: string }>;
};

export async function POST(request: Request, { params }: Context) {
  const { projectId, nonconformityId } = await params;
  return handleBody(request, nonconformityDecisionRequestSchema, (body) =>
    decideNonconformity(projectId, nonconformityId, body),
  );
}
