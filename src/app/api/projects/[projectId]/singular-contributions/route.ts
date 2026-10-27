import { singularContributionRequestSchema } from "@/api/contracts/resources";
import { createContribution, listContributions } from "@/api/server/resources";
import { handle, handleBody } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { projectId } = await params;
  return handle(() => listContributions(projectId));
}

export async function POST(request: Request, { params }: Context) {
  const { projectId } = await params;
  return handleBody(
    request,
    singularContributionRequestSchema,
    (body) => createContribution(projectId, body),
    201,
  );
}
