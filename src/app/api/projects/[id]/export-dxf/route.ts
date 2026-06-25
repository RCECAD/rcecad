import type { NextRequest } from "next/server";
import { API_BASE_URL } from "@/lib/api";
import { getServerSession } from "@/lib/auth/session";

// PENDING (API Phase 2): proxies to GET /api/projects/{id}/export-dxf on the back-end,
// which serves the original DXF. The endpoint does not exist yet.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession();

  const response = await fetch(
    `${API_BASE_URL}/api/projects/${id}/export-dxf`,
    {
      headers: session?.token
        ? { Authorization: `Bearer ${session.token}` }
        : {},
    },
  );

  if (!response.ok) {
    return new Response("DXF original não disponível para este projeto", {
      status: response.status,
    });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition":
        response.headers.get("content-disposition") ??
        `attachment; filename="${id}.dxf"`,
    },
  });
}
