import { readDxfUpload } from "@/api/server/dxf-upload";
import { importDxf } from "@/api/server/projects";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function POST(request: Request) {
  const upload = await readDxfUpload(request, true);
  if (!upload) {
    return Response.json(
      { error: "Informe o nome e um arquivo DXF de até 5 MB." },
      { status: 400 },
    );
  }
  try {
    return Response.json(await importDxf(upload), { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
