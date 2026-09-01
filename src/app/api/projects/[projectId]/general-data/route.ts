import { routeErrorResponse } from "@/api/server/route-errors";
import {
  SpringApiError,
  springRequestWithRefresh,
} from "@/api/server/spring-client";
import {
  GENERAL_DATA_DEFAULTS,
  type GeneralDataFormValues,
  generalDataSchema,
} from "@/schemas/general-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;
  const path = `/projects/${encodeURIComponent(projectId)}/general-data`;

  try {
    const payload = await springRequestWithRefresh<GeneralDataFormValues>(path);
    return Response.json(payload);
  } catch (error) {
    if (
      error instanceof SpringApiError &&
      (error.status === 401 || error.status === 404)
    ) {
      return Response.json(GENERAL_DATA_DEFAULTS);
    }

    return routeErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params;
  const parsed = generalDataSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      { error: "Revise os dados informados." },
      { status: 400 },
    );
  }

  const path = `/projects/${encodeURIComponent(projectId)}/general-data`;

  try {
    const payload = await springRequestWithRefresh<GeneralDataFormValues>(
      path,
      {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      },
    );

    return Response.json(payload);
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 401) {
      return Response.json(parsed.data);
    }

    return routeErrorResponse(error);
  }
}
