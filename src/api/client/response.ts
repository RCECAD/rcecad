import { z } from "zod";
import { apiErrorMessage } from "@/lib/api-feedback";

const zClientError = z.object({
  error: z.string().trim().min(1),
  code: z.string().optional(),
  items: z.array(z.unknown()).optional(),
});

export class ClientApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly items?: unknown[],
    readonly originalMessage?: string,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

export function getErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a operação. Tente novamente.",
): string {
  if (error instanceof ClientApiError) return error.message;
  if (error instanceof TypeError)
    return "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.";
  return fallback;
}

export async function expectNoContent(
  response: Response,
  message: string,
): Promise<void> {
  if (!response.ok) await parseClientJson(response, z.never(), message);
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

    const payload: unknown = await response.json().catch(() => null);
    const error = zClientError.safeParse(payload);
    throw new ClientApiError(
      apiErrorMessage(
        error.success ? error.data.error : undefined,
        error.success ? error.data.code : undefined,
        response.status,
        message,
      ),
      response.status,
      error.success ? error.data.code : undefined,
      error.success ? error.data.items : undefined,
      error.success ? error.data.error : undefined,
    );
  }

  const payload: unknown = await response.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new ClientApiError(
      "Não foi possível ler os dados recebidos. Atualize a página e tente novamente.",
    );
  }

  return parsed.data;
}
