import "server-only";

import type { z } from "zod";
import { routeErrorResponse } from "./route-errors";
import type { SpringFile } from "./spring-client";

export async function handle(
  run: () => Promise<unknown>,
  status = 200,
): Promise<Response> {
  try {
    const data = await run();
    return data === null || data === undefined
      ? new Response(null, { status: 204 })
      : Response.json(data, { status });
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function handleBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  run: (body: T) => Promise<unknown>,
  status = 200,
): Promise<Response> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Revise os dados informados.", issues: parsed.error.issues },
      { status: 400 },
    );
  return handle(() => run(parsed.data), status);
}

export async function handleFile(
  run: () => Promise<SpringFile>,
  fallbackName: string,
): Promise<Response> {
  try {
    const file = await run();
    const name = file.fileName ?? fallbackName;
    return new Response(file.bytes, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      },
    });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
