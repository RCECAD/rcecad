import { getNonconformityHistory } from "@/api/server/resources";
import { handle } from "@/api/server/route-handler";

type Context = {
  params: Promise<{ projectId: string; nonconformityId: string }>;
};

export async function GET(_request: Request, { params }: Context) {
  const { projectId, nonconformityId } = await params;
  return handle(() => getNonconformityHistory(projectId, nonconformityId));
}
