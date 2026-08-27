import { getHomeProjects } from "@/api/server/projects";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function GET() {
  try {
    const payload = await getHomeProjects({ refresh: true });
    return Response.json(payload);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
