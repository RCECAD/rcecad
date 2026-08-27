import { logoutFromSpring } from "@/api/server/auth";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function POST() {
  try {
    await logoutFromSpring();
    return Response.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
