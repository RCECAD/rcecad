"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function RegisterError({
  error,
  unstable_retry: unstableRetry,
}: Readonly<{
  error: Error & { digest?: string };
  unstable_retry: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Não foi possível carregar o cadastro"
      description="Tente novamente em alguns instantes ou acesse uma conta existente."
      onRetry={unstableRetry}
      actions={[{ label: "Ir para o login", href: "/auth/login" }]}
    />
  );
}
