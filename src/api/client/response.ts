import { z } from "zod";

const zClientError = z.object({
  error: z.string().min(1),
  code: z.string().optional(),
});
const errorMessages: Record<string, string> = {
  DXF_INVALID_FORMAT: "Exporte o desenho no formato DXF de texto (ASCII).",
  DXF_CORRUPTED:
    "O arquivo DXF está incompleto ou corrompido. Confira o desenho e tente novamente.",
  DXF_NO_NETWORK:
    "O DXF não contém uma rede compatível. Confira as camadas e os identificadores dos trechos.",
};

export class ClientApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
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

    const payload: unknown = await response.json().catch(() => null);
    const error = zClientError.safeParse(payload);
    throw new ClientApiError(
      error.success
        ? (errorMessages[error.data.code ?? ""] ?? error.data.error)
        : message,
      response.status,
      error.success ? error.data.code : undefined,
    );
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
