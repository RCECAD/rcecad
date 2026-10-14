import { importDxfRequestSchema } from "@/api/contracts/spring";
import { importDxf } from "@/api/server/projects";
import { routeErrorResponse } from "@/api/server/route-errors";

export async function POST(request: Request) {
  const parsed = importDxfRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Informe o nome e um arquivo DXF de até 5 MB." },
      { status: 400 },
    );
  }
  try {
    return Response.json(await importDxf(parsed.data), { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
