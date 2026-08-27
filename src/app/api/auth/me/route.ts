import { getCurrentUserWithRefresh } from "@/api/server/auth";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function GET() {
  try {
    const user = await getCurrentUserWithRefresh();
    return Response.json(user);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
