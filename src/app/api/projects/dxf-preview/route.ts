import { previewDxf } from "@/api/server/design";
import { withDxfUpload } from "@/api/server/dxf-upload";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function POST(request: Request) {
  try {
    return Response.json(await withDxfUpload(request, previewDxf));
  } catch (error) {
    return routeErrorResponse(error);
  }
}
