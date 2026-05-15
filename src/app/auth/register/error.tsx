"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function RegisterError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Algo deu errado"
      description="Houve um erro ao carregar a página de registro."
      errorMessage={error.message}
      retryLabel="Tentar Novamente"
      onRetry={reset}
    />
  );
}
