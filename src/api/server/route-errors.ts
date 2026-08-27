import "server-only";

import { NextResponse } from "next/server";
import { SpringApiError } from "./spring-client";

export function routeErrorResponse(error: unknown): NextResponse {
  if (error instanceof SpringApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.payload,
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { error: "Erro inesperado ao comunicar com a API." },
    { status: 500 },
  );
}
