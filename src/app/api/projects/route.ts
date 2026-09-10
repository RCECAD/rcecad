import { projectListQuerySchema } from "@/api/contracts/spring";
import { listProjects } from "@/api/server/projects";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = projectListQuerySchema.safeParse({
    page: searchParams.has("page") ? Number(searchParams.get("page")) : 0,
    size: searchParams.has("size") ? Number(searchParams.get("size")) : 20,
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Revise os filtros informados.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    return Response.json(await listProjects(parsed.data, { refresh: true }));
  } catch (error) {
    return routeErrorResponse(error);
  }
}
