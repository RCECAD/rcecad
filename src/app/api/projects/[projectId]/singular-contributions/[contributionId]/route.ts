import { singularContributionRequestSchema } from "@/api/contracts/resources";
import { deleteContribution, updateContribution } from "@/api/server/resources";
import { handle, handleBody } from "@/api/server/route-handler";

type Context = {
  params: Promise<{ projectId: string; contributionId: string }>;
};

export async function PUT(request: Request, { params }: Context) {
  const { projectId, contributionId } = await params;
  return handleBody(request, singularContributionRequestSchema, (body) =>
    updateContribution(projectId, contributionId, body),
  );
}

export async function DELETE(_request: Request, { params }: Context) {
  const { projectId, contributionId } = await params;
  return handle(() => deleteContribution(projectId, contributionId));
}
