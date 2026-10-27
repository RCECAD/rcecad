import { nonconformityStatusSchema } from "@/api/contracts/resources";
import { listNonconformities } from "@/api/server/resources";
import { handle } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Context) {
  const { projectId } = await params;
  const status = new URL(request.url).searchParams.get("status");
  const parsed = status
    ? nonconformityStatusSchema.safeParse(status)
    : undefined;
  if (parsed && !parsed.success)
    return Response.json(
      { error: "Status de não conformidade inválido." },
      { status: 400 },
    );
  return handle(() => listNonconformities(projectId, parsed?.data));
}
