import {
  createProjectRequestSchema,
  projectListQuerySchema,
} from "@/api/contracts/spring";
import { createProject, listProjects } from "@/api/server/projects";
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

export async function POST(request: Request) {
  const parsed = createProjectRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Revise os dados do projeto." },
      { status: 400 },
    );
  }
  try {
    return Response.json(await createProject(parsed.data), { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
