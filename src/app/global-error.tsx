"use client";

import { useEffect } from "react";
import "./globals.css";
import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({
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
    <html lang="pt-BR">
      <body>
        <main>
          <ErrorState
            title="Não foi possível abrir o sistema"
            description="Ocorreu uma falha inesperada. Tente novamente ou volte à página de acesso."
            onRetry={retry}
            actions={[{ label: "Ir para o login", href: "/auth/login" }]}
          />
        </main>
      </body>
    </html>
  );
}
