import { routeErrorResponse } from "@/api/server/route-errors";
import {
  SpringApiError,
  springRequestWithRefresh,
} from "@/api/server/spring-client";
import type { HydraulicsFormValues } from "@/schemas/hydraulics";
import { SYSTEM_DEFAULTS } from "@/utils/constants";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;
  const path = `/projects/${encodeURIComponent(projectId)}/hydraulics`;

  try {
    const payload = await springRequestWithRefresh<HydraulicsFormValues>(path);
    return Response.json(payload);
  } catch (error) {
    if (
      error instanceof SpringApiError &&
      (error.status === 401 || error.status === 404)
    ) {
      return Response.json(SYSTEM_DEFAULTS);
    }

    return routeErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;
  const values = (await request.json()) as HydraulicsFormValues;
  const path = `/projects/${encodeURIComponent(projectId)}/hydraulics`;

  try {
    const payload = await springRequestWithRefresh<HydraulicsFormValues>(path, {
      method: "PUT",
      body: JSON.stringify(values),
    });

    return Response.json(payload);
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 401) {
      return Response.json(values);
    }

    return routeErrorResponse(error);
  }
}
