import type { z } from "zod";

export class ClientApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

export async function parseClientJson<T>(
  response: Response,
  schema: z.ZodType<T>,
  message: string,
): Promise<T> {
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.assign("/auth/login");
    }

    throw new ClientApiError(message, response.status);
  }

  const payload: unknown = await response.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new ClientApiError(
      "A API retornou dados incompatíveis com o contrato.",
    );
  }

  return parsed.data;
}
