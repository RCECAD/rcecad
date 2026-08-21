import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [project] = await db
    .select({
      name: projects.name,
      originalDxf: projects.originalDxf,
    })
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) {
    return new Response("Projeto não encontrado", { status: 404 });
  }

  if (!project.originalDxf) {
    return new Response("DXF original não disponível para este projeto", {
      status: 404,
    });
  }

  const filename = `${project.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.dxf`;

  return new Response(project.originalDxf, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
