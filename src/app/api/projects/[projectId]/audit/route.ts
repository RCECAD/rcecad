import { listProjectAudit } from "@/api/server/resources";
import { handle } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string }> };

const allowedParameters = new Set([
  "query",
  "from",
  "to",
  "operations",
  "areas",
  "entityTypes",
  "actorId",
  "cursor",
]);

export async function GET(request: Request, { params }: Context) {
  const { projectId } = await params;
  const incoming = new URL(request.url).searchParams;
  const outgoing = new URLSearchParams();

  for (const [key, value] of incoming) {
    if (allowedParameters.has(key) && value.trim()) outgoing.append(key, value);
  }
  const requestedSize = Number(incoming.get("size") ?? 20);
  outgoing.set(
    "size",
    String(
      Number.isInteger(requestedSize)
        ? Math.min(Math.max(requestedSize, 1), 50)
        : 20,
    ),
  );

  return handle(() => listProjectAudit(projectId, outgoing.toString()));
}
