import "server-only";

import { NextResponse } from "next/server";
import { springErrorSchema } from "@/api/contracts/spring";
import { SpringApiError } from "./spring-client";

export function routeErrorResponse(error: unknown): NextResponse {
  if (error instanceof SpringApiError) {
    const details = springErrorSchema.safeParse(error.payload);
    const springDetails = details.success ? details.data : undefined;
    const uploadMessage =
      springDetails?.code === "UPLOADS_BUSY"
        ? "Há outros uploads em processamento. Aguarde alguns instantes e tente novamente."
        : error.status === 413
          ? "O arquivo DXF deve ter até 300 MB."
          : undefined;
    const message =
      uploadMessage ??
      (error.status >= 500
        ? error.message
        : (springDetails?.details ??
          springDetails?.title ??
          (error.status === 401
            ? "Sua sessão expirou. Entre novamente para continuar."
            : "Não foi possível concluir a operação com a API.")));

    return NextResponse.json(
      {
        error: message,
        code: springDetails?.code ?? `SPRING_${error.status}`,
        ...(springDetails?.fields || springDetails?.fieldsMessage
          ? {
              fieldErrors: {
                fields: springDetails.fields,
                message: springDetails.fieldsMessage,
              },
            }
          : {}),
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { error: "Erro inesperado ao comunicar com a API." },
    { status: 500 },
  );
}
