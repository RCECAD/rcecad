"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function ErrorPage({
  error,
  unstable_retry: retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <ErrorState
      title="Não foi possível carregar esta página"
      description="Tente novamente em alguns instantes ou volte à página inicial."
      onRetry={retry}
      actions={[
        { label: "Voltar aos projetos", href: "/home" },
        { label: "Ir para o login", href: "/auth/login" },
      ]}
    />
  );
}
