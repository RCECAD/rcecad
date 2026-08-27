"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function ProtectedError({
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
      title="Não foi possível carregar esta página"
      description="Tente novamente em alguns instantes."
      onRetry={unstableRetry}
    />
  );
}
