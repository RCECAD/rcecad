import { withDxfUpload } from "@/api/server/dxf-upload";
import { importDxf } from "@/api/server/projects";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function POST(request: Request) {
  try {
    return Response.json(await withDxfUpload(request, importDxf), {
      status: 201,
    });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
