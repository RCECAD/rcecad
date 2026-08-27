import { routeErrorResponse } from "@/api/server/route-errors";
import { refreshSpringSession } from "@/api/server/spring-client";

export async function POST() {
  try {
    const tokens = await refreshSpringSession();

    if (!tokens) {
      return Response.json({ error: "Sessao expirada." }, { status: 401 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
