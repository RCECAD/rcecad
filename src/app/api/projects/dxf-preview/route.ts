import { previewDxf } from "@/api/server/design";
import { readDxfUpload } from "@/api/server/dxf-upload";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function POST(request: Request) {
  const upload = await readDxfUpload(request, false);
  if (!upload)
    return Response.json(
      { error: "Selecione um arquivo DXF de até 5 MB." },
      { status: 400 },
    );
  try {
    return Response.json(await previewDxf(upload));
  } catch (error) {
    return routeErrorResponse(error);
  }
}
